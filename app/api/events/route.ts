import { initPlatform } from '@/core/init'
import { eventBus } from '@/core/event-bus'
import { createSseResponse } from '@/lib/sse'

initPlatform()

export async function GET() {
  return createSseResponse({
    onStart(send) {
      return eventBus.on('*', (event) => {
        send.event(event.type, event)
      })
    },
  })
}
