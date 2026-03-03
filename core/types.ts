// ── Frame types (matches OpenClaw gateway protocol v3) ──

export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
}

export interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: RpcError;
}

export interface EventFrame {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: { version: number; hash?: string };
}

export type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

export interface RpcError {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
  retryAfterMs?: number;
}

// ── Connection types ──

export interface HelloOk {
  type: "hello-ok";
  protocol: number;
  server: { version: string; connId: string };
  features: { methods: string[]; events: string[] };
  snapshot?: {
    version: number;
    agents: AgentInfo[];
    channels: Record<string, unknown>;
    presence: unknown[];
  };
  auth?: {
    deviceToken?: string;
    role?: string;
    scopes?: string[];
    issuedAtMs?: number;
  };
  policy: {
    maxPayload: number;
    maxBufferedBytes?: number;
    tickIntervalMs: number;
  };
}

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    displayName?: string;
    version: string;
    platform: string;
    mode: string;
    instanceId?: string;
  };
  caps?: string[];
  role?: string;
  scopes?: string[];
  auth?: {
    token?: string;
    deviceToken?: string;
    password?: string;
  };
}

// ── Instance types ──

export type InstanceStatus = "connected" | "connecting" | "disconnected" | "error";

export interface InstanceConfig {
  id: string;
  name: string;
  url: string;
  token: string | null;
  tags: string[];
}

export interface InstanceState {
  config: InstanceConfig;
  status: InstanceStatus;
  error?: string;
  health?: HealthInfo;
  serverVersion?: string;
  connId?: string;
  agents: AgentInfo[];
  channels: ChannelInfo[];
  availableMethods: string[];
  lastConnected?: number;
  lastHealthCheck?: number;
}

// ── Health ──

export interface HealthInfo {
  ok: boolean;
  uptime?: number;
  memory?: { rss: number; heapUsed: number; heapTotal: number };
  agents?: number;
  channels?: number;
  timestamp: number;
}

// ── Agent types ──

export interface AgentInfo {
  key: string;
  name: string;
  emoji?: string;
  model?: string;
  persona?: string;
  enabled?: boolean;
  skills?: string[];
  tools?: string[];
  subagents?: {
    allowAgents?: string[];
    maxConcurrent?: number;
    maxSpawnDepth?: number;
  };
}

// ── Channel types ──

export interface ChannelInfo {
  id: string;
  type: string;
  name?: string;
  connected: boolean;
  error?: string;
  peerCount?: number;
  lastMessage?: number;
  config?: Record<string, unknown>;
}

// ── Session types ──

export interface SessionInfo {
  id: string;
  agentKey: string;
  channelId?: string;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
  preview?: string;
}

// ── Skill types ──

export interface SkillInfo {
  id: string;
  name: string;
  description?: string;
  version?: string;
  enabled: boolean;
  category?: string;
}

// ── Model types ──

export interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
  contextWindow?: number;
}

// ── Usage types ──

export interface UsageInfo {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost?: number;
  period?: string;
}

// ── Docker types ──

export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  state: "running" | "exited" | "paused" | "restarting" | "dead" | "created";
  status: string;
  ports: PortMapping[];
  created: number;
  isOpenClaw: boolean;
  gatewayPort?: number;
  labels: Record<string, string>;
  stats?: ContainerStats;
}

export interface PortMapping {
  privatePort: number;
  publicPort?: number;
  type: string;
  ip?: string;
}

export interface ContainerStats {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
}

// ── Event bus types ──

export type PlatformEventType =
  | "instance:connected"
  | "instance:disconnected"
  | "instance:error"
  | "instance:health"
  | "instance:added"
  | "instance:removed"
  | "docker:container:discovered"
  | "docker:container:started"
  | "docker:container:stopped"
  | "docker:container:removed"
  | "agent:updated"
  | "channel:updated"
  | "log:entry";

export interface PlatformEvent {
  type: PlatformEventType;
  instanceId?: string;
  containerId?: string;
  data?: unknown;
  timestamp: number;
}

// ── Config schema types ──

export interface ConfigSchemaResponse {
  schema: Record<string, unknown>;
  uiHints: Record<string, ConfigUiHint>;
  version: string;
  generatedAt: string;
}

export interface ConfigUiHint {
  label?: string;
  help?: string;
  tags?: string[];
  group?: string;
  order?: number;
  advanced?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  itemTemplate?: unknown;
}

// ── Cron types ──

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  agentKey: string;
  message: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
}

// ── Tool types ──

export interface ToolInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  schema?: Record<string, unknown>;
}
