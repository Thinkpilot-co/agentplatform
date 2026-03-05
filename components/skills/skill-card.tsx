'use client'

import { motion } from 'framer-motion'
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
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-lg border border-[var(--border)] glass p-4 transition-all hover:border-[var(--border-hover)] hover:shadow-[0_0_20px_-5px_var(--primary-glow)]"
    >
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
    </motion.div>
  )
}
