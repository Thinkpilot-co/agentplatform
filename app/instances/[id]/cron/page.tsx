'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rpc } from '@/lib/rpc'
import { Header } from '@/components/dashboard/header'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonTable } from '@/components/ui/skeleton'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useToast } from '@/components/ui/toast'
import { Clock, Plus, Trash2, Pencil, X } from 'lucide-react'
import type { CronJob } from '@/core/types'

export default function CronPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CronJob | null>(null)

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['instance', id, 'cron'],
    queryFn: () => rpc<CronJob[]>(id, 'cron.list'),
    refetchInterval: 15_000,
  })

  const removeMutation = useMutation({
    mutationFn: (jobId: string) => rpc(id, 'cron.remove', { id: jobId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instance', id, 'cron'] })
      toast('Cron job deleted', 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ jobId, enabled }: { jobId: string; enabled: boolean }) =>
      rpc(id, 'cron.update', { id: jobId, enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instance', id, 'cron'] })
    },
    onError: (err) => toast(err.message, 'error'),
  })

  const cronJobs = Array.isArray(jobs) ? jobs : (jobs as unknown as Record<string, unknown>)?.jobs as CronJob[] ?? []

  return (
    <>
      <Header
        title="Cron Jobs"
        description="Scheduled tasks for this instance"
      />

      <AnimatedPage>
        <div className="flex-1 space-y-4 p-6">
          <AnimatedSection>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
                <Clock className="h-4 w-4" />
                Scheduled Tasks
                <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px]">
                  {cronJobs.length}
                </span>
              </h3>
              <button
                onClick={() => {
                  setEditing(null)
                  setShowForm(true)
                }}
                className="flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[var(--primary-hover)] active:scale-[0.97]"
              >
                <Plus className="h-3 w-3" />
                Add Job
              </button>
            </div>
          </AnimatedSection>

          {showForm && (
            <AnimatedSection>
              <CronForm
                instanceId={id}
                initial={editing}
                onClose={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
              />
            </AnimatedSection>
          )}

          <AnimatedSection>
            {isLoading ? (
              <SkeletonTable rows={3} cols={6} />
            ) : cronJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
                <Clock className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  No cron jobs configured
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  Create your first scheduled task
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Schedule</th>
                      <th className="px-4 py-2">Agent</th>
                      <th className="px-4 py-2">Next Run</th>
                      <th className="px-4 py-2">Enabled</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-2 font-medium">{job.name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                          {job.schedule}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
                          {job.agentKey}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--muted-foreground)]">
                          {job.nextRun
                            ? new Date(job.nextRun).toLocaleString()
                            : '\u2014'}
                        </td>
                        <td className="px-4 py-2">
                          <ToggleSwitch
                            checked={job.enabled}
                            onChange={(enabled) =>
                              toggleMutation.mutate({
                                jobId: job.id,
                                enabled,
                              })
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditing(job)
                                setShowForm(true)
                              }}
                              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete cron job "${job.name}"?`)) {
                                  removeMutation.mutate(job.id)
                                }
                              }}
                              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}

function CronForm({
  instanceId,
  initial,
  onClose,
}: {
  instanceId: string
  initial: CronJob | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [name, setName] = useState(initial?.name ?? '')
  const [schedule, setSchedule] = useState(initial?.schedule ?? '0 * * * *')
  const [agentKey, setAgentKey] = useState(initial?.agentKey ?? '')
  const [message, setMessage] = useState(initial?.message ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const method = initial ? 'cron.update' : 'cron.add'
      const params = initial
        ? { id: initial.id, name, schedule, agentKey, message }
        : { name, schedule, agentKey, message }
      return rpc(instanceId, method, params)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instance', instanceId, 'cron'] })
      toast(initial ? 'Cron job updated' : 'Cron job created', 'success')
      onClose()
    },
    onError: (err) => toast(err.message, 'error'),
  })

  return (
    <div className="rounded-lg border border-[var(--border)] glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {initial ? 'Edit Cron Job' : 'New Cron Job'}
        </h4>
        <button
          onClick={onClose}
          className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Daily summary"
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Schedule (cron expression)
          </label>
          <input
            type="text"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="0 * * * *"
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 font-mono text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Agent Key
          </label>
          <input
            type="text"
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            placeholder="agent-key"
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Message
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What should the agent do?"
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!name || !schedule || !agentKey || mutation.isPending}
          className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[var(--primary-hover)] active:scale-[0.97] disabled:opacity-50"
        >
          {mutation.isPending
            ? 'Saving...'
            : initial
              ? 'Update'
              : 'Create'}
        </button>
      </div>
    </div>
  )
}
