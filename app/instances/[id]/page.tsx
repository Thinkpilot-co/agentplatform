'use client'

import { useParams, useRouter } from 'next/navigation'
import { useInstance } from '@/hooks/use-instance'
import { useRemoveInstance } from '@/hooks/use-instances'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Header } from '@/components/dashboard/header'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonStat, SkeletonTable } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Users, Radio, Heart, Server, Trash2, RotateCw } from 'lucide-react'
import { formatUptime, timeAgo } from '@/lib/utils'

export default function InstanceOverviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useInstance(id)
  const removeInstance = useRemoveInstance()
  const { toast } = useToast()

  const handleDelete = () => {
    if (!confirm(`Delete instance "${data?.name ?? id}"? This cannot be undone.`)) return
    removeInstance.mutate(id, {
      onSuccess: () => {
        toast('Instance deleted', 'success')
        router.push('/')
      },
      onError: (err) => toast(err.message, 'error'),
    })
  }

  const handleRetry = async () => {
    try {
      await fetch(`/api/instances/${id}/reconnect`, { method: 'POST' })
      toast('Reconnecting...', 'info')
    } catch {
      toast('Failed to trigger reconnect', 'error')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <SkeletonTable rows={3} cols={4} />
      </div>
    )
  }

  const agents = data.agents ?? []
  const channels = data.channels ?? []

  return (
    <>
      <Header title={data.name} description={data.url} />

      <AnimatedPage>
        <div className="space-y-6 p-6">
          {/* Status cards */}
          <AnimatedSection>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Heart}
                label="Health"
                value={
                  <StatusBadge
                    status={
                      data.status === 'connected'
                        ? data.health?.ok !== false
                          ? 'healthy'
                          : 'unhealthy'
                        : data.status
                    }
                  />
                }
              />
              <StatCard
                icon={Users}
                label="Agents"
                value={
                  <span className="text-xl font-semibold tabular-nums">
                    {agents.length}
                  </span>
                }
              />
              <StatCard
                icon={Radio}
                label="Channels"
                value={
                  <span className="text-xl font-semibold tabular-nums">
                    {channels.length}
                  </span>
                }
              />
              <StatCard
                icon={Server}
                label="Version"
                value={
                  <span className="text-sm font-mono">
                    {data.serverVersion ?? 'N/A'}
                  </span>
                }
              />
            </div>
          </AnimatedSection>

          {/* Agents summary */}
          {agents.length > 0 && (
            <AnimatedSection>
              <section>
                <h3 className="mb-2 text-sm font-medium">Agents</h3>
                <div className="rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Model</th>
                        <th className="px-4 py-2">Skills</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map(
                        (agent: {
                          key: string
                          name: string
                          emoji?: string
                          model?: string
                          skills?: string[]
                          enabled?: boolean
                        }, i: number) => (
                          <tr
                            key={agent.key ?? `agent-${i}`}
                            className="border-b border-[var(--border)] last:border-0"
                          >
                            <td className="px-4 py-2">
                              {agent.emoji && (
                                <span className="mr-1">{agent.emoji}</span>
                              )}
                              {agent.name}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                              {agent.model ?? '\u2014'}
                            </td>
                            <td className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
                              {agent.skills?.length ?? 0}
                            </td>
                            <td className="px-4 py-2">
                              <StatusBadge
                                status={
                                  agent.enabled === false
                                    ? 'disconnected'
                                    : 'connected'
                                }
                                label={
                                  agent.enabled === false
                                    ? 'disabled'
                                    : 'active'
                                }
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </AnimatedSection>
          )}

          {/* Channels summary */}
          {channels.length > 0 && (
            <AnimatedSection>
              <section>
                <h3 className="mb-2 text-sm font-medium">Channels</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {channels.map(
                    (ch: {
                      id: string
                      type: string
                      name?: string
                      connected: boolean
                    }, i: number) => (
                      <div
                        key={ch.id ?? `ch-${i}`}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {ch.name || ch.id}
                          </span>
                          <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                            {ch.type}
                          </span>
                        </div>
                        <StatusBadge
                          status={ch.connected ? 'connected' : 'disconnected'}
                        />
                      </div>
                    ),
                  )}
                </div>
              </section>
            </AnimatedSection>
          )}

          {/* Connection info */}
          <AnimatedSection>
            <section>
              <h3 className="mb-2 text-sm font-medium">Connection Info</h3>
              <div className="rounded-lg border border-[var(--border)] p-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoRow label="Status" value={data.status} />
                  <InfoRow label="URL" value={data.url} mono />
                  {data.lastConnected && (
                    <InfoRow
                      label="Last Connected"
                      value={timeAgo(data.lastConnected)}
                    />
                  )}
                  {data.health?.uptime && (
                    <InfoRow
                      label="Uptime"
                      value={formatUptime(data.health.uptime)}
                    />
                  )}
                  {data.error && <InfoRow label="Error" value={data.error} />}
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Instance actions */}
          <AnimatedSection>
            <section>
              <h3 className="mb-2 text-sm font-medium">Actions</h3>
              <div className="flex items-center gap-3">
                {(data.status === 'disconnected' || data.status === 'error') && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-all hover:bg-[var(--secondary)] active:scale-[0.97]"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Retry Connection
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={removeInstance.isPending}
                  className="flex items-center gap-2 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/10 active:scale-[0.97] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {removeInstance.isPending ? 'Deleting...' : 'Delete Instance'}
                </button>
              </div>
            </section>
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] glass p-4 transition-all hover:border-[var(--border-hover)] hover:shadow-[0_0_20px_-5px_var(--primary-glow)]">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1">{value}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <p className={mono ? 'font-mono text-xs' : ''}>{value}</p>
    </div>
  )
}
