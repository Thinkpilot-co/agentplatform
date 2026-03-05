'use client'

import { motion } from 'framer-motion'

export function Header({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm px-6 py-4"
    >
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-0.5 text-sm tracking-wide text-[var(--muted-foreground)]">
          {description}
        </p>
      )}
    </motion.div>
  )
}
