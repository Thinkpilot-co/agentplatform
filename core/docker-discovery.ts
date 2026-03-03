import { listContainers } from "./docker-monitor";
import { instanceManager } from "./instance-manager";
import { eventBus } from "./event-bus";
import type { InstanceConfig } from "./types";

const DISCOVERY_INTERVAL = 15_000; // 15 seconds
let timer: ReturnType<typeof setInterval> | null = null;
const discoveredIds = new Set<string>();

export async function discoverOpenClawContainers(): Promise<InstanceConfig[]> {
  const containers = await listContainers(false); // Only running
  const openclawContainers = containers.filter((c) => c.isOpenClaw);
  const newInstances: InstanceConfig[] = [];

  // Track which IDs are currently active
  const activeIds = new Set<string>();

  for (const container of openclawContainers) {
    const instanceId = `docker-${container.id.slice(0, 12)}`;
    activeIds.add(instanceId);

    if (discoveredIds.has(instanceId)) continue;

    const port = container.gatewayPort ?? 18789;
    const config: InstanceConfig = {
      id: instanceId,
      name: `Docker: ${container.name}`,
      url: `ws://127.0.0.1:${port}`,
      token: null,
      tags: ["docker", "auto-discovered"],
    };

    discoveredIds.add(instanceId);
    instanceManager.addInstance(config);
    newInstances.push(config);

    eventBus.emit("docker:container:discovered", {
      containerId: container.id,
      instanceId,
      data: { name: container.name, port },
    });
  }

  // Clean up containers that are no longer running
  for (const id of discoveredIds) {
    if (!activeIds.has(id)) {
      discoveredIds.delete(id);
      instanceManager.removeInstance(id);
      eventBus.emit("docker:container:removed", {
        instanceId: id,
      });
    }
  }

  return newInstances;
}

export function startDiscovery() {
  if (timer) return;

  // Run immediately
  discoverOpenClawContainers().catch((err) => {
    console.error("[docker-discovery] Initial discovery failed:", err);
  });

  timer = setInterval(() => {
    discoverOpenClawContainers().catch((err) => {
      console.error("[docker-discovery] Discovery cycle failed:", err);
    });
  }, DISCOVERY_INTERVAL);
}

export function stopDiscovery() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function clearDiscovered() {
  discoveredIds.clear();
}
