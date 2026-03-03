"use client";

import { useRpc } from "@/hooks/use-rpc";
import { Loader2, BarChart3 } from "lucide-react";

export function UsageChart({ instanceId }: { instanceId: string }) {
  const { data: usageData, isLoading: usageLoading } = useRpc<Record<string, unknown>>(
    instanceId,
    "usage.status",
    undefined,
    { refetchInterval: 30_000 }
  );
  const { data: costData } = useRpc<Record<string, unknown>>(
    instanceId,
    "usage.cost",
    undefined,
    { refetchInterval: 30_000 }
  );

  if (usageLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          No usage data available
        </p>
      </div>
    );
  }

  const usage = usageData as Record<string, unknown>;
  const cost = costData as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      {/* Token Usage */}
      <div className="grid gap-3 sm:grid-cols-3">
        <UsageStat
          label="Input Tokens"
          value={formatNumber(usage.inputTokens as number)}
        />
        <UsageStat
          label="Output Tokens"
          value={formatNumber(usage.outputTokens as number)}
        />
        <UsageStat
          label="Total Tokens"
          value={formatNumber(usage.totalTokens as number)}
        />
      </div>

      {/* Cost */}
      {cost && (
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageStat
            label="Estimated Cost"
            value={`$${((cost.totalCost as number) ?? 0).toFixed(4)}`}
          />
          {typeof cost.period === "string" && (
            <UsageStat label="Period" value={cost.period} />
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
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value ?? "—"}</p>
    </div>
  );
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
