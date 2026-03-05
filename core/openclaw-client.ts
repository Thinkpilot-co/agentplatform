import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import {
  PROTOCOL_VERSION,
  SYNCED_FROM_VERSION,
  type RpcMethod,
} from './generated'
import type {
  RequestFrame,
  ResponseFrame,
  EventFrame,
  GatewayFrame,
  HelloOk,
  ConnectParams,
  RpcError,
  AgentInfo,
  ChannelInfo,
  HealthInfo,
  SessionInfo,
  ModelInfo,
  SkillInfo,
  UsageInfo,
  ConfigSchemaResponse,
  CronJob,
  ToolInfo,
} from './types'
import { createLogger } from './logger'
import { signChallenge, getDeviceToken, saveDeviceToken } from './device-identity'

const log = createLogger('ws-client')

const DEFAULT_TIMEOUT = 30_000
const RECONNECT_MIN = 1_000
const RECONNECT_MAX = 30_000

export interface OpenClawClientOptions {
  url: string
  token?: string | null
  onEvent?: (evt: EventFrame) => void
  onConnected?: (hello: HelloOk) => void
  onDisconnected?: (code: number, reason: string) => void
  onError?: (err: Error) => void
  autoReconnect?: boolean
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class OpenClawClient {
  private ws: WebSocket | null = null
  private pending = new Map<string, PendingRequest>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = RECONNECT_MIN
  private tickTimer: ReturnType<typeof setTimeout> | null = null
  private lastTick = 0
  private tickIntervalMs = 30_000
  private _connected = false
  private _destroyed = false
  private helloOk: HelloOk | null = null

  readonly url: string
  private token: string | null
  private onEvent?: (evt: EventFrame) => void
  private onConnected?: (hello: HelloOk) => void
  private onDisconnected?: (code: number, reason: string) => void
  private onErrorCb?: (err: Error) => void
  private autoReconnect: boolean

  constructor(opts: OpenClawClientOptions) {
    this.url = opts.url
    this.token = opts.token ?? null
    this.onEvent = opts.onEvent
    this.onConnected = opts.onConnected
    this.onDisconnected = opts.onDisconnected
    this.onErrorCb = opts.onError
    this.autoReconnect = opts.autoReconnect ?? true
  }

  get connected() {
    return this._connected
  }

  get serverVersion() {
    return this.helloOk?.server.version
  }

  get connId() {
    return this.helloOk?.server.connId
  }

  get availableMethods() {
    return this.helloOk?.features.methods ?? []
  }

  get snapshot() {
    return this.helloOk?.snapshot
  }

  connect() {
    if (this._destroyed) {
      log.warn({ url: this.url }, 'Connect called on destroyed client')
      return
    }
    if (this.ws) {
      log.debug(
        { url: this.url },
        'Cleaning up previous connection before reconnect',
      )
      this.cleanup()
    }

    log.info({ url: this.url }, 'Connecting')

    try {
      this.ws = new WebSocket(this.url, { handshakeTimeout: 10_000 })
    } catch (err) {
      log.error({ url: this.url, err }, 'Failed to create WebSocket')
      this.onErrorCb?.(err as Error)
      this.scheduleReconnect()
      return
    }

    this.ws.on('open', () => {
      log.info({ url: this.url }, 'WebSocket open, waiting for challenge')
    })

    this.ws.on('message', (data) => {
      try {
        const frame = JSON.parse(data.toString()) as GatewayFrame
        log.debug(
          { type: frame.type, event: (frame as EventFrame).event },
          'Frame received',
        )
        this.handleFrame(frame)
      } catch {
        log.warn(
          { url: this.url, raw: data.toString().slice(0, 200) },
          'Unparseable frame received',
        )
      }
    })

    this.ws.on('error', (err) => {
      log.error({ url: this.url, err }, 'WebSocket error')
      this.onErrorCb?.(err)
    })

    this.ws.on('close', (code, reason) => {
      const wasConnected = this._connected
      this._connected = false
      this.helloOk = null
      this.clearTickWatch()
      this.rejectAllPending('Connection closed')

      log.info(
        { url: this.url, code, reason: reason.toString(), wasConnected },
        'WebSocket closed',
      )

      if (wasConnected) {
        this.onDisconnected?.(code, reason.toString())
      }

      if (!this._destroyed && this.autoReconnect) {
        this.scheduleReconnect()
      }
    })
  }

  destroy() {
    this._destroyed = true
    this.autoReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.cleanup()
  }

  private cleanup() {
    this.clearTickWatch()
    this.rejectAllPending('Client cleanup')
    if (this.ws) {
      this.ws.removeAllListeners()
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close(1000, 'cleanup')
      }
      this.ws = null
    }
    this._connected = false
  }

