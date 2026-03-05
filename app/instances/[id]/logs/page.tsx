'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { LogViewer } from '@/components/monitoring/log-viewer'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'

export default function LogsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header title="Logs" description="Real-time application logs" />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            <LogViewer instanceId={id} />
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
