'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDockerContainers, dockerAction } from '@/lib/rpc'

export function useDockerContainers() {
  return useQuery({
    queryKey: ['docker'],
    queryFn: fetchDockerContainers,
    refetchInterval: 10_000,
  })
}

export function useDockerAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'start' | 'stop' | 'restart'
    }) => dockerAction(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docker'] }),
  })
}

export function useContainerDetail(id: string) {
  return useQuery({
    queryKey: ['docker', id],
    queryFn: async () => {
      const res = await fetch(`/api/docker/${id}`)
      if (!res.ok) throw new Error('Failed to fetch container')
      return res.json()
    },
    enabled: !!id,
    refetchInterval: 10_000,
  })
}

export function useContainerLogs(id: string, tail = 200) {
  return useQuery({
    queryKey: ['docker', id, 'logs', tail],
    queryFn: async () => {
      const res = await fetch(`/api/docker/${id}/logs?tail=${tail}`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
    enabled: !!id,
    refetchInterval: 5_000,
  })
}