  private handleFrame(frame: GatewayFrame) {
    // hello-ok may arrive as its own frame type or embedded in a res frame
    const rawType = (frame as unknown as Record<string, unknown>).type as string
    if (rawType === 'hello-ok') {
      this.handleHelloOk(frame as unknown as HelloOk)
    } else if (frame.type === 'event') {
      this.handleEvent(frame as EventFrame)
    } else if (frame.type === 'res') {
      this.handleResponse(frame as ResponseFrame)
    }
  }

  private handleEvent(evt: EventFrame) {
    if (evt.event === 'connect.challenge') {
      log.info({ url: this.url }, 'Received connect challenge, sending auth')
      this.sendConnect(evt.payload as { nonce: string })
      return
    }

    if (evt.event === 'tick') {
      this.lastTick = Date.now()
      return
    }

    log.debug({ event: evt.event }, 'Event received')
    this.onEvent?.(evt)
  }

  private handleResponse(res: ResponseFrame) {
    // The connect response wraps hello-ok in payload
    const payload = res.payload as Record<string, unknown> | undefined
    if (res.ok && payload?.type === 'hello-ok' && !this._connected) {
      log.debug('Connect response contains hello-ok payload')
      this.handleHelloOk(payload as unknown as HelloOk)
      return
    }

    const pending = this.pending.get(res.id)
    if (!pending) {
      log.debug({ id: res.id, ok: res.ok }, 'Response for unknown request (ignored)')
      return
    }

    clearTimeout(pending.timer)
    this.pending.delete(res.id)

    if (res.ok) {
      pending.resolve(res.payload)
    } else {
      const err = new RpcCallError(
        res.error?.message ?? 'RPC error',
        res.error ?? { code: 'UNKNOWN', message: 'Unknown error' },
      )
      pending.reject(err)
    }
  }

  private handleHelloOk(hello: HelloOk) {
    log.info(
      {
        url: this.url,
        serverVersion: hello.server.version,
        connId: hello.server.connId,
        methods: hello.features.methods?.length,
        hasDeviceToken: !!hello.auth?.deviceToken,
      },
      'Handshake complete (hello-ok)',
    )

    // Persist device token for future reconnections
    if (hello.auth?.deviceToken) {
      saveDeviceToken(this.url, {
        deviceToken: hello.auth.deviceToken,
        role: hello.auth.role ?? 'operator',
        scopes: hello.auth.scopes ?? [],
        issuedAtMs: hello.auth.issuedAtMs,
      })
    }

    this.helloOk = hello
    this._connected = true
    this.reconnectDelay = RECONNECT_MIN
    this.tickIntervalMs = hello.policy.tickIntervalMs || 30_000
    this.lastTick = Date.now()
    this.startTickWatch()
    this.onConnected?.(hello)
  }

