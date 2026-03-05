'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { AgentForm } from './agent-form'
import { useDeleteAgent } from '@/hooks/use-agents'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2, Pencil, Plus } from 'lucide-react'
import type { AgentInfo } from '@/core/types'

export function AgentList({
  instanceId,
  agents,
}: {
  instanceId: string
  agents: AgentInfo[]
}) {
  const [editing, setEditing] = useState<AgentInfo | null>(null)
  const [creating, setCreating] = useState(false)
  const deleteAgent = useDeleteAgent(instanceId)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {agents.length} Agent{agents.length !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={() => {
            setEditing(null)
            setCreating(true)
          }}
          className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[var(--primary-hover)] active:scale-[0.96]"
        >
          <Plus className="h-3 w-3" />
          New Agent
        </button>
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-4 overflow-hidden"
          >
            <AgentForm
              instanceId={instanceId}
              agent={editing ?? undefined}
              onClose={() => {
                setCreating(false)
                setEditing(null)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
              <th className="px-4 py-2">Agent</th>
              <th className="px-4 py-2">Model</th>
              <th className="px-4 py-2">Skills</th>
              <th className="px-4 py-2">Tools</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <motion.tr
                key={agent.key ?? `agent-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-4 py-2">
                  <span className="font-medium">
                    {agent.emoji && <span className="mr-1">{agent.emoji}</span>}
                    {agent.name}
                  </span>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    {agent.key}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                  {agent.model ?? '\u2014'}
                </td>
                <td className="px-4 py-2 text-xs">
                  {agent.skills?.length ?? 0}
                </td>
                <td className="px-4 py-2 text-xs">
                  {agent.tools?.length ?? 0}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge
                    status={
                      agent.enabled === false ? 'disconnected' : 'connected'
                    }
                    label={agent.enabled === false ? 'disabled' : 'active'}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setCreating(false)
                        setEditing(agent)
                      }}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] active:scale-[0.96] transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete agent "${agent.name}"?`)) {
                          deleteAgent.mutate(agent.key)
                        }
                      }}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:bg-red-600/20 hover:text-red-400 active:scale-[0.96] transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No agents configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
