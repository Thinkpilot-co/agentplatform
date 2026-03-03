import { getBuildState, onBuildLog } from "@/core/rebuilder";
import { createSseResponse } from "@/lib/sse";

export async function GET() {
  return createSseResponse({
    onStart(send) {
      // Send current state + replay existing logs
      const state = getBuildState();
      send.event("state", {
        status: state.status,
        running: state.running,
      });
      for (const line of state.logs) {
        send.event("log", line);
      }

      // Stream new logs
      return onBuildLog((line) => {
        send.event("log", line);

        if (
          line.startsWith("==> Step:") ||
          line.startsWith("==> ERROR") ||
          line.startsWith("==> Rebuild complete")
        ) {
          const s = getBuildState();
          send.event("state", {
            status: s.status,
            running: s.running,
            error: s.error,
          });
        }
      });
    },
  });
}
