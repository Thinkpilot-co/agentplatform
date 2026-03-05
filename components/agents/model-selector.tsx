'use client'

import { useRpc } from '@/hooks/use-rpc'
import type { ModelInfo } from '@/core/types'

export function ModelSelector({
  instanceId,
  value,
  onChange,
}: {
  instanceId: string
  value: string
  onChange: (model: string) => void
}) {
  const { data } = useRpc<{ models: ModelInfo[] }>(
    instanceId,
    'models.list',
    undefined,
    { refetchInterval: 60_000 },
  )

  const models = data?.models ?? []

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
    >
      <option value="">Select a model</option>
      {models.map((m, i) => (
        <option key={`${m.id}-${m.provider ?? i}`} value={m.id}>
          {m.name || m.id}
          {m.provider ? ` (${m.provider})` : ''}
        </option>
      ))}
      {/* Allow custom model input */}
      {value && !models.find((m) => m.id === value) && (
        <option value={value}>{value}</option>
      )}
    </select>
  )
}
