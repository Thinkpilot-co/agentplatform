'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { TopologyEditor } from '@/components/swarm/topology-editor'
import { useAgents } from '@/hooks/use-agents'
import { Loader2, GitBranch } from 'lucide-react'

export default function SwarmPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useAgents(id)

  const agents = data?.agents ?? []

  return (
    <>
      <Header
        title="Swarm Topology"
        description="Visual agent topology editor — drag and connect agents"
      />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
            <GitBranch className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              No agents to visualize. Create agents first.
            </p>
          </div>
        ) : (
          <TopologyEditor instanceId={id} agents={agents} />
        )}
      </div>
    </>
  )
}
