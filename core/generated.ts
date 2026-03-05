// AUTO-GENERATED — do not edit manually
// Synced from OpenClaw v2026.3.3 on 2026-03-05T13:16:10.221Z
// Run: npm run sync
//
// Source: /Users/antonioiliev/Development/openclaw-development/openclaw

/** OpenClaw gateway protocol version */
export const PROTOCOL_VERSION = 3 as const;

/** OpenClaw version this was synced from */
export const SYNCED_FROM_VERSION = "2026.3.3" as const;

/** All base RPC methods exposed by the OpenClaw gateway */
export const RPC_METHODS = [
  "health",
  "doctor.memory.status",
  "logs.tail",
  "channels.status",
  "channels.logout",
  "status",
  "usage.status",
  "usage.cost",
  "tts.status",
  "tts.providers",
  "tts.enable",
  "tts.disable",
  "tts.convert",
  "tts.setProvider",
  "config.get",
  "config.set",
  "config.apply",
  "config.patch",
  "config.schema",
  "exec.approvals.get",
  "exec.approvals.set",
  "exec.approvals.node.get",
  "exec.approvals.node.set",
  "exec.approval.request",
  "exec.approval.waitDecision",
  "exec.approval.resolve",
  "wizard.start",
  "wizard.next",
  "wizard.cancel",
  "wizard.status",
  "talk.config",
  "talk.mode",
  "models.list",
  "tools.catalog",
  "agents.list",
  "agents.create",
  "agents.update",
  "agents.delete",
  "agents.files.list",
  "agents.files.get",
  "agents.files.set",
  "skills.status",
  "skills.bins",
  "skills.install",
  "skills.update",
  "update.run",
  "voicewake.get",
  "voicewake.set",
  "secrets.reload",
  "secrets.resolve",
  "sessions.list",
  "sessions.preview",
  "sessions.patch",
  "sessions.reset",
  "sessions.delete",
  "sessions.compact",
  "last-heartbeat",
  "set-heartbeats",
  "wake",
  "node.pair.request",
  "node.pair.list",
  "node.pair.approve",
  "node.pair.reject",
  "node.pair.verify",
  "device.pair.list",
  "device.pair.approve",
  "device.pair.reject",
  "device.pair.remove",
  "device.token.rotate",
  "device.token.revoke",
  "node.rename",
  "node.list",
  "node.describe",
  "node.invoke",
  "node.invoke.result",
  "node.event",
  "node.canvas.capability.refresh",
  "cron.list",
  "cron.status",
  "cron.add",
  "cron.update",
  "cron.remove",
  "cron.run",
  "cron.runs",
  "system-presence",
  "system-event",
  "send",
  "agent",
  "agent.identity.get",
  "agent.wait",
  "browser.request",
  "chat.history",
  "chat.abort",
  "chat.send",
] as const;

export type RpcMethod = (typeof RPC_METHODS)[number];

/** All gateway event types */
export const GATEWAY_EVENTS = [
  "connect.challenge",
  "agent",
  "chat",
  "presence",
  "tick",
  "talk.mode",
  "shutdown",
  "health",
  "heartbeat",
  "cron",
  "node.pair.requested",
  "node.pair.resolved",
  "node.invoke.request",
  "device.pair.requested",
  "device.pair.resolved",
  "voicewake.changed",
  "exec.approval.requested",
  "exec.approval.resolved",
  "update.available",
] as const;

export type GatewayEventName = (typeof GATEWAY_EVENTS)[number];

/** WebSocket close code hints */
export const CLOSE_CODE_HINTS: Record<number, string> = {
  1000: "normal closure",
  1006: "abnormal closure (no close frame)",
  1008: "policy violation",
  1012: "service restart",
};

/** Method categories (derived from dot-prefix) */
export const METHOD_CATEGORIES = {
  "agent": [
    "agent.identity.get",
    "agent.wait"
  ],
  "agents": [
    "agents.list",
    "agents.create",
    "agents.update",
    "agents.delete",
    "agents.files.list",
    "agents.files.get",
    "agents.files.set"
  ],
  "browser": [
    "browser.request"
  ],
  "channels": [
    "channels.status",
    "channels.logout"
  ],
  "chat": [
    "chat.history",
    "chat.abort",
    "chat.send"
  ],
  "config": [
    "config.get",
    "config.set",
    "config.apply",
    "config.patch",
    "config.schema"
  ],
  "core": [
    "health",
    "status",
    "last-heartbeat",
    "set-heartbeats",
    "wake",
    "system-presence",
    "system-event",
    "send",
    "agent"
  ],
  "cron": [
    "cron.list",
    "cron.status",
    "cron.add",
    "cron.update",
    "cron.remove",
    "cron.run",
    "cron.runs"
  ],
  "device": [
    "device.pair.list",
    "device.pair.approve",
    "device.pair.reject",
    "device.pair.remove",
    "device.token.rotate",
    "device.token.revoke"
  ],
  "doctor": [
    "doctor.memory.status"
  ],
  "exec": [
    "exec.approvals.get",
    "exec.approvals.set",
    "exec.approvals.node.get",
    "exec.approvals.node.set",
    "exec.approval.request",
    "exec.approval.waitDecision",
    "exec.approval.resolve"
  ],
  "logs": [
    "logs.tail"
  ],
  "models": [
    "models.list"
  ],
  "node": [
    "node.pair.request",
    "node.pair.list",
    "node.pair.approve",
    "node.pair.reject",
    "node.pair.verify",
    "node.rename",
    "node.list",
    "node.describe",
    "node.invoke",
    "node.invoke.result",
    "node.event",
    "node.canvas.capability.refresh"
  ],
  "secrets": [
    "secrets.reload",
    "secrets.resolve"
  ],
  "sessions": [
    "sessions.list",
    "sessions.preview",
    "sessions.patch",
    "sessions.reset",
    "sessions.delete",
    "sessions.compact"
  ],
  "skills": [
    "skills.status",
    "skills.bins",
    "skills.install",
    "skills.update"
  ],
  "talk": [
    "talk.config",
    "talk.mode"
  ],
  "tools": [
    "tools.catalog"
  ],
  "tts": [
    "tts.status",
    "tts.providers",
    "tts.enable",
    "tts.disable",
    "tts.convert",
    "tts.setProvider"
  ],
  "update": [
    "update.run"
  ],
  "usage": [
    "usage.status",
    "usage.cost"
  ],
  "voicewake": [
    "voicewake.get",
    "voicewake.set"
  ],
  "wizard": [
    "wizard.start",
    "wizard.next",
    "wizard.cancel",
    "wizard.status"
  ]
};

/** Total method count */
export const METHOD_COUNT = 94;

/** Total event count */
export const EVENT_COUNT = 19;