  private sendConnect(challenge: { nonce: string }) {
    const role = 'operator'
    const scopes = ['operator.admin']
    const clientId = 'gateway-client'
    const clientMode = 'backend'

    // Build auth — include saved device token if we have one
    const savedToken = getDeviceToken(this.url)
    const auth: ConnectParams['auth'] = {}
    if (this.token) auth.token = this.token
    if (savedToken) auth.deviceToken = savedToken
    const hasAuth = Object.keys(auth).length > 0

    // Operator + gateway token can skip device identity entirely.
    // Only use device identity when no shared auth is available
    // (device identity via Docker bridge isn't recognized as local).
    const useDeviceIdentity = !this.token
    const device = useDeviceIdentity
      ? signChallenge({
          nonce: challenge.nonce,
          clientId,
          clientMode,
          role,
          scopes,
          token: auth.token ?? auth.deviceToken ?? null,
          platform: process.platform,
        })
      : undefined

    log.info(
      { hasToken: !!this.token, hasDeviceToken: !!savedToken, useDeviceIdentity },
      'Sending connect',
    )

    const params: ConnectParams = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: clientId,
        displayName: 'AgentPlatform',
        version: SYNCED_FROM_VERSION,
        platform: process.platform,
        mode: clientMode,
      },
      role,
      scopes,
      ...(device ? { device } : {}),
      ...(hasAuth ? { auth } : {}),
    }

    this.send({
      type: 'req',
      id: uuid(),
      method: 'connect',
      params,
    })
  }

  private send(frame: RequestFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame))
    }
  }

  private startTickWatch() {
    this.clearTickWatch()
    const checkInterval = this.tickIntervalMs * 2
    this.tickTimer = setInterval(() => {
      if (Date.now() - this.lastTick > checkInterval) {
        // Tick timeout — connection is stale
        this.ws?.close(4000, 'tick timeout')
      }
    }, checkInterval)
  }

  private clearTickWatch() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  }

  private scheduleReconnect() {
    if (this._destroyed || !this.autoReconnect) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    log.info(
      { url: this.url, delayMs: this.reconnectDelay },
      'Scheduling reconnect',
    )

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.reconnectDelay)

    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, RECONNECT_MAX)
  }

  private rejectAllPending(reason: string) {
    if (this.pending.size > 0) {
      log.warn(
        { count: this.pending.size, reason },
        'Rejecting pending requests',
      )
    }
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(new Error(reason))
    }
    this.pending.clear()
  }

  // ── RPC call ──

  async request<T = unknown>(
    method: string,
    params?: unknown,
    timeoutMs = DEFAULT_TIMEOUT,
  ): Promise<T> {
    if (!this._connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected')
    }

    const id = uuid()
    const frame: RequestFrame = { type: 'req', id, method, params }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`RPC timeout: ${method} (${timeoutMs}ms)`))
      }, timeoutMs)

      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      })

      this.send(frame)
    })
  }

  /** Request a list, unwrapping from { [key]: T[] } or falling back to raw array */
  private async requestList<T>(
    method: string,
    key: string,
    params?: unknown,
  ): Promise<T[]> {
    const res = await this.request<Record<string, unknown>>(method, params)
    return (res[key] as T[] | undefined) ?? (res as unknown as T[])
  }

  // ── Typed RPC wrappers ──

  async health(): Promise<HealthInfo> {
    const res = await this.request<Record<string, unknown>>('health')
    return {
      ok: true,
      uptime: res.uptime as number | undefined,
      memory: res.memory as HealthInfo['memory'],
      agents: res.agents as number | undefined,
      channels: res.channels as number | undefined,
      timestamp: Date.now(),
    }
  }

  async status(): Promise<Record<string, unknown>> {
    return this.request('status')
  }

  async agentsList(): Promise<AgentInfo[]> {
    return this.requestList<AgentInfo>('agents.list', 'agents')
  }

  async agentsCreate(agent: Partial<AgentInfo>): Promise<AgentInfo> {
    return this.request('agents.create', agent)
  }

  async agentsUpdate(
    key: string,
    updates: Partial<AgentInfo>,
  ): Promise<AgentInfo> {
    return this.request('agents.update', { key, ...updates })
  }

  async agentsDelete(key: string): Promise<void> {
    await this.request('agents.delete', { key })
  }

  async configGet(): Promise<Record<string, unknown>> {
    return this.request('config.get')
  }

  async configPatch(patch: Record<string, unknown>): Promise<void> {
    await this.request('config.patch', patch)
  }

  async configSchema(): Promise<ConfigSchemaResponse> {
    return this.request('config.schema')
  }

  async channelsStatus(): Promise<ChannelInfo[]> {
    return this.requestList<ChannelInfo>('channels.status', 'channels')
  }

  async modelsList(): Promise<ModelInfo[]> {
    return this.requestList<ModelInfo>('models.list', 'models')
  }

  async skillsStatus(): Promise<SkillInfo[]> {
    return this.requestList<SkillInfo>('skills.status', 'skills')
  }

  async skillsInstall(skillId: string): Promise<void> {
    await this.request('skills.install', { id: skillId })
  }

  async sessionsList(params?: {
    agentKey?: string
    limit?: number
  }): Promise<SessionInfo[]> {
    return this.requestList<SessionInfo>('sessions.list', 'sessions', params)
  }

  async sessionsPreview(sessionId: string): Promise<Record<string, unknown>> {
    return this.request('sessions.preview', { id: sessionId })
  }

  async logsTail(params?: {
    lines?: number
    level?: string
  }): Promise<unknown[]> {
    return this.requestList<unknown>('logs.tail', 'lines', params)
  }

  async usageStatus(): Promise<UsageInfo> {
    return this.request('usage.status')
  }

  async usageCost(): Promise<Record<string, unknown>> {
    return this.request('usage.cost')
  }

  async toolsCatalog(): Promise<ToolInfo[]> {
    return this.requestList<ToolInfo>('tools.catalog', 'tools')
  }

  async cronList(): Promise<CronJob[]> {
    return this.requestList<CronJob>('cron.list', 'jobs')
  }

  async sendMessage(
    agentKey: string,
    message: string,
  ): Promise<Record<string, unknown>> {
    return this.request('send', { agentKey, message })
  }
}

export class RpcCallError extends Error {
  code: string
  details?: unknown
  retryable?: boolean
  retryAfterMs?: number

  constructor(message: string, error: RpcError) {
    super(message)
    this.name = 'RpcCallError'
    this.code = error.code
    this.details = error.details
    this.retryable = error.retryable
    this.retryAfterMs = error.retryAfterMs
  }
}
