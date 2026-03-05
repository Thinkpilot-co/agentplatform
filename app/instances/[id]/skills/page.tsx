'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { SkillBrowser } from '@/components/skills/skill-browser'
import { useRpc } from '@/hooks/use-rpc'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { SkillInfo } from '@/core/types'

export default function SkillsPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useRpc<{ skills: SkillInfo[] }>(
    id,
    'skills.status',
    undefined,
    { refetchInterval: 15_000 },
  )

  const skills = data?.skills ?? []

  return (
    <>
      <Header title="Skills" description="Browse and manage installed skills" />
      <AnimatedPage>
        <div className="p-6">
          <AnimatedSection>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <SkillBrowser instanceId={id} skills={skills} />
            )}
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
