#!/usr/bin/env npx tsx
/**
 * sync-openclaw.ts
 *
 * Reads the OpenClaw source tree and regenerates:
 *   core/generated.ts  — RPC method list, event list, protocol version
 *
 * Usage:
 *   npx tsx scripts/sync-openclaw.ts                          # auto-detect ../openclaw
 *   npx tsx scripts/sync-openclaw.ts /path/to/openclaw        # explicit path
 *   npm run sync                                              # via package.json script
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

// ── Locate OpenClaw source ──

const openclawRoot =
  process.argv[2] ||
  path.resolve(process.cwd(), '../openclaw') ||
  path.resolve(process.cwd(), '../../openclaw')

const srcRoot = path.join(openclawRoot, 'src')

if (!existsSync(srcRoot)) {
  console.error(
    `[sync] OpenClaw source not found at: ${openclawRoot}\n` +
      `       Pass the path as an argument: npx tsx scripts/sync-openclaw.ts /path/to/openclaw`,
  )
  process.exit(1)
}

console.log(`[sync] Reading OpenClaw source from: ${openclawRoot}`)

// ── Parse server-methods-list.ts ──

const methodsFile = path.join(srcRoot, 'gateway/server-methods-list.ts')
const methodsSrc = readFileSync(methodsFile, 'utf-8')

// Extract BASE_METHODS array items
const methodsMatch = methodsSrc.match(
  /const BASE_METHODS\s*=\s*\[([\s\S]*?)\];/,
)
if (!methodsMatch) {
  console.error(
    '[sync] Could not parse BASE_METHODS from server-methods-list.ts',
  )
  process.exit(1)
}

const methods = Array.from(methodsMatch[1].matchAll(/"([^"]+)"/g), (m) => m[1])

// Extract GATEWAY_EVENTS array items (string literals only, skip imported consts)
const eventsBlockMatch = methodsSrc.match(
  /export const GATEWAY_EVENTS\s*=\s*\[([\s\S]*?)\];/,
)
let eventNames: string[] = []
if (eventsBlockMatch) {
  eventNames = Array.from(
    eventsBlockMatch[1].matchAll(/"([^"]+)"/g),
    (m) => m[1],
  )
}

// ── Parse events.ts for additional event constants ──

const eventsFile = path.join(srcRoot, 'gateway/events.ts')
if (existsSync(eventsFile)) {
  const eventsSrc = readFileSync(eventsFile, 'utf-8')

  // Extract all `export const GATEWAY_EVENT_* = "..." as const;`
  const constMatches = eventsSrc.matchAll(
    /export const GATEWAY_EVENT_\w+\s*=\s*"([^"]+)"/g,
  )
  for (const match of constMatches) {
    if (!eventNames.includes(match[1])) {
      eventNames.push(match[1])
    }
  }
}

// ── Parse protocol version ──

const protocolFile = path.join(
  srcRoot,
  'gateway/protocol/schema/protocol-schemas.ts',
)
let protocolVersion = 3 // default
if (existsSync(protocolFile)) {
  const protocolSrc = readFileSync(protocolFile, 'utf-8')
  const versionMatch = protocolSrc.match(
    /export const PROTOCOL_VERSION\s*=\s*(\d+)/,
  )
  if (versionMatch) {
    protocolVersion = parseInt(versionMatch[1])
  }
}

// ── Parse package.json for version ──

const pkgFile = path.join(openclawRoot, 'package.json')
let openclawVersion = 'unknown'
if (existsSync(pkgFile)) {
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'))
  openclawVersion = pkg.version ?? 'unknown'
}

// ── Read the client.ts to extract close code hints ──

const clientFile = path.join(srcRoot, 'gateway/client.ts')
let closeCodeHints: Record<number, string> = {}
if (existsSync(clientFile)) {
  const clientSrc = readFileSync(clientFile, 'utf-8')
  const hintsMatch = clientSrc.match(
    /GATEWAY_CLOSE_CODE_HINTS[^{]*(\{[\s\S]*?\})\s*(?:as|satisfies)/,
  )
  if (hintsMatch) {
    // Parse key-value pairs from the object literal
    const pairs = hintsMatch[1].matchAll(/(\d+)\s*:\s*"([^"]+)"/g)
    for (const p of pairs) {
      closeCodeHints[parseInt(p[1])] = p[2]
    }
  }
}

// ── Generate output ──

const timestamp = new Date().toISOString()

const output = `// AUTO-GENERATED — do not edit manually
// Synced from OpenClaw v${openclawVersion} on ${timestamp}
// Run: npm run sync
//
// Source: ${openclawRoot}

/** OpenClaw gateway protocol version */
export const PROTOCOL_VERSION = ${protocolVersion} as const;

/** OpenClaw version this was synced from */
export const SYNCED_FROM_VERSION = "${openclawVersion}" as const;

/** All base RPC methods exposed by the OpenClaw gateway */
export const RPC_METHODS = [
${methods.map((m) => `  "${m}",`).join('\n')}
] as const;

export type RpcMethod = (typeof RPC_METHODS)[number];

/** All gateway event types */
export const GATEWAY_EVENTS = [
${eventNames.map((e) => `  "${e}",`).join('\n')}
] as const;

export type GatewayEventName = (typeof GATEWAY_EVENTS)[number];

/** WebSocket close code hints */
export const CLOSE_CODE_HINTS: Record<number, string> = {
${Object.entries(closeCodeHints)
  .map(([code, hint]) => `  ${code}: "${hint}",`)
  .join('\n')}
};

/** Method categories (derived from dot-prefix) */
export const METHOD_CATEGORIES = ${JSON.stringify(
  categorize(methods),
  null,
  2,
)};

/** Total method count */
export const METHOD_COUNT = ${methods.length};

/** Total event count */
export const EVENT_COUNT = ${eventNames.length};
`

function categorize(methods: string[]): Record<string, string[]> {
  const cats: Record<string, string[]> = {}
  for (const m of methods) {
    const dot = m.indexOf('.')
    const cat = dot > 0 ? m.slice(0, dot) : 'core'
    if (!cats[cat]) cats[cat] = []
    cats[cat].push(m)
  }
  // Sort categories
  return Object.fromEntries(
    Object.entries(cats).sort(([a], [b]) => a.localeCompare(b)),
  )
}

// ── Write ──

const outPath = path.resolve(process.cwd(), 'core/generated.ts')
writeFileSync(outPath, output, 'utf-8')

console.log(`[sync] Generated: core/generated.ts`)
console.log(`[sync]   Protocol version: ${protocolVersion}`)
console.log(`[sync]   OpenClaw version: ${openclawVersion}`)
console.log(`[sync]   Methods: ${methods.length}`)
console.log(`[sync]   Events: ${eventNames.length}`)
console.log(
  `[sync]   Categories: ${Object.keys(categorize(methods)).join(', ')}`,
)
console.log(`[sync] Done.`)
