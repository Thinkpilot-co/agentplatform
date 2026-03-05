import Docker from 'dockerode'
import type { DockerContainerInfo, PortMapping, ContainerStats } from './types'
import { eventBus } from './event-bus'
import { createLogger } from './logger'

const log = createLogger('docker-monitor')

let docker: Docker | null = null

function getDocker(): Docker {
  if (!docker) {
    const socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
    const host = process.env.DOCKER_HOST

    if (host) {
      const url = new URL(host)
      docker = new Docker({
        host: url.hostname,
        port: parseInt(url.port || '2375'),
      })
    } else {
      docker = new Docker({ socketPath })
    }
  }
  return docker
}

function isOpenClawContainer(info: Docker.ContainerInfo): boolean {
  const image = info.Image.toLowerCase()
  const labels = info.Labels || {}

  // Check image name
  if (image.includes('openclaw')) return true

  // Check label
  if (labels['com.openclaw.instance'] === 'true') return true

  // Check exposed ports for 18789
  const ports = info.Ports || []
  if (ports.some((p) => p.PrivatePort === 18789)) return true

  return false
}

function mapPorts(ports: Docker.Port[]): PortMapping[] {
  return (ports || []).map((p) => ({
    privatePort: p.PrivatePort,
    publicPort: p.PublicPort,
    type: p.Type,
    ip: p.IP,
  }))
}

function detectGatewayPort(ports: Docker.Port[]): number | undefined {
  const gwPort = (ports || []).find((p) => p.PrivatePort === 18789)
  return gwPort?.PublicPort
}

export async function listContainers(
  all = true,
): Promise<DockerContainerInfo[]> {
  try {
    const d = getDocker()
    const containers = await d.listContainers({ all })

    return containers.map((c) => ({
      id: c.Id,
      name: (c.Names[0] || '').replace(/^\//, ''),
      image: c.Image,
      state: c.State as DockerContainerInfo['state'],
      status: c.Status,
      ports: mapPorts(c.Ports),
      created: c.Created,
      isOpenClaw: isOpenClawContainer(c),
      gatewayPort: detectGatewayPort(c.Ports),
      labels: c.Labels || {},
    }))
  } catch (err) {
    log.error({ err }, 'Failed to list containers')
    return []
  }
}

export async function getContainer(
  id: string,
): Promise<Docker.ContainerInspectInfo | null> {
  try {
    const d = getDocker()
    return await d.getContainer(id).inspect()
  } catch {
    return null
  }
}

export async function startContainer(id: string): Promise<void> {
  const d = getDocker()
  await d.getContainer(id).start()
  eventBus.emit('docker:container:started', { containerId: id })
}

export async function stopContainer(id: string): Promise<void> {
  const d = getDocker()
  await d.getContainer(id).stop()
  eventBus.emit('docker:container:stopped', { containerId: id })
}

export async function restartContainer(id: string): Promise<void> {
  const d = getDocker()
  await d.getContainer(id).restart()
}

export async function getContainerLogs(
  id: string,
  opts: { tail?: number; since?: number } = {},
): Promise<string> {
  const d = getDocker()
  const logs = await d.getContainer(id).logs({
    stdout: true,
    stderr: true,
    tail: opts.tail ?? 200,
    since: opts.since,
    timestamps: true,
  })
  // dockerode returns a Buffer or string
  return typeof logs === 'string' ? logs : logs.toString('utf-8')
}

export async function getContainerStats(
  id: string,
): Promise<ContainerStats | null> {
  try {
    const d = getDocker()
    const stats = await d.getContainer(id).stats({ stream: false })
    const s = stats as unknown as Record<string, unknown>

    const cpuDelta = (s.cpu_stats as Record<string, unknown>)?.cpu_usage
      ? ((s.cpu_stats as Record<string, Record<string, number>>).cpu_usage
          .total_usage ?? 0) -
        ((s.precpu_stats as Record<string, Record<string, number>>).cpu_usage
          .total_usage ?? 0)
      : 0
    const systemDelta =
      ((s.cpu_stats as Record<string, number>).system_cpu_usage ?? 0) -
      ((s.precpu_stats as Record<string, number>).system_cpu_usage ?? 0)
    const numCpus =
      (
        (s.cpu_stats as Record<string, Record<string, unknown>>)?.cpu_usage
          ?.percpu_usage as unknown[]
      )?.length ?? 1

    const cpuPercent =
      systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0

    const memStats = s.memory_stats as Record<string, number>
    const memoryUsage = memStats?.usage ?? 0
    const memoryLimit = memStats?.limit ?? 1

    return {
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      memoryUsage,
      memoryLimit,
      memoryPercent: Math.round((memoryUsage / memoryLimit) * 10000) / 100,
    }
  } catch {
    return null
  }
}

export function isDockerAvailable(): Promise<boolean> {
  return getDocker()
    .ping()
    .then(() => true)
    .catch(() => false)
}
