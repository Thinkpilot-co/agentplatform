'use client'

import Link from 'next/link'
import { Container } from 'lucide-react'
import { motion } from 'framer-motion'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { ContainerActions } from './container-actions'
import type { DockerContainerInfo } from '@/core/types'

export function ContainerCard({
  container,
}: {
  container: DockerContainerInfo
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-lg border border-[var(--border)] glass p-4 transition-all hover:border-[var(--border-hover)] hover:shadow-[0_0_20px_-5px_var(--primary-glow)]"
    >
      <div className="flex items-start justify-between">
        <Link
          href={`/docker/${container.id}`}
          className="flex items-center gap-2 hover:text-[var(--primary)]"
        >
          <Container className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium">{container.name}</span>
        </Link>
        <StatusBadge status={container.state} />
      </div>

      <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
        {container.image}
      </p>

      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
        {container.status}
      </p>

      {container.isOpenClaw && (
        <span className="mt-2 inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
          OpenClaw
        </span>
      )}

      {container.ports.length > 0 && (
        <div className="mt-2 text-[10px] text-[var(--muted-foreground)]">
          {container.ports
            .filter((p) => p.publicPort)
            .map((p) => `${p.publicPort}:${p.privatePort}`)
            .join(', ')}
        </div>
      )}

      <div className="mt-3">
        <ContainerActions containerId={container.id} state={container.state} />
      </div>
    </motion.div>
  )
}
