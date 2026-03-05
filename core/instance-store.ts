import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import type { InstanceConfig } from './types'

const CONFIG_PATH = path.resolve(process.cwd(), 'instances.json')

interface InstancesFile {
  instances: InstanceConfig[]
}

function read(): InstancesFile {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as InstancesFile
  } catch {
    return { instances: [] }
  }
}

let writePromise = Promise.resolve()

function write(data: InstancesFile) {
  writePromise = writePromise.then(() => {
    writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  })
}

export function listInstances(): InstanceConfig[] {
  return read().instances
}

export function getInstance(id: string): InstanceConfig | undefined {
  return read().instances.find((i) => i.id === id)
}

export function addInstance(config: InstanceConfig): void {
  const data = read()
  const existing = data.instances.findIndex((i) => i.id === config.id)
  if (existing >= 0) {
    data.instances[existing] = config
  } else {
    data.instances.push(config)
  }
  write(data)
}

export function removeInstance(id: string): boolean {
  const data = read()
  const before = data.instances.length
  data.instances = data.instances.filter((i) => i.id !== id)
  if (data.instances.length < before) {
    write(data)
    return true
  }
  return false
}

export function updateInstance(
  id: string,
  updates: Partial<InstanceConfig>,
): InstanceConfig | null {
  const data = read()
  const idx = data.instances.findIndex((i) => i.id === id)
  if (idx < 0) return null
  data.instances[idx] = { ...data.instances[idx], ...updates, id }
  write(data)
  return data.instances[idx]
}
