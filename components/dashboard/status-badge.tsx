'use client'

import { cn } from '@/lib/utils'

type Status =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'running'
  | 'exited'
  | 'paused'
  | 'restarting'
  | 'dead'
  | 'created'
  | 'healthy'
  | 'unhealthy'

const statusColors: Record<string, string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-yellow-500 animate-pulse',
  disconnected: 'bg-zinc-500',
  error: 'bg-red-500',
  running: 'bg-emerald-500',
  exited: 'bg-zinc-500',
  paused: 'bg-yellow-500',
  restarting: 'bg-yellow-500 animate-pulse',
  dead: 'bg-red-500',
  created: 'bg-zinc-500',
  healthy: 'bg-emerald-500',
  unhealthy: 'bg-red-500',
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        className,
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          statusColors[status] ?? 'bg-zinc-500',
        )}
      />
      {label ?? status}
    </span>
  )
}
