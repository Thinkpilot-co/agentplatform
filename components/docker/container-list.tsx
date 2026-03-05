'use client'

import { ContainerCard } from './container-card'
import type { DockerContainerInfo } from '@/core/types'

export function DockerContainerList({
  containers,
}: {
  containers: DockerContainerInfo[]
}) {
  if (containers.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
        No containers found
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {containers.map((c) => (
        <ContainerCard key={c.id} container={c} />
      ))}
    </div>
  )
}
