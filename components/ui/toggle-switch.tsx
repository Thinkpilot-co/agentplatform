'use client'

import { motion } from 'framer-motion'

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-emerald-500 shadow-[0_0_12px_var(--success-glow)]' : 'bg-zinc-600'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <motion.span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
        animate={{ x: checked ? 16 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}
