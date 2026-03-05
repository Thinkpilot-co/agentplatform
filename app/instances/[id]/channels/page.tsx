'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { ChannelGrid } from '@/components/channels/channel-grid'
import { useChannels } from '@/hooks/use-channels'
import { AnimatedPage, AnimatedSection } from '@/components/ui/animated-page'
import { SkeletonCard } from '@/components/ui/skeleton'

export default function ChannelsPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useChannels(id)

  const channels = data?.channels ?? []

  return (
    <>
      <Header
        title="Channels"
        description="Monitor channel connections and status"
      />
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
              <ChannelGrid channels={channels} />
            )}
          </AnimatedSection>
        </div>
      </AnimatedPage>
    </>
  )
}
