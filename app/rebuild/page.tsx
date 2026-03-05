'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from '@/components/dashboard/header'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { motion } from 'framer-motion'
import {
  Hammer,
  Play,
  Square,
  RotateCw,
  Check,
  X,
  Loader2,
  RefreshCw,
  Package,
  Rocket,
  HeartPulse,
} from 'lucide-react'
import type { BuildStep, BuildState } from '@/core/rebuilder'

const STEP_LABELS: Record<BuildStep, { label: string; icon: typeof Hammer }> = {
  idle: { label: 'Ready', icon: Hammer },
  sync: { label: 'Syncing from OpenClaw', icon: RefreshCw },
  build: { label: 'Building Docker image', icon: Package },
  deploy: { label: 'Deploying container', icon: Rocket },
  healthcheck: { label: 'Health check', icon: HeartPulse },
  done: { label: 'Complete', icon: Check },
  error: { label: 'Failed', icon: X },
}

const STEPS: BuildStep[] = ['sync', 'build', 'deploy', 'healthcheck', 'done']

export default function RebuildPage() {
  const [state, setState] = useState<BuildState>({
    status: 'idle',
    running: false,
    startedAt: null,
    finishedAt: null,
    error: null,
    imageTag: null,
    logs: [],
  })
  const [logs, setLogs] = useState<string[]>([])
  const [options, setOptions] = useState({
    sync: true,
    deploy: true,
  })
  const logsRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch initial state
  useEffect(() => {
    fetch('/api/rebuild')
      .then((r) => r.json())
      .then((data) => {
        setState(data)
        if (data.logs) setLogs(data.logs)
        // If a build is running, connect to stream
        if (data.running) {
          connectStream()
        }
      })
      .catch(() => {})

    return () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  const connectStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/rebuild/stream')
    eventSourceRef.current = es

    es.addEventListener('log', (e) => {
      const line = JSON.parse(e.data) as string
      setLogs((prev) => [...prev, line])
    })

    es.addEventListener('state', (e) => {
      const update = JSON.parse(e.data)
      setState((prev) => ({ ...prev, ...update }))

      // Disconnect when build completes
      if (
        !update.running &&
        (update.status === 'done' || update.status === 'error')
      ) {
        // Fetch final state
        setTimeout(() => {
          fetch('/api/rebuild')
            .then((r) => r.json())
            .then(setState)
            .catch(() => {})
        }, 500)
      }
    })

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  const handleStart = async () => {
    setLogs([])
    setState((prev) => ({
      ...prev,
      running: true,
      status: 'sync',
      error: null,
    }))

    try {
      const res = await fetch('/api/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState((prev) => ({
          ...prev,
          running: false,
          status: 'error',
          error: body.error || 'Failed to start build',
        }))
        return
      }

      // Connect to log stream
      connectStream()
    } catch (err) {
      setState((prev) => ({
        ...prev,
        running: false,
        status: 'error',
        error: err instanceof Error ? err.message : 'Network error',
      }))
    }
  }

  const handleCancel = async () => {
    await fetch('/api/rebuild', { method: 'DELETE' })
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    setState((prev) => ({
      ...prev,
      running: false,
      status: 'error',
      error: 'Cancelled',
    }))
  }

  const elapsed =
    state.startedAt && state.finishedAt
      ? ((state.finishedAt - state.startedAt) / 1000).toFixed(1)
      : state.startedAt
        ? ((Date.now() - state.startedAt) / 1000).toFixed(0)
        : null

  return (
    <>
      <Header
        title="Rebuild"
        description="Sync from OpenClaw source, build Docker image, and redeploy"
      />

      <AnimatedPage>
        <div className="flex-1 space-y-6 p-6">
          {/* Pipeline steps */}
          <AnimatedSection>
            <div className="flex items-center gap-2">
              {STEPS.map((step, i) => {
                const stepIdx = STEPS.indexOf(state.status)
                const thisIdx = i
                const isActive = state.status === step
                const isDone =
                  state.status === 'done' ||
                  (stepIdx > thisIdx && state.running)
                const isError = state.status === 'error' && stepIdx === thisIdx
                const StepInfo = STEP_LABELS[step]

                return (
                  <div key={step} className="flex items-center gap-2">
                    {i > 0 && (
                      <motion.div
                        className="h-px w-6"
                        initial={{ scaleX: 0 }}
                        animate={{
                          scaleX: isDone || isActive ? 1 : 0,
                          backgroundColor: isDone
                            ? 'rgb(34, 197, 94)'
                            : isActive
                              ? 'var(--primary)'
                              : 'var(--border)',
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          originX: 0,
                          backgroundColor: isDone
                            ? 'rgb(34, 197, 94)'
                            : isActive
                              ? 'var(--primary)'
                              : 'var(--border)',
                        }}
                      />
                    )}
                    <motion.div
                      animate={{
                        scale: isActive && state.running ? 1.05 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive && state.running
                          ? 'bg-[var(--primary)] text-white shadow-[0_0_16px_var(--primary-glow-strong)]'
                          : isDone
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isError
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      {isActive && state.running ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isDone ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 25,
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </motion.div>
                      ) : isError ? (
                        <X className="h-3 w-3" />
                      ) : (
                        <StepInfo.icon className="h-3 w-3" />
                      )}
                      {StepInfo.label}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </AnimatedSection>

          {/* Controls */}
          <AnimatedSection>
            <div className="flex items-center gap-4">
              {!state.running ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--primary-hover)] active:scale-[0.97]"
                >
                  <Play className="h-4 w-4" />
                  Start Rebuild
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 active:scale-[0.97]"
                >
                  <Square className="h-4 w-4" />
                  Cancel
                </button>
              )}

              {/* Options toggles */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={options.sync}
                  onChange={(e) =>
                    setOptions({ ...options, sync: e.target.checked })
                  }
                  disabled={state.running}
                  className="rounded"
                />
                Sync from OpenClaw
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={options.deploy}
                  onChange={(e) =>
                    setOptions({ ...options, deploy: e.target.checked })
                  }
                  disabled={state.running}
                  className="rounded"
                />
                Deploy container
              </label>

              {elapsed && (
                <span className="ml-auto text-xs text-[var(--muted-foreground)] tabular-nums">
                  {state.finishedAt
                    ? `Completed in ${elapsed}s`
                    : `${elapsed}s elapsed`}
                </span>
              )}
            </div>
          </AnimatedSection>

          {/* Status summary */}
          {state.status !== 'idle' && (
            <AnimatedSection>
              <AnimatedList className="grid gap-3 sm:grid-cols-4">
                <AnimatedListItem>
                  <StatusCard
                    label="Status"
                    value={STEP_LABELS[state.status].label}
                    variant={
                      state.status === 'done'
                        ? 'success'
                        : state.status === 'error'
                          ? 'error'
                          : state.running
                            ? 'active'
                            : 'default'
                    }
                  />
                </AnimatedListItem>
                <AnimatedListItem>
                  <StatusCard
                    label="Image Tag"
                    value={state.imageTag ?? '\u2014'}
                    variant="default"
                  />
                </AnimatedListItem>
                <AnimatedListItem>
                  <StatusCard
                    label="Started"
                    value={
                      state.startedAt
                        ? new Date(state.startedAt).toLocaleTimeString()
                        : '\u2014'
                    }
                    variant="default"
                  />
                </AnimatedListItem>
                <AnimatedListItem>
                  <StatusCard
                    label="Duration"
                    value={elapsed ? `${elapsed}s` : '\u2014'}
                    variant="default"
                  />
                </AnimatedListItem>
              </AnimatedList>
            </AnimatedSection>
          )}

          {/* Error banner */}
          {state.error && (
            <AnimatedSection>
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {state.error}
              </div>
            </AnimatedSection>
          )}

          {/* Build logs */}
          <AnimatedSection>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Build Output</h3>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:scale-[0.96] transition-all"
                  >
                    <RotateCw className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>

              <div
                ref={logsRef}
                className="h-[400px] overflow-auto rounded-lg border border-[var(--border)] glass p-4"
              >
                {logs.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Click &quot;Start Rebuild&quot; to begin. Build output will
                    appear here.
                  </p>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-300">
                    {logs.map((line, i) => {
                      const isStep = line.startsWith('==> Step:')
                      const isError =
                        line.startsWith('==> ERROR') ||
                        line.toLowerCase().includes('error')
                      const isSuccess =
                        line.startsWith('==> Rebuild complete') ||
                        line.includes('Ready at')
                      const isCmd = line.startsWith('$ ')

                      return (
                        <div
                          key={i}
                          className={
                            isStep
                              ? 'font-bold text-[var(--primary)]'
                              : isError
                                ? 'text-red-400'
                                : isSuccess
                                  ? 'text-emerald-400 font-bold'
                                  : isCmd
                                    ? 'text-yellow-400'
                                    : ''
                          }
                        >
                          {line}
                        </div>
                      )
                    })}
                  </pre>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}

function StatusCard({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant: 'default' | 'success' | 'error' | 'active'
}) {
  const borderColor =
    variant === 'success'
      ? 'border-emerald-500/30'
      : variant === 'error'
        ? 'border-red-500/30'
        : variant === 'active'
          ? 'border-[var(--primary)]/30'
          : 'border-[var(--border)]'

  return (
    <div className={`rounded-lg border ${borderColor} glass p-3`}>
      <p className="text-[10px] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium truncate tabular-nums">
        {value}
      </p>
    </div>
  )
}
