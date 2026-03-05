'use client'

import { StatusBadge } from '@/components/dashboard/status-badge'
import { Radio } from 'lucide-react'
import type { ChannelInfo } from '@/core/types'

export function ChannelGrid({ channels }: { channels: ChannelInfo[] }) {
  if (channels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
        <Radio className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          No channels configured
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((ch) => (
        <div
          key={ch.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-medium">{ch.name || ch.id}</span>
              <span className="ml-2 rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                {ch.type}
              </span>
            </div>
            <StatusBadge status={ch.connected ? 'connected' : 'disconnected'} />
          </div>

          {ch.error && <p className="mt-1 text-xs text-red-400">{ch.error}</p>}

          <div className="mt-2 flex gap-4 text-xs text-[var(--muted-foreground)]">
            {ch.peerCount !== undefined && <span>{ch.peerCount} peers</span>}
            {ch.lastMessage && (
              <span>
                Last msg: {new Date(ch.lastMessage).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
