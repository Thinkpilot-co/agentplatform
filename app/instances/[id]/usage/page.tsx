'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { UsageChart } from '@/components/monitoring/usage-chart'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'

export default function UsagePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header title="Usage" description="Token usage and cost estimates" />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            <UsageChart instanceId={id} />
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
