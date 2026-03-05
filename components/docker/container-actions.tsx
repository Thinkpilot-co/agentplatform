'use client'

import { Play, Square, RotateCw } from 'lucide-react'
import { useDockerAction } from '@/hooks/use-docker'

export function ContainerActions({
  containerId,
  state,
}: {
  containerId: string
  state: string
}) {
  const action = useDockerAction()
  const isLoading = action.isPending

  return (
    <div className="flex gap-1">
      {state !== 'running' && (
        <button
          onClick={() => action.mutate({ id: containerId, action: 'start' })}
          disabled={isLoading}
          className="flex items-center gap-1 rounded bg-emerald-600/20 px-2 py-1 text-[10px] font-medium text-emerald-400 transition-all duration-150 hover:bg-emerald-600/30 hover:shadow-[0_0_12px_var(--success-glow)] active:scale-[0.96] disabled:opacity-50"
        >
          <Play className="h-3 w-3" />
          Start
        </button>
      )}
      {state === 'running' && (
        <button
          onClick={() => action.mutate({ id: containerId, action: 'stop' })}
          disabled={isLoading}
          className="flex items-center gap-1 rounded bg-red-600/20 px-2 py-1 text-[10px] font-medium text-red-400 transition-all duration-150 hover:bg-red-600/30 hover:shadow-[0_0_12px_var(--error-glow)] active:scale-[0.96] disabled:opacity-50"
        >
          <Square className="h-3 w-3" />
          Stop
        </button>
      )}
      <button
        onClick={() => action.mutate({ id: containerId, action: 'restart' })}
        disabled={isLoading}
        className="flex items-center gap-1 rounded bg-[var(--secondary)] px-2 py-1 text-[10px] font-medium text-[var(--muted-foreground)] transition-all duration-150 hover:bg-[var(--accent)] active:scale-[0.96] disabled:opacity-50"
      >
        <RotateCw className="h-3 w-3" />
        Restart
      </button>
    </div>
  )
}
