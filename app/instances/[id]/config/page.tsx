'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { SchemaForm } from '@/components/config/schema-form'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'

export default function ConfigPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Header
        title="Configuration"
        description="View and edit instance configuration"
      />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            <SchemaForm instanceId={id} />
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
