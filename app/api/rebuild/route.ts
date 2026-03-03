import { NextResponse } from "next/server";
import {
  startRebuild,
  getBuildState,
  cancelBuild,
} from "@/core/rebuilder";

/** GET /api/rebuild — current build state */
export async function GET() {
  return NextResponse.json(getBuildState());
}

/** POST /api/rebuild — start a rebuild */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const state = getBuildState();
  if (state.running) {
    return NextResponse.json(
      { error: "A build is already running", state },
      { status: 409 }
    );
  }

  // Fire-and-forget — the build runs in the background
  // Client polls /api/rebuild or streams /api/rebuild/stream
  startRebuild({
    sync: body.sync !== false,
    deploy: body.deploy !== false,
    openclawSrc: body.openclawSrc,
    imageName: body.imageName,
    containerName: body.containerName,
    port: body.port,
  }).catch(() => {
    // Error is captured in build state
  });

  // Return immediately with "started"
  return NextResponse.json({ ok: true, status: "started" });
}

/** DELETE /api/rebuild — cancel running build */
export async function DELETE() {
  cancelBuild();
  return NextResponse.json({ ok: true, status: "cancelled" });
}
