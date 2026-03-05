'use client'

import { useState } from 'react'
import { useCreateAgent, useUpdateAgent } from '@/hooks/use-agents'
import { ModelSelector } from './model-selector'
import { X } from 'lucide-react'
import type { AgentInfo } from '@/core/types'

export function AgentForm({
  instanceId,
  agent,
  onClose,
}: {
  instanceId: string
  agent?: AgentInfo
  onClose: () => void
}) {
  const isEditing = !!agent
  const createAgent = useCreateAgent(instanceId)
  const updateAgent = useUpdateAgent(instanceId)

  const [form, setForm] = useState({
    key: agent?.key ?? '',
    name: agent?.name ?? '',
    emoji: agent?.emoji ?? '',
    model: agent?.model ?? '',
    persona: agent?.persona ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      await updateAgent.mutateAsync({
        key: agent!.key,
        name: form.name,
        emoji: form.emoji,
        model: form.model,
        persona: form.persona,
      })
    } else {
      await createAgent.mutateAsync({
        key: form.key || form.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: form.name,
        emoji: form.emoji,
        model: form.model,
        persona: form.persona,
      })
    }

    onClose()
  }

  const isPending = createAgent.isPending || updateAgent.isPending

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {isEditing ? `Edit ${agent!.name}` : 'New Agent'}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        {!isEditing && (
          <div>
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
              Key (optional)
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="auto-generated"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Emoji
          </label>
          <input
            type="text"
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="Pick an emoji"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
            Model
          </label>
          <ModelSelector
            instanceId={instanceId}
            value={form.model}
            onChange={(model) => setForm({ ...form, model })}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
          Persona / System Prompt
        </label>
        <textarea
          value={form.persona}
          onChange={(e) => setForm({ ...form, persona: e.target.value })}
          rows={3}
          placeholder="Describe the agent's personality and behavior..."
          className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending
            ? 'Saving...'
            : isEditing
              ? 'Update Agent'
              : 'Create Agent'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-[var(--secondary)] px-4 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
