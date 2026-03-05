import { spawn, type ChildProcess } from 'child_process'
import path from 'path'
import { existsSync } from 'fs'
import { eventBus } from './event-bus'

export type BuildStep =
  | 'idle'
  | 'sync'
  | 'build'
  | 'deploy'
  | 'healthcheck'
  | 'done'
  | 'error'

export interface BuildState {
  status: BuildStep
  running: boolean
  startedAt: number | null
  finishedAt: number | null
  error: string | null
  imageTag: string | null
  logs: string[]
}

export interface RebuildOptions {
  sync?: boolean
  deploy?: boolean
  openclawSrc?: string
  imageName?: string
  containerName?: string
  port?: number
}

type LogListener = (line: string) => void

const DEFAULT_OPENCLAW_SRC = path.resolve(process.cwd(), '../openclaw')
const DEFAULT_IMAGE_NAME = 'agentplatform'
const DEFAULT_CONTAINER_NAME = 'agentplatform'
const DEFAULT_PORT = 4000

let currentBuild: BuildState = {
  status: 'idle',
  running: false,
  startedAt: null,
  finishedAt: null,
  error: null,
  imageTag: null,
  logs: [],
}

let currentProcess: ChildProcess | null = null
const logListeners = new Set<LogListener>()

const MAX_LOG_LINES = 2000

export function getBuildState(): BuildState {
  return { ...currentBuild, logs: [...currentBuild.logs] }
}

export function onBuildLog(listener: LogListener): () => void {
  logListeners.add(listener)
  return () => logListeners.delete(listener)
}

function emitLog(line: string) {
  currentBuild.logs.push(line)
  // Trim in bulk when 20% over limit to avoid per-line allocations
  if (currentBuild.logs.length > MAX_LOG_LINES * 1.2) {
    currentBuild.logs.splice(0, currentBuild.logs.length - MAX_LOG_LINES)
  }
  logListeners.forEach((fn) => fn(line))
}

function setStep(step: BuildStep) {
  currentBuild.status = step
  emitLog(`\n==> Step: ${step}`)
}

function runCommand(
  cmd: string,
  args: string[],
  opts?: { cwd?: string; env?: Record<string, string> },
): Promise<number> {
  return new Promise((resolve, reject) => {
    emitLog(`$ ${cmd} ${args.join(' ')}`)

    const proc = spawn(cmd, args, {
      cwd: opts?.cwd ?? process.cwd(),
      env: { ...process.env, ...opts?.env },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    currentProcess = proc

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach(emitLog)
    })

    proc.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach(emitLog)
    })

    proc.on('close', (code) => {
      currentProcess = null
      resolve(code ?? 0)
    })

    proc.on('error', (err) => {
      currentProcess = null
      reject(err)
    })
  })
}

export function cancelBuild() {
  if (currentProcess) {
    currentProcess.kill('SIGTERM')
    currentProcess = null
  }
  if (currentBuild.running) {
    currentBuild.running = false
    currentBuild.status = 'error'
    currentBuild.error = 'Cancelled by user'
    currentBuild.finishedAt = Date.now()
    emitLog('==> Build cancelled')
  }
}

export async function startRebuild(
  opts: RebuildOptions = {},
): Promise<BuildState> {
  if (currentBuild.running) {
    throw new Error('A build is already running')
  }

  const doSync = opts.sync !== false
  const doDeploy = opts.deploy !== false
  const openclawSrc = opts.openclawSrc || DEFAULT_OPENCLAW_SRC
  const imageName = opts.imageName || DEFAULT_IMAGE_NAME
  const containerName = opts.containerName || DEFAULT_CONTAINER_NAME
  const port = opts.port || DEFAULT_PORT
  const imageTag = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)

  currentBuild = {
    status: 'sync',
    running: true,
    startedAt: Date.now(),
    finishedAt: null,
    error: null,
    imageTag: `${imageName}:${imageTag}`,
    logs: [],
  }

  emitLog(`==> Rebuild started at ${new Date().toISOString()}`)
  emitLog(`    OpenClaw source: ${openclawSrc}`)
  emitLog(`    Image: ${imageName}:${imageTag}`)
  emitLog(`    Deploy: ${doDeploy}`)

  try {
    // ── Step 1: Sync ──
    if (doSync) {
      setStep('sync')

      if (!existsSync(path.join(openclawSrc, 'src'))) {
        throw new Error(`OpenClaw source not found at: ${openclawSrc}`)
      }

      const syncCode = await runCommand('npx', [
        'tsx',
        'scripts/sync-openclaw.ts',
        openclawSrc,
      ])
      if (syncCode !== 0) {
        throw new Error(`Sync failed with exit code ${syncCode}`)
      }
    } else {
      emitLog('==> Skipping sync (--no-sync)')
    }

    // ── Step 2: Docker build ──
    setStep('build')

    const buildCode = await runCommand('docker', [
      'build',
      '-t',
      `${imageName}:${imageTag}`,
      '-t',
      `${imageName}:latest`,
      '.',
    ])
    if (buildCode !== 0) {
      throw new Error(`Docker build failed with exit code ${buildCode}`)
    }

    emitLog(`    Tagged: ${imageName}:${imageTag}`)
    emitLog(`    Tagged: ${imageName}:latest`)

    if (!doDeploy) {
      emitLog('==> Skipping deploy (--no-deploy)')
      currentBuild.status = 'done'
      currentBuild.running = false
      currentBuild.finishedAt = Date.now()
      emitLog('==> Build complete (image only)')
      return getBuildState()
    }

    // ── Step 3: Deploy ──
    setStep('deploy')

    // Stop existing container
    emitLog('    Stopping existing container...')
    await runCommand('docker', ['stop', containerName]).catch(() => {})
    await runCommand('docker', ['rm', containerName]).catch(() => {})

    // Start new container
    const runCode = await runCommand('docker', [
      'run',
      '-d',
      '--name',
      containerName,
      '-p',
      `${port}:3000`,
      '-v',
      '/var/run/docker.sock:/var/run/docker.sock:ro',
      '-v',
      `${process.cwd()}/instances.json:/app/instances.json`,
      '--restart',
      'unless-stopped',
      `${imageName}:latest`,
    ])
    if (runCode !== 0) {
      throw new Error(`Container start failed with exit code ${runCode}`)
    }

    // ── Step 4: Health check ──
    setStep('healthcheck')
    emitLog('    Waiting for container to be ready...')

    let healthy = false
    for (let i = 0; i < 15; i++) {
      try {
        const res = await fetch(`http://localhost:${port}`)
        if (res.ok || res.status < 500) {
          healthy = true
          break
        }
      } catch {
        // Not ready yet
      }
      await new Promise((r) => setTimeout(r, 2000))
      emitLog(`    Attempt ${i + 1}/15...`)
    }

    if (healthy) {
      emitLog(`    Container is ready at http://localhost:${port}`)
    } else {
      emitLog(`    WARNING: Container started but not responding yet`)
      emitLog(`    Check: docker logs ${containerName}`)
    }

    // ── Done ──
    setStep('done')
    currentBuild.running = false
    currentBuild.finishedAt = Date.now()
    const elapsed = (
      (currentBuild.finishedAt - currentBuild.startedAt!) /
      1000
    ).toFixed(1)
    emitLog(`==> Rebuild complete in ${elapsed}s`)

    eventBus.emit('instance:health', { data: { rebuild: 'complete' } })

    return getBuildState()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    currentBuild.status = 'error'
    currentBuild.running = false
    currentBuild.error = message
    currentBuild.finishedAt = Date.now()
    emitLog(`==> ERROR: ${message}`)
    return getBuildState()
  }
}
