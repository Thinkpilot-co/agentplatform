import { NextResponse } from "next/server";
import {
  getContainer,
  startContainer,
  stopContainer,
  restartContainer,
  getContainerStats,
} from "@/core/docker-monitor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [info, stats] = await Promise.all([
    getContainer(id),
    getContainerStats(id),
  ]);

  if (!info) {
    return NextResponse.json(
      { error: "Container not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: info.Id,
    name: info.Name.replace(/^\//, ""),
    image: info.Config.Image,
    state: info.State.Status,
    created: info.Created,
    ports: info.NetworkSettings.Ports,
    env: info.Config.Env,
    volumes: info.Mounts,
    stats,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const action = body.action as string;
  if (!["start", "stop", "restart"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Use: start, stop, restart" },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case "start":
        await startContainer(id);
        break;
      case "stop":
        await stopContainer(id);
        break;
      case "restart":
        await restartContainer(id);
        break;
    }
    return NextResponse.json({ ok: true, action });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
