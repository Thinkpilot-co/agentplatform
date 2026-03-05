import { instanceManager } from './instance-manager'
import { eventBus } from './event-bus'
import { createLogger } from './logger'

const log = createLogger('health-monitor')

const CHECK_INTERVAL = 30_000 // 30 seconds

let timer: ReturnType<typeof setInterval> | null = null

async function checkInstance(instanceId: string) {
  const state = instanceManager.getState(instanceId)
  if (!state || state.status !== 'connected') return

  const client = instanceManager.getClient(instanceId)
  if (!client) return

  try {
    const health = await client.health()
    state.health = health
    state.lastHealthCheck = Date.now()
    log.debug({ instanceId, ok: health.ok }, 'Health check passed')
    eventBus.emit('instance:health', { instanceId, data: health })
  } catch (err) {
    state.health = { ok: false, timestamp: Date.now() }
    log.warn({ instanceId, err }, 'Health check failed')
    eventBus.emit('instance:health', { instanceId, data: { ok: false } })
  }
}

export function startHealthMonitor() {
  if (timer) return

  log.info({ intervalMs: CHECK_INTERVAL }, 'Starting health monitor')

  timer = setInterval(() => {
    const states = instanceManager.getAllStates()
    Promise.all(states.map((s) => checkInstance(s.config.id))).catch((err) => {
      log.error({ err }, 'Health monitor batch failed')
    })
  }, CHECK_INTERVAL)
}

export function stopHealthMonitor() {
  if (timer) {
    clearInterval(timer)
    timer = null
    log.info('Health monitor stopped')
  }
}
