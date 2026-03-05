'use client'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { useEvents } from '@/hooks/use-events'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <EventInvalidator />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}

function EventInvalidator() {
  const qc = useQueryClient()

  useEvents((event) => {
    switch (event.type) {
      case 'instance:connected':
      case 'instance:disconnected':
      case 'instance:error':
      case 'instance:added':
      case 'instance:removed':
        qc.invalidateQueries({ queryKey: ['instances'] })
        if (event.instanceId) {
          qc.invalidateQueries({ queryKey: ['instance', event.instanceId] })
        }
        break
      case 'instance:health':
        if (event.instanceId) {
          qc.invalidateQueries({ queryKey: ['instance', event.instanceId] })
        }
        break
      case 'docker:container:discovered':
      case 'docker:container:started':
      case 'docker:container:stopped':
      case 'docker:container:removed':
        qc.invalidateQueries({ queryKey: ['docker'] })
        break
      case 'agent:updated':
      case 'channel:updated':
        if (event.instanceId) {
          qc.invalidateQueries({ queryKey: ['instance', event.instanceId] })
        }
        break
    }
  })

  return null
}
