'use client'

import { useState, useCallback } from 'react'
import { useRpc, useRpcMutation } from '@/hooks/use-rpc'
import { Loader2, Save, Code, FormInput, Eye, EyeOff } from 'lucide-react'
import type { ConfigSchemaResponse, ConfigUiHint } from '@/core/types'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

export function SchemaForm({ instanceId }: { instanceId: string }) {
  const [mode, setMode] = useState<'form' | 'json'>('form')

  const { data: schemaData, isLoading: schemaLoading } =
    useRpc<ConfigSchemaResponse>(instanceId, 'config.schema')
  const { data: configData, isLoading: configLoading } = useRpc<
    Record<string, unknown>
  >(instanceId, 'config.get')

  const configPatch = useRpcMutation(instanceId, 'config.patch', {
    invalidateKeys: [['rpc', instanceId, 'config.get']],
  })

  if (schemaLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('form')}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
            mode === 'form'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
          }`}
        >
          <FormInput className="h-3 w-3" />
          Form View
        </button>
        <button
          onClick={() => setMode('json')}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
            mode === 'json'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
          }`}
        >
          <Code className="h-3 w-3" />
          JSON Editor
        </button>
      </div>

      {mode === 'form' ? (
        <FormView
          schema={schemaData}
          config={configData ?? {}}
          onSave={(patch) => configPatch.mutate(patch)}
          isSaving={configPatch.isPending}
        />
      ) : (
        <JsonEditor
          config={configData ?? {}}
          onSave={(patch) => configPatch.mutate(patch)}
          isSaving={configPatch.isPending}
        />
      )}
    </div>
  )
}

function FormView({
  schema,
  config,
  onSave,
  isSaving,
}: {
  schema?: ConfigSchemaResponse
  config: Record<string, unknown>
  onSave: (patch: Record<string, unknown>) => void
  isSaving: boolean
}) {
  const [edits, setEdits] = useState<Record<string, unknown>>({})

  const uiHints = schema?.uiHints ?? {}

  // Group fields by their group hint
  const groups = new Map<string, string[]>()
  const allKeys = Object.keys(config)

  for (const key of allKeys) {
    const hint = uiHints[key]
    const group = hint?.group ?? 'General'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(key)
  }

  // Sort groups: General first, then alphabetical
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'General') return -1
    if (b === 'General') return 1
    return a.localeCompare(b)
  })

  const handleSave = () => {
    if (Object.keys(edits).length > 0) {
      onSave(edits)
      setEdits({})
    }
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map(([groupName, keys]) => (
        <div key={groupName}>
          <h3 className="mb-2 text-sm font-medium">{groupName}</h3>
          <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
            {keys
              .filter((key) => {
                const hint = uiHints[key]
                return !hint?.advanced
              })
              .map((key) => (
                <ConfigField
                  key={key}
                  fieldKey={key}
                  value={edits[key] ?? config[key]}
                  hint={uiHints[key]}
                  onChange={(val) => setEdits({ ...edits, [key]: val })}
                />
              ))}
          </div>
        </div>
      ))}

      {Object.keys(edits).length > 0 && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving
            ? 'Saving...'
            : `Save ${Object.keys(edits).length} change(s)`}
        </button>
      )}
    </div>
  )
}

function ConfigField({
  fieldKey,
  value,
  hint,
  onChange,
}: {
  fieldKey: string
  value: unknown
  hint?: ConfigUiHint
  onChange: (value: unknown) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const isSensitive = hint?.sensitive

  const label = hint?.label ?? fieldKey
  const help = hint?.help

  // Determine field type
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm">{label}</label>
          {help && (
            <p className="text-xs text-[var(--muted-foreground)]">{help}</p>
          )}
        </div>
        <ToggleSwitch checked={value} onChange={onChange} />
      </div>
    )
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div>
        <label className="mb-1 block text-sm">{label}</label>
        {help && (
          <p className="mb-1 text-xs text-[var(--muted-foreground)]">{help}</p>
        )}
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              // Ignore invalid JSON while typing
            }
          }}
          rows={4}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 font-mono text-xs outline-none focus:border-[var(--primary)]"
        />
      </div>
    )
  }

  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      {help && (
        <p className="mb-1 text-xs text-[var(--muted-foreground)]">{help}</p>
      )}
      <div className="relative">
        <input
          type={isSensitive && !revealed ? 'password' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => {
            const v = e.target.value
            // Try to preserve number type
            if (typeof value === 'number') {
              const n = Number(v)
              if (!isNaN(n)) {
                onChange(n)
                return
              }
            }
            onChange(v)
          }}
          placeholder={hint?.placeholder}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
        />
        {isSensitive && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="absolute right-2 top-2 text-[var(--muted-foreground)]"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function JsonEditor({
  config,
  onSave,
  isSaving,
}: {
  config: Record<string, unknown>
  onSave: (patch: Record<string, unknown>) => void
  isSaving: boolean
}) {
  const [json, setJson] = useState(JSON.stringify(config, null, 2))
  const [error, setError] = useState<string | null>(null)

  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(json)
      setError(null)
      onSave(parsed)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [json, onSave])

  return (
    <div className="space-y-3">
      <textarea
        value={json}
        onChange={(e) => {
          setJson(e.target.value)
          setError(null)
        }}
        rows={30}
        className="w-full resize-none rounded-lg border border-[var(--border)] bg-black p-4 font-mono text-xs text-zinc-300 outline-none focus:border-[var(--primary)]"
        spellCheck={false}
      />

      {error && <p className="text-xs text-red-400">Invalid JSON: {error}</p>}

      <button
        onClick={handleSave}
        disabled={isSaving || !!error}
        className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" />
        {isSaving ? 'Saving...' : 'Apply Config'}
      </button>
    </div>
  )
}
