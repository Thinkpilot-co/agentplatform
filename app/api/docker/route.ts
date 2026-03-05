import { NextResponse } from 'next/server'
import { listContainers } from '@/core/docker-monitor'

export async function GET() {
  // listContainers already catches Docker errors and returns []
  // If we get results, Docker is available. If empty, could be either.
  // We try to list — if Docker is down, the catch in listContainers handles it.
  const containers = await listContainers()

  return NextResponse.json({ containers })
}
