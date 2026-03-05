'use client'

import { useRpc } from '@/hooks/use-rpc'
import { motion } from 'framer-motion'
import { SkeletonStat } from '@/components/ui/skeleton'
import { BarChart3 } from 'lucide-react'

export function UsageChart({ instanceId }: { instanceId: string }) {
  const { data: usageData, isLoading: usageLoading } = useRpc<
    Record<string, unknown>
  >(instanceId, 'usage.status', undefined, { refetchInterval: 30_000 })
  const { data: costData } = useRpc<Record<string, unknown>>(
    instanceId,
    'usage.cost',
    undefined,
    { refetchInterval: 30_000 },
  )

  if (usageLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    )
  }

  if (!usageData) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          No usage data available
        </p>
      </div>
    )
  }

  const usage = usageData as Record<string, unknown>
  const cost = costData as Record<string, unknown> | undefined

  return (
    <div className="space-y-4">
      {/* Token Usage */}
      <div className="grid gap-3 sm:grid-cols-3">
        <UsageStat
          label="Input Tokens"
          value={formatNumber(usage.inputTokens as number)}
          delay={0}
        />
        <UsageStat
          label="Output Tokens"
          value={formatNumber(usage.outputTokens as number)}
          delay={0.04}
        />
        <UsageStat
          label="Total Tokens"
          value={formatNumber(usage.totalTokens as number)}
          delay={0.08}
        />
      </div>

      {/* Cost */}
      {cost && (
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageStat
            label="Estimated Cost"
            value={`$${((cost.totalCost as number) ?? 0).toFixed(4)}`}
            delay={0.12}
          />
          {typeof cost.period === 'string' && (
            <UsageStat label="Period" value={cost.period} delay={0.16} />
          )}
        </div>
      )}

      {/* Raw data display */}
      <details className="rounded-lg border border-[var(--border)]">
        <summary className="cursor-pointer px-4 py-2 text-xs text-[var(--muted-foreground)]">
          Raw usage data
        </summary>
        <pre className="overflow-auto px-4 py-2 font-mono text-xs text-[var(--muted-foreground)]">
          {JSON.stringify({ usage: usageData, cost: costData }, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function UsageStat({
  label,
  value,
  delay = 0,
}: {
  label: string
  value: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-lg border border-[var(--border)] glass p-4 transition-all hover:border-[var(--border-hover)] hover:shadow-[0_0_20px_-5px_var(--primary-glow)]"
    >
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value ?? '\u2014'}
      </p>
    </motion.div>
  )
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return '\u2014'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
