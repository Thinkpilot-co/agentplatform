'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { DockerContainerLogs } from '@/components/docker/container-logs'

export default function ContainerLogsPage() {
  const { containerId } = useParams<{ containerId: string }>()

  return (
    <>
      <Header
        title="Container Logs"
        description={`Container ${containerId.slice(0, 12)}`}
      />
      <div className="p-6">
        <DockerContainerLogs containerId={containerId} />
      </div>
    </>
  )
}
