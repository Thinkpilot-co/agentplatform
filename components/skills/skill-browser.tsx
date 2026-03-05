'use client'

import { useState } from 'react'
import { SkillCard } from './skill-card'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { useRpcMutation } from '@/hooks/use-rpc'
import { Puzzle } from 'lucide-react'
import type { SkillInfo } from '@/core/types'

export function SkillBrowser({
  instanceId,
  skills,
}: {
  instanceId: string
  skills: SkillInfo[]
}) {
  const [filter, setFilter] = useState('')
  const configPatch = useRpcMutation(instanceId, 'config.patch', {
    invalidateKeys: [['rpc', instanceId, 'skills.status']],
  })

  const filtered = skills.filter(
    (s) =>
      !filter ||
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.category?.toLowerCase().includes(filter.toLowerCase()),
  )

  const categories = Array.from(
    new Set(skills.map((s) => s.category).filter(Boolean)),
  ) as string[]

  const handleToggle = (skillId: string, enabled: boolean) => {
    // Toggle skill via config.patch
    configPatch.mutate({
      skills: { [skillId]: { enabled } },
    })
  }

  if (skills.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] py-12 text-center">
        <Puzzle className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          No skills available
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Search + Filter */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search skills..."
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
        {categories.length > 0 && (
          <select
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      <AnimatedList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <AnimatedListItem key={skill.id}>
            <SkillCard
              skill={skill}
              onToggle={handleToggle}
              isToggling={configPatch.isPending}
            />
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </div>
  )
}
