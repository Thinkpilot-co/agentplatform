'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rpc } from '@/lib/rpc'
import type { AgentInfo } from '@/core/types'

export function useAgents(instanceId: string) {
  return useQuery({
    queryKey: ['rpc', instanceId, 'agents.list'],
    queryFn: () => rpc<{ agents: AgentInfo[] }>(instanceId, 'agents.list'),
    enabled: !!instanceId,
    refetchInterval: 15_000,
  })
}

export function useCreateAgent(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (agent: Partial<AgentInfo>) =>
      rpc(instanceId, 'agents.create', agent),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['rpc', instanceId, 'agents.list'],
      }),
  })
}

export function useUpdateAgent(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { key: string } & Partial<AgentInfo>) =>
      rpc(instanceId, 'agents.update', params),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['rpc', instanceId, 'agents.list'],
      }),
  })
}

export function useDeleteAgent(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => rpc(instanceId, 'agents.delete', { key }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['rpc', instanceId, 'agents.list'],
      }),
  })
}
