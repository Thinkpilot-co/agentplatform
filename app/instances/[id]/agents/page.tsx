'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { AgentList } from '@/components/agents/agent-list'
import { useAgents } from '@/hooks/use-agents'
import { Loader2 } from 'lucide-react'

export default function AgentsPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useAgents(id)

  const agents = data?.agents ?? []

  return (
    <>
      <Header title="Agents" description="Manage agents for this instance" />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : (
          <AgentList instanceId={id} agents={agents} />
        )}
      </div>
    </>
  )
}
