'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Server, Container, Hammer, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instances', label: 'Instances', icon: Server },
  { href: '/docker', label: 'Docker', icon: Container },
  { href: '/rebuild', label: 'Rebuild', icon: Hammer },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r glass">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-[var(--glass-border)] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-xs font-bold text-white shadow-[0_0_12px_var(--primary-glow)]">
          OC
        </div>
        <span className="text-sm font-semibold tracking-tight">AgentPlatform</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3">
        {nav.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-[var(--accent)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className="relative h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Quick Add */}
      <div className="border-t border-[var(--glass-border)] p-3">
        <Link
          href="/instances/add"
          className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--primary-hover)] active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Add Instance
        </Link>
      </div>
    </aside>
  )
}
