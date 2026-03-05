'use client'

import { Header } from '@/components/dashboard/header'
import { DockerContainerList } from '@/components/docker/container-list'
import { useDockerContainers } from '@/hooks/use-docker'
import { Loader2, Container } from 'lucide-react'

export default function DockerPage() {
  const { data, isLoading } = useDockerContainers()

  return (
    <>
      <Header
        title="Docker Containers"
        description="Monitor and manage local Docker containers"
      />

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
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
      </div>
    </>
  )
}
