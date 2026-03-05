'use client'

import { Header } from '@/components/dashboard/header'
import { InstanceCard } from '@/components/dashboard/instance-card'
import { useInstances } from '@/hooks/use-instances'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Server } from 'lucide-react'
import Link from 'next/link'

export default function InstancesPage() {
  const { data, isLoading } = useInstances()
  const instances = data?.instances ?? []

  return (
    <>
      <Header
        title="Instances"
        description="Manage connections to OpenClaw gateway instances"
      />

      <AnimatedPage>
        <div className="flex-1 p-6">
          <AnimatedSection>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : instances.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
                <Server className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  No instances configured yet
                </p>
                <Link
                  href="/instances/add"
                  className="mt-2 inline-block text-sm text-[var(--primary)] hover:underline"
                >
                  Add your first instance
                </Link>
              </div>
            ) : (
              <AnimatedList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {instances.map(
                  (inst: {
                    id: string
                    name: string
                    url: string
                    status:
                      | 'connected'
                      | 'connecting'
                      | 'disconnected'
                      | 'error'
                    tags: string[]
                    agentCount: number
                    serverVersion?: string
                    health?: { ok: boolean }
                    lastConnected?: number
                  }) => (
                    <AnimatedListItem key={inst.id}>
                      <InstanceCard {...inst} />
                    </AnimatedListItem>
                  ),
                )}
              </AnimatedList>
            )}
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
