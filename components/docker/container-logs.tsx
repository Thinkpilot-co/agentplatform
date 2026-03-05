'use client'

import { useContainerLogs } from '@/hooks/use-docker'
import { Loader2 } from 'lucide-react'

export function DockerContainerLogs({ containerId }: { containerId: string }) {
  const { data, isLoading } = useContainerLogs(containerId, 500)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  const logs = data?.logs ?? ''

  return (
    <div className="rounded-lg border border-[var(--border)] bg-black p-4">
      <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-300">
        {logs || 'No logs available'}
      </pre>
    </div>
  )
}
