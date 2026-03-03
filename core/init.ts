import { instanceManager } from "./instance-manager";
import { startHealthMonitor, stopHealthMonitor } from "./health-monitor";
import { startDiscovery, stopDiscovery } from "./docker-discovery";

let initialized = false;

/** Initialize the platform core (idempotent, safe to call multiple times) */
export function initPlatform() {
  if (initialized) return;
  initialized = true;

  console.log("[platform] Initializing...");

  // Connect to all configured instances
  instanceManager.init();

  // Start health monitoring
  startHealthMonitor();

  // Start Docker auto-discovery
  startDiscovery();

  console.log("[platform] Ready");
}

export function shutdownPlatform() {
  stopHealthMonitor();
  stopDiscovery();
  instanceManager.destroy();
  initialized = false;
}
