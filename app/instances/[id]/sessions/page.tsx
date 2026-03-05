'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { SessionList } from '@/components/monitoring/session-list'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header title="Sessions" description="Browse chat sessions" />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            <SessionList instanceId={id} />
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
