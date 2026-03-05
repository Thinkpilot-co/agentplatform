import { listContainers, getContainerEnvVar } from './docker-monitor'
import { instanceManager } from './instance-manager'
import { eventBus } from './event-bus'
import { createLogger } from './logger'
import type { InstanceConfig } from './types'

const log = createLogger('docker-discovery')

const DISCOVERY_INTERVAL = 15_000 // 15 seconds
let timer: ReturnType<typeof setInterval> | null = null
const discoveredIds = new Set<string>()

export async function discoverOpenClawContainers(): Promise<InstanceConfig[]> {
  const containers = await listContainers(false) // Only running
  const openclawContainers = containers.filter((c) => c.isOpenClaw)
  const newInstances: InstanceConfig[] = []

  log.debug(
    { total: containers.length, openclaw: openclawContainers.length },
    'Discovery scan',
  )

  // Track which IDs are currently active
  const activeIds = new Set<string>()

  for (const container of openclawContainers) {
    const instanceId = `docker-${container.id.slice(0, 12)}`
    activeIds.add(instanceId)

    if (discoveredIds.has(instanceId)) continue

    const port = container.gatewayPort ?? 18789

    // Extract gateway token from container environment
    const token = await getContainerEnvVar(container.id, 'OPENCLAW_GATEWAY_TOKEN')

    const config: InstanceConfig = {
      id: instanceId,
      name: `Docker: ${container.name}`,
      url: `ws://127.0.0.1:${port}`,
      token: token ?? null,
      tags: ['docker', 'auto-discovered'],
    }

    log.info(
      { instanceId, name: container.name, port, url: config.url, hasToken: !!token },
      'Discovered new OpenClaw container',
    )

    discoveredIds.add(instanceId)
    instanceManager.addInstance(config)
    newInstances.push(config)

    eventBus.emit('docker:container:discovered', {
      containerId: container.id,
      instanceId,
      data: { name: container.name, port },
    })
  }

  // Clean up containers that are no longer running
  for (const id of discoveredIds) {
    if (!activeIds.has(id)) {
      log.info(
        { instanceId: id },
        'Container no longer running, removing instance',
      )
      discoveredIds.delete(id)
      instanceManager.removeInstance(id)
      eventBus.emit('docker:container:removed', {
        instanceId: id,
      })
    }
  }

  return newInstances
}

export function startDiscovery() {
  if (timer) return

  log.info({ intervalMs: DISCOVERY_INTERVAL }, 'Starting Docker discovery')

  // Run immediately
  discoverOpenClawContainers().catch((err) => {
    log.error({ err }, 'Initial discovery failed')
  })

  timer = setInterval(() => {
    discoverOpenClawContainers().catch((err) => {
      log.error({ err }, 'Discovery cycle failed')
    })
  }, DISCOVERY_INTERVAL)
}

export function stopDiscovery() {
  if (timer) {
    clearInterval(timer)
    timer = null
    log.info('Docker discovery stopped')
  }
}

export function clearDiscovered() {
  discoveredIds.clear()
}
