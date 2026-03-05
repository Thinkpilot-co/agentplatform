'use client'

import type { SkillInfo } from '@/core/types'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

export function SkillCard({
  skill,
  onToggle,
  isToggling,
}: {
  skill: SkillInfo
  onToggle: (id: string, enabled: boolean) => void
  isToggling: boolean
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-medium">{skill.name}</span>
          {skill.version && (
            <span className="ml-2 text-[10px] text-[var(--muted-foreground)]">
              v{skill.version}
            </span>
          )}
        </div>
        <ToggleSwitch
          checked={skill.enabled}
          onChange={(enabled) => onToggle(skill.id, enabled)}
          disabled={isToggling}
        />
      </div>

      {skill.description && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {skill.description}
        </p>
      )}

      {skill.category && (
        <span className="mt-2 inline-block rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
          {skill.category}
        </span>
      )}
    </div>
  )
}
