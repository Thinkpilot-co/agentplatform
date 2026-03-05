import pino from 'pino'
import { trace, context } from '@opentelemetry/api'

const level = process.env.LOG_LEVEL || 'debug'
const isDev = process.env.NODE_ENV !== 'production'

const root = pino({
  level,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'HH:MM:ss.l',
          },
        },
      }
    : {}),
  // In production, output structured JSON (OTEL-friendly)
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  // Inject OTEL trace/span IDs into every log line
  mixin() {
    const span = trace.getSpan(context.active())

    if (!span) return {}

    const ctx = span.spanContext()
    return {
      traceId: ctx.traceId,
      spanId: ctx.spanId,
      traceFlags: ctx.traceFlags,
    }
  },
})

export type Logger = pino.Logger

export function createLogger(scope: string): Logger {
  return root.child({ scope })
}

export default root
