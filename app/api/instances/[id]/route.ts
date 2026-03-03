import { NextResponse } from "next/server";
import { initPlatform } from "@/core/init";
import { instanceManager } from "@/core/instance-manager";
import * as store from "@/core/instance-store";

initPlatform();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = instanceManager.getState(id);

  if (!state) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  // If connected, fetch fresh agent & channel data
  const client = instanceManager.getClient(id);
  if (client?.connected) {
    try {
      const [agents, channels] = await Promise.all([
        client.agentsList().catch(() => state.agents),
        client.channelsStatus().catch(() => state.channels),
      ]);
      state.agents = agents;
      state.channels = channels;
    } catch {
      // Use cached data
    }
  }

  return NextResponse.json({
    id: state.config.id,
    name: state.config.name,
    url: state.config.url,
    tags: state.config.tags,
    status: state.status,
    error: state.error,
    serverVersion: state.serverVersion,
    health: state.health,
    agents: state.agents,
    channels: state.channels,
    availableMethods: state.availableMethods,
    lastConnected: state.lastConnected,
    lastHealthCheck: state.lastHealthCheck,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  instanceManager.removeInstance(id);
  store.removeInstance(id);

  return NextResponse.json({ ok: true });
}
