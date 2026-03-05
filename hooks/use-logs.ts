'use client'

import { useQuery } from '@tanstack/react-query'
import { rpc } from '@/lib/rpc'

export function useLogs(instanceId: string, opts?: { lines?: number }) {
  return useQuery({
    queryKey: ['rpc', instanceId, 'logs.tail', opts],
    queryFn: () => rpc(instanceId, 'logs.tail', { lines: opts?.lines ?? 100 }),
    enabled: !!instanceId,
    refetchInterval: 3_000,
  })
}
