import { NextResponse } from 'next/server'
import { initPlatform } from '@/core/init'
import { instanceManager } from '@/core/instance-manager'

initPlatform()

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const state = instanceManager.getState(id)

  if (!state) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  instanceManager.reconnect(id)

  return NextResponse.json({ ok: true })
}
