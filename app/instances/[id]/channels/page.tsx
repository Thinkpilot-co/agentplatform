'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { ChannelGrid } from '@/components/channels/channel-grid'
import { useChannels } from '@/hooks/use-channels'
import { Loader2 } from 'lucide-react'

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
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : (
          <ChannelGrid channels={channels} />
        )}
      </div>
    </>
  )
}
