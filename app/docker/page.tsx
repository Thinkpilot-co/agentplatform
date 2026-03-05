'use client'

import { Header } from '@/components/dashboard/header'
import { DockerContainerList } from '@/components/docker/container-list'
import { useDockerContainers } from '@/hooks/use-docker'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Container } from 'lucide-react'

export default function DockerPage() {
  const { data, isLoading } = useDockerContainers()

  return (
    <>
      <Header
        title="Docker Containers"
        description="Monitor and manage local Docker containers"
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
            ) : !data?.available ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
                <Container className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Docker is not available
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Make sure Docker is running and the socket is accessible
                </p>
              </div>
            ) : (
              <DockerContainerList containers={data.containers} />
            )}
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
