'use client'

import { useRpc } from '@/hooks/use-rpc'
import { MessageSquare, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { SessionInfo } from '@/core/types'

export function SessionList({ instanceId }: { instanceId: string }) {
  const { data, isLoading } = useRpc<{ sessions: SessionInfo[] }>(
    instanceId,
    'sessions.list',
    { limit: 50 },
    { refetchInterval: 15_000 },
  )

  const sessions = data?.sessions ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          No sessions yet
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
            <th className="px-4 py-2">Session</th>
            <th className="px-4 py-2">Agent</th>
            <th className="px-4 py-2">Channel</th>
            <th className="px-4 py-2">Messages</th>
            <th className="px-4 py-2">Last Active</th>
            <th className="px-4 py-2">Preview</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="border-b border-[var(--border)] last:border-0"
            >
              <td className="px-4 py-2 font-mono text-xs">
                {session.id.slice(0, 8)}
              </td>
              <td className="px-4 py-2 text-xs">{session.agentKey}</td>
              <td className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
                {session.channelId ?? '—'}
              </td>
              <td className="px-4 py-2 text-xs">
                {session.messageCount ?? '—'}
              </td>
              <td className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
                {timeAgo(session.updatedAt)}
              </td>
              <td className="max-w-xs truncate px-4 py-2 text-xs text-[var(--muted-foreground)]">
                {session.preview ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
