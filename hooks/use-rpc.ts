'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rpc } from '@/lib/rpc'

export function useRpc<T = unknown>(
  instanceId: string,
  method: string,
  params?: unknown,
  opts?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery<T>({
    queryKey: ['rpc', instanceId, method, params],
    queryFn: () => rpc<T>(instanceId, method, params),
    enabled: opts?.enabled ?? !!instanceId,
    refetchInterval: opts?.refetchInterval,
  })
}

export function useRpcMutation<T = unknown>(
  instanceId: string,
  method: string,
  opts?: { invalidateKeys?: string[][] },
) {
  const qc = useQueryClient()
  return useMutation<T, Error, unknown>({
    mutationFn: (params) => rpc<T>(instanceId, method, params),
    onSuccess: () => {
      if (opts?.invalidateKeys) {
        opts.invalidateKeys.forEach((key) =>
          qc.invalidateQueries({ queryKey: key }),
        )
      }
    },
  })
}
