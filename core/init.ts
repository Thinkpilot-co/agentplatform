import { instanceManager } from './instance-manager'
import { startHealthMonitor, stopHealthMonitor } from './health-monitor'
import { startDiscovery, stopDiscovery } from './docker-discovery'
import { createLogger } from './logger'

const log = createLogger('platform')

let initialized = false

/** Initialize the platform core (idempotent, safe to call multiple times) */
export function initPlatform() {
  if (initialized) return
  initialized = true

  log.info('Initializing platform')

  instanceManager.init()
  startHealthMonitor()
  startDiscovery()

  log.info('Platform ready')
}

export function shutdownPlatform() {
  log.info('Shutting down platform')
  stopHealthMonitor()
  stopDiscovery()
  instanceManager.destroy()
  initialized = false
}
