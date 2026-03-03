import { NextResponse } from "next/server";
import { getContainerLogs } from "@/core/docker-monitor";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const tail = parseInt(url.searchParams.get("tail") || "200");

  try {
    const logs = await getContainerLogs(id, { tail });
    return NextResponse.json({ logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
