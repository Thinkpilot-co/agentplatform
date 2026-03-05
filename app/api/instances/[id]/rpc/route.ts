import { NextResponse } from 'next/server'
import { initPlatform } from '@/core/init'
import { instanceManager } from '@/core/instance-manager'
import { createLogger } from '@/core/logger'

const log = createLogger('api-rpc')

initPlatform()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  if (!body.method) {
    return NextResponse.json(
      { error: 'Missing required field: method' },
      { status: 400 },
    )
  }

  const client = instanceManager.getClient(id)
  if (!client) {
    log.warn({ id, method: body.method }, 'RPC to unknown instance')
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  if (!client.connected) {
    const state = instanceManager.getState(id)
    log.warn(
      { id, method: body.method, status: state?.status },
      'RPC to disconnected instance',
    )
    return NextResponse.json(
      { error: 'Instance not connected' },
      { status: 503 },
    )
  }

  try {
    const result = await client.request(body.method, body.params)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RPC call failed'
    log.error({ id, method: body.method, err }, 'RPC call failed')
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
