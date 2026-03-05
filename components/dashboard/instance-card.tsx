'use client'

import Link from 'next/link'
import { Server, Users, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { StatusBadge } from './status-badge'
import { timeAgo } from '@/lib/utils'

interface InstanceCardProps {
  id: string
  name: string
  url: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  tags: string[]
  agentCount: number
  serverVersion?: string
  health?: { ok: boolean }
  lastConnected?: number
}

export function InstanceCard({
  id,
  name,
  url,
  status,
  tags,
  agentCount,
  serverVersion,
  health,
  lastConnected,
}: InstanceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/instances/${id}`}
        className="group block rounded-lg border border-[var(--border)] glass p-4 transition-all hover:border-[var(--border-hover)] hover:shadow-[0_0_20px_-5px_var(--primary-glow)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="font-medium">{name}</span>
          </div>
          <StatusBadge
            status={health?.ok === false ? 'unhealthy' : status}
            label={health?.ok === false ? 'unhealthy' : status}
          />
        </div>

        <p className="mt-1 text-xs text-[var(--muted-foreground)] truncate">
          {url}
        </p>

        <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {agentCount} agent{agentCount !== 1 ? 's' : ''}
          </span>
          {serverVersion && (
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3" />v{serverVersion}
            </span>
          )}
        </div>

        {(tags.length > 0 || lastConnected) && (
          <div className="mt-2 flex items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]"
              >
                {tag}
              </span>
            ))}
            {lastConnected && (
              <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
                {timeAgo(lastConnected)}
              </span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  )
}
