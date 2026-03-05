/** Shared SSE stream helper — handles encoding, keepalive, and cleanup */

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const

interface SseStreamOptions {
  /** Called when stream starts. Return a cleanup function. */
  onStart: (send: SseSend) => () => void
  /** Keepalive interval in ms (default 15000) */
  keepaliveMs?: number
}

interface SseSend {
  event: (name: string, data: unknown) => void
  comment: (text: string) => void
}

export function createSseResponse(opts: SseStreamOptions): Response {
  const encoder = new TextEncoder()
  let closed = false
  let cleanup: (() => void) | null = null
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send: SseSend = {
        event(name, data) {
          if (closed) return
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            )
          } catch {
            teardown()
          }
        },
        comment(text) {
          if (closed) return
          try {
            controller.enqueue(encoder.encode(`: ${text}\n\n`))
          } catch {
            teardown()
          }
        },
      }

      function teardown() {
        if (closed) return
        closed = true
        if (keepaliveTimer) clearInterval(keepaliveTimer)
        cleanup?.()
      }

      // Initial comment
      send.comment('connected')

      // Register listener
      cleanup = opts.onStart(send)

      // Keepalive
      keepaliveTimer = setInterval(() => {
        send.comment('keepalive')
      }, opts.keepaliveMs ?? 15_000)
    },
    cancel() {
      closed = true
      if (keepaliveTimer) clearInterval(keepaliveTimer)
      cleanup?.()
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
