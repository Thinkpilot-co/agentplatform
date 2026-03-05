'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { AgentList } from '@/components/agents/agent-list'
import { useAgents } from '@/hooks/use-agents'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonTable } from '@/components/ui/skeleton'

export default function AgentsPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useAgents(id)

  const agents = data?.agents ?? []

  return (
    <>
      <Header title="Agents" description="Manage agents for this instance" />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            {isLoading ? (
              <SkeletonTable rows={4} cols={6} />
            ) : (
              <AgentList instanceId={id} agents={agents} />
            )}
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
