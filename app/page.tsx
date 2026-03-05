'use client'

import { Header } from '@/components/dashboard/header'
import { InstanceCard } from '@/components/dashboard/instance-card'
import { useInstances } from '@/hooks/use-instances'
import { useDockerContainers } from '@/hooks/use-docker'
import { DockerContainerList } from '@/components/docker/container-list'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonCard } from '@/components/ui/skeleton'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Server, Container } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data, isLoading } = useInstances()
  const { data: dockerData } = useDockerContainers()

  const instances = data?.instances ?? []
  const containers = dockerData?.containers ?? []
  const openclawContainers = containers.filter(
    (c: { isOpenClaw: boolean }) => c.isOpenClaw,
  )

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of all connected OpenClaw instances and Docker containers"
      />

      <AnimatedPage>
        <div className="flex-1 space-y-6 p-6">
          {/* Instances Section */}
          <AnimatedSection>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
                  <Server className="h-4 w-4" />
                  Instances
                  <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px]">
                    {instances.length}
                  </span>
                </h2>
                <Link
                  href="/instances/add"
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  + Add Instance
                </Link>
              </div>

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
                    No instances configured
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
            </section>
          </AnimatedSection>

          {/* Docker Section */}
          {dockerData?.available && (
            <AnimatedSection>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
                    <Container className="h-4 w-4" />
                    Docker Containers
                    {openclawContainers.length > 0 && (
                      <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px]">
                        {openclawContainers.length} OpenClaw
                      </span>
                    )}
                  </h2>
                  <Link
                    href="/docker"
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <DockerContainerList
                  containers={
                    openclawContainers.length > 0
                      ? openclawContainers
                      : containers.slice(0, 6)
                  }
                />
              </section>
            </AnimatedSection>
          )}
        </div>
      </AnimatedPage>
    </>
  )
}
