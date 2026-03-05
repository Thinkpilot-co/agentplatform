'use client'

import { useContainerLogs } from '@/hooks/use-docker'
import { Skeleton } from '@/components/ui/skeleton'

export function DockerContainerLogs({ containerId }: { containerId: string }) {
  const { data, isLoading } = useContainerLogs(containerId, 500)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--border)] glass p-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    )
  }

  const logs = data?.logs ?? ''

  return (
    <div className="rounded-lg border border-[var(--border)] glass p-4">
      <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-300">
        {logs || 'No logs available'}
      </pre>
    </div>
  )
}
