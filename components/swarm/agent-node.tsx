'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { StatusBadge } from '@/components/dashboard/status-badge'

export interface AgentNodeData {
  label: string
  emoji?: string
  model?: string
  enabled?: boolean
  key: string
  [key: string]: unknown
}

function AgentNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--primary)] !h-2 !w-2 !border-none"
      />

      <div className="flex items-center gap-2">
        {nodeData.emoji && <span className="text-lg">{nodeData.emoji}</span>}
        <div>
          <div className="text-sm font-medium">{nodeData.label}</div>
          <div className="text-[10px] text-[var(--muted-foreground)] font-mono">
            {nodeData.model ?? 'no model'}
          </div>
        </div>
      </div>

      <div className="mt-1">
        <StatusBadge
          status={nodeData.enabled === false ? 'disconnected' : 'connected'}
          label={nodeData.enabled === false ? 'disabled' : 'active'}
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--primary)] !h-2 !w-2 !border-none"
      />
    </div>
  )
}

export const AgentNode = memo(AgentNodeComponent)
