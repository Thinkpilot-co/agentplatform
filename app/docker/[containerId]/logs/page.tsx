'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { DockerContainerLogs } from '@/components/docker/container-logs'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'

export default function ContainerLogsPage() {
  const { containerId } = useParams<{ containerId: string }>()

  return (
    <>
      <Header
        title="Container Logs"
        description={`Container ${containerId.slice(0, 12)}`}
      />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            <DockerContainerLogs containerId={containerId} />
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
