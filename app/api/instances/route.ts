import { NextResponse } from 'next/server'
import { initPlatform } from '@/core/init'
import { instanceManager } from '@/core/instance-manager'
import * as store from '@/core/instance-store'

initPlatform()

export async function GET() {
  const states = instanceManager.getAllStates()
  return NextResponse.json({
    instances: states.map((s) => ({
      id: s.config.id,
      name: s.config.name,
      url: s.config.url,
      tags: s.config.tags,
      status: s.status,
      error: s.error,
      serverVersion: s.serverVersion,
      health: s.health,
      agentCount: s.agents.length,
      lastConnected: s.lastConnected,
      lastHealthCheck: s.lastHealthCheck,
    })),
  })
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.id || !body.name || !body.url) {
    return NextResponse.json(
      { error: 'Missing required fields: id, name, url' },
      { status: 400 },
    )
  }

  const config = {
    id: body.id,
    name: body.name,
    url: body.url,
    token: body.token ?? null,
    tags: body.tags ?? [],
  }

  // Save to disk
  store.addInstance(config)

  // Connect
  instanceManager.addInstance(config)

  return NextResponse.json({ ok: true, instance: config })
}
