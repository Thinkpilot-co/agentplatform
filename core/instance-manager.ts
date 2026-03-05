import { OpenClawClient, type OpenClawClientOptions } from './openclaw-client'
import { listInstances } from './instance-store'
import { eventBus } from './event-bus'
import { createLogger } from './logger'
import type { InstanceConfig, InstanceState, EventFrame } from './types'

const log = createLogger('instance-manager')

class InstanceManager {
  private clients = new Map<string, OpenClawClient>()
  private states = new Map<string, InstanceState>()

  /** Initialize: connect to all configured instances */
  init() {
    const configs = listInstances()
    log.info({ count: configs.length }, 'Initializing configured instances')
    for (const config of configs) {
      this.addInstance(config)
    }
  }

  addInstance(config: InstanceConfig) {
    // Don't duplicate
    if (this.clients.has(config.id)) {
      log.debug({ id: config.id }, 'Instance already exists, skipping')
      return
    }

    log.info(
      { id: config.id, name: config.name, url: config.url },
      'Adding instance',
    )

    const state: InstanceState = {
      config,
      status: 'connecting',
      agents: [],
      channels: [],
      availableMethods: [],
    }
    this.states.set(config.id, state)

    const client = new OpenClawClient({
      url: config.url,
      token: config.token,
      onConnected: (hello) => {
        state.status = 'connected'
        state.serverVersion = hello.server.version
        state.connId = hello.server.connId
        state.availableMethods = hello.features.methods
        state.lastConnected = Date.now()
        if (hello.snapshot?.agents) {
          state.agents = hello.snapshot.agents
        }
        log.info(
          { id: config.id, version: hello.server.version },
          'Instance connected',
        )
        eventBus.emit('instance:connected', { instanceId: config.id })
      },
      onDisconnected: (code, reason) => {
        state.status = 'disconnected'
        state.error = `Closed: ${code} ${reason}`
        log.warn({ id: config.id, code, reason }, 'Instance disconnected')
        eventBus.emit('instance:disconnected', {
          instanceId: config.id,
          data: { code, reason },
        })
      },
      onError: (err) => {
        state.status = 'error'
        state.error = err.message
        log.error({ id: config.id, err }, 'Instance error')
        eventBus.emit('instance:error', {
          instanceId: config.id,
          data: { message: err.message },
        })
      },
      onEvent: (evt: EventFrame) => {
        // Forward relevant events
        if (evt.event === 'health') {
          state.health = {
            ok: true,
            timestamp: Date.now(),
            ...(evt.payload as Record<string, unknown>),
          }
          eventBus.emit('instance:health', { instanceId: config.id })
        }
      },
    })

    this.clients.set(config.id, client)
    client.connect()

    eventBus.emit('instance:added', { instanceId: config.id })
  }

  removeInstance(id: string) {
    const client = this.clients.get(id)
    if (client) {
      client.destroy()
      this.clients.delete(id)
    }
    this.states.delete(id)
    eventBus.emit('instance:removed', { instanceId: id })
  }

  getClient(id: string): OpenClawClient | undefined {
    return this.clients.get(id)
  }

  getState(id: string): InstanceState | undefined {
    return this.states.get(id)
  }

  getAllStates(): InstanceState[] {
    return Array.from(this.states.values())
  }

  reconnect(id: string) {
    const client = this.clients.get(id)
    if (client) {
      client.destroy()
    }
    const state = this.states.get(id)
    if (state) {
      this.clients.delete(id)
      this.states.delete(id)
      this.addInstance(state.config)
    }
  }

  destroy() {
    for (const client of this.clients.values()) {
      client.destroy()
    }
    this.clients.clear()
    this.states.clear()
  }
}

// Singleton
export const instanceManager = new InstanceManager()
