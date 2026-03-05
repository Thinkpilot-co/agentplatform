import type { PlatformEvent, PlatformEventType } from './types'

type Listener = (event: PlatformEvent) => void

class EventBus {
  private listeners = new Map<PlatformEventType | '*', Set<Listener>>()

  on(type: PlatformEventType | '*', listener: Listener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
    return () => this.off(type, listener)
  }

  off(type: PlatformEventType | '*', listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: PlatformEventType, data?: Partial<PlatformEvent>) {
    const event: PlatformEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    }

    // Notify specific listeners
    this.listeners.get(type)?.forEach((fn) => fn(event))
    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((fn) => fn(event))
  }
}

// Singleton
export const eventBus = new EventBus()
