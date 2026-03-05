'use client'

import { useRef, useEffect, useState } from 'react'
import { useLogs } from '@/hooks/use-logs'
import { Loader2, Pause, Play, Search } from 'lucide-react'

export function LogViewer({ instanceId }: { instanceId: string }) {
  const { data, isLoading } = useLogs(instanceId, { lines: 200 })
  const [autoScroll, setAutoScroll] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const lines = Array.isArray(data)
    ? data
    : ((data as { lines?: unknown[] })?.lines ?? [])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, autoScroll])

  const filteredLines = lines.filter((line: unknown) => {
    const str = typeof line === 'string' ? line : JSON.stringify(line)
    if (levelFilter && !str.toLowerCase().includes(levelFilter)) return false
    if (search && !str.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none"
        >
          <option value="">All levels</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1 rounded-md border border-[var(--border)] px-3 py-2 text-xs ${
            autoScroll
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
          }`}
        >
          {autoScroll ? (
            <>
              <Pause className="h-3 w-3" /> Auto-scroll
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> Paused
            </>
          )}
        </button>
      </div>

      {/* Log output */}
      <div
        ref={scrollRef}
        className="h-[500px] overflow-auto rounded-lg border border-[var(--border)] bg-black p-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : filteredLines.length === 0 ? (
          <p className="text-sm text-zinc-500">No log entries</p>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-300">
            {filteredLines.map((line: unknown, i: number) => {
              const str = typeof line === 'string' ? line : JSON.stringify(line)
              const isError =
                str.toLowerCase().includes('error') ||
                str.toLowerCase().includes('err')
              const isWarn =
                str.toLowerCase().includes('warn') ||
                str.toLowerCase().includes('warning')
              return (
                <div
                  key={i}
                  className={
                    isError ? 'text-red-400' : isWarn ? 'text-yellow-400' : ''
                  }
                >
                  {str}
                </div>
              )
            })}
          </pre>
        )}
      </div>
    </div>
  )
}
