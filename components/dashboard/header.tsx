'use client'

export function Header({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {description && (
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          {description}
        </p>
      )}
    </div>
  )
}
