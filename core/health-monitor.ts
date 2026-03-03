import { instanceManager } from "./instance-manager";
import { eventBus } from "./event-bus";

const CHECK_INTERVAL = 30_000; // 30 seconds

let timer: ReturnType<typeof setInterval> | null = null;

async function checkInstance(instanceId: string) {
  const state = instanceManager.getState(instanceId);
  if (!state || state.status !== "connected") return;

  const client = instanceManager.getClient(instanceId);
  if (!client) return;

  try {
    const health = await client.health();
    state.health = health;
    state.lastHealthCheck = Date.now();
    eventBus.emit("instance:health", { instanceId, data: health });
  } catch {
    state.health = { ok: false, timestamp: Date.now() };
    eventBus.emit("instance:health", { instanceId, data: { ok: false } });
  }
}

export function startHealthMonitor() {
  if (timer) return;

  timer = setInterval(() => {
    const states = instanceManager.getAllStates();
    // Check all instances in parallel
    Promise.all(states.map((s) => checkInstance(s.config.id)));
  }, CHECK_INTERVAL);
}

export function stopHealthMonitor() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
