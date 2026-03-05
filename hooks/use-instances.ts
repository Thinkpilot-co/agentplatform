'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchInstances, addInstance, removeInstance } from '@/lib/rpc'

export function useInstances() {
  return useQuery({
    queryKey: ['instances'],
    queryFn: fetchInstances,
    refetchInterval: 10_000,
  })
}

export function useAddInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addInstance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  })
}

export function useRemoveInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeInstance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  })
}
