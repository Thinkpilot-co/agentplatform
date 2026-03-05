'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { ContainerActions } from '@/components/docker/container-actions'
import { useContainerDetail } from '@/hooks/use-docker'
import { formatBytes } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ContainerDetailPage() {
  const { containerId } = useParams<{ containerId: string }>()
  const { data, isLoading } = useContainerDetail(containerId)

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  return (
    <>
      <Header title={data.name} description={data.image} />

      <div className="space-y-6 p-6">
        {/* Status + Actions */}
        <div className="flex items-center gap-4">
          <StatusBadge status={data.state} />
          <ContainerActions containerId={containerId} state={data.state} />
          <Link
            href={`/docker/${containerId}/logs`}
            className="rounded bg-[var(--secondary)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            View Logs
          </Link>
        </div>

        {/* Stats */}
        {data.stats && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">CPU</p>
              <p className="mt-1 text-lg font-semibold">
                {data.stats.cpuPercent}%
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Memory</p>
              <p className="mt-1 text-lg font-semibold">
                {formatBytes(data.stats.memoryUsage)} /{' '}
                {formatBytes(data.stats.memoryLimit)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {data.stats.memoryPercent}%
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">Created</p>
              <p className="mt-1 text-sm">{data.created}</p>
            </div>
          </div>
        )}

        {/* Ports */}
        {data.ports && Object.keys(data.ports).length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium">Ports</h3>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="space-y-1 font-mono text-xs">
                {Object.entries(data.ports).map(
                  ([key, bindings]: [string, unknown]) => (
                    <div key={key}>
                      <span className="text-[var(--muted-foreground)]">
                        {key}
                      </span>
                      {' -> '}
                      {Array.isArray(bindings)
                        ? bindings
                            .map(
                              (b: { HostIp: string; HostPort: string }) =>
                                `${b.HostIp || '0.0.0.0'}:${b.HostPort}`,
                            )
                            .join(', ')
                        : 'not bound'}
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        {/* Volumes */}
        {data.volumes && data.volumes.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium">Volumes</h3>
            <div className="rounded-lg border border-[var(--border)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                    <th className="px-4 py-2">Source</th>
                    <th className="px-4 py-2">Destination</th>
                    <th className="px-4 py-2">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {data.volumes.map(
                    (
                      v: { Source: string; Destination: string; Mode: string },
                      i: number,
                    ) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-2 font-mono">{v.Source}</td>
                        <td className="px-4 py-2 font-mono">{v.Destination}</td>
                        <td className="px-4 py-2">{v.Mode || 'rw'}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Environment Variables */}
        {data.env && data.env.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-medium">Environment Variables</h3>
            <div className="max-h-64 overflow-auto rounded-lg border border-[var(--border)] p-4">
              <div className="space-y-0.5 font-mono text-xs">
                {data.env.map((e: string, i: number) => {
                  const [key, ...rest] = e.split('=')
                  const value = rest.join('=')
                  const isSensitive = /token|password|secret|key/i.test(key)
                  return (
                    <div key={i}>
                      <span className="text-[var(--muted-foreground)]">
                        {key}
                      </span>
                      =<span>{isSensitive ? '********' : value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
