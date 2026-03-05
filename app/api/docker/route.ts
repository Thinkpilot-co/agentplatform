import { NextResponse } from 'next/server'
import { listContainers, isDockerAvailable } from '@/core/docker-monitor'

export async function GET() {
  const [available, containers] = await Promise.all([
    isDockerAvailable(),
    listContainers(),
  ])

  return NextResponse.json({ available, containers })
}
