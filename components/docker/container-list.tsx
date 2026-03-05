'use client'

import { ContainerCard } from './container-card'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
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
    <AnimatedList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {containers.map((c) => (
        <AnimatedListItem key={c.id}>
          <ContainerCard container={c} />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  )
}
