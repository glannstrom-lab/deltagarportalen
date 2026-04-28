/**
 * Logger utility for the application
 * - Development: Logs to console with timestamps and prefixes
 * - Production: Only errors/warnings, structured for external services
 *
 * USAGE:
 *   import { logger, apiLogger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   apiLogger.error('API call failed', { endpoint: '/users', status: 500 })
 */

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface ErrorContext extends LogContext {
  error?: Error | unknown
  stack?: string
}

interface LoggerOptions {
  prefix?: string
  enabled?: boolean
}

// Typ för strukturerad error-data (för framtida Sentry-integration)
interface StructuredError {
  message: string
  level: LogLevel
  prefix?: string
  context?: LogContext
  timestamp: string
  url?: string
  userAgent?: string
}

// Kö för errors som ska skickas till extern tjänst (Sentry, LogRocket, etc.)
const errorQueue: StructuredError[] = []
const MAX_ERROR_QUEUE = 50

/**
 * Skicka error till Sentry (om initierat).
 * Sentry initieras endast i prod efter cookie-consent — captureError
 * returnerar tidigt om så inte är fallet, så detta är säkert att
 * anropa alltid.
 *
 * Lokal kö behålls som debug-hjälp och fallback om Sentry är avstängt.
 * Lazy-import undviker att Sentry-modulen drar in sig själv vid SSR/test.
 */
function reportToService(error: StructuredError): void {
  // Lägg till i lokal kö (debug + fallback)
  errorQueue.push(error)
  if (errorQueue.length > MAX_ERROR_QUEUE) {
    errorQueue.shift()
  }

  // Skicka warn/error till Sentry. Info/debug är för chatty för extern service.
  if (error.level !== 'warn' && error.level !== 'error') return
  if (typeof window === 'undefined') return  // SSR/test guard

  // Dynamisk import — sentry.ts kan i sin tur ha sido-effekter vid load
  import('./sentry')
    .then(({ captureError }) => {
      const tagged = error.prefix ? `[${error.prefix}] ${error.message}` : error.message
      captureError(tagged, {
        level: error.level,
        prefix: error.prefix,
        ...error.context,
      })
    })
    .catch(() => {
      // Sentry-modulen kunde inte laddas — vi har redan loggat lokalt
    })
}

/**
 * Extrahera stack trace från Error-objekt
 */
function extractErrorInfo(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack }
  }
  if (typeof err === 'string') {
    return { message: err }
  }
  return { message: String(err) }
}

function createLogger(options: LoggerOptions = {}) {
  const { prefix = '', enabled = isDev } = options

  const formatMessage = (level: LogLevel): string => {
    const timestamp = new Date().toISOString().slice(11, 23)
    const prefixStr = prefix ? `[${prefix}]` : ''
    const levelStr = `[${level.toUpperCase()}]`
    return `${timestamp} ${levelStr}${prefixStr}`
  }

  const createStructuredError = (
    level: LogLevel,
    message: string,
    context?: LogContext
  ): StructuredError => ({
    message,
    level,
    prefix: prefix || undefined,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  })

  return {
    /**
     * Debug - endast i utveckling, för detaljerad felsökning
     */
    debug: (message: string, context?: LogContext) => {
      if (enabled) {
        console.debug(formatMessage('debug'), message, context || '')
      }
    },

    /**
     * Info - endast i utveckling, för generell information
     */
    info: (message: string, context?: LogContext) => {
      if (enabled) {
        console.info(formatMessage('info'), message, context || '')
      }
    },

    /**
     * Warn - visas alltid, för potentiella problem
     */
    warn: (message: string, context?: LogContext) => {
      console.warn(formatMessage('warn'), message, context || '')
      if (isProd) {
        reportToService(createStructuredError('warn', message, context))
      }
    },

    /**
     * Error - visas alltid, för faktiska fel
     * Accepterar Error-objekt eller context med error-property
     */
    error: (message: string, context?: ErrorContext) => {
      // Extrahera error-info om det finns
      const errorInfo = context?.error ? extractErrorInfo(context.error) : null
      const fullContext = errorInfo
        ? { ...context, errorMessage: errorInfo.message, stack: errorInfo.stack }
        : context

      console.error(formatMessage('error'), message, fullContext || '')

      // Rapportera alltid errors i produktion
      if (isProd) {
        reportToService(createStructuredError('error', message, fullContext))
      }
    },

    /**
     * Group - gruppera relaterade loggar (endast utveckling)
     */
    group: (label: string, fn: () => void) => {
      if (enabled) {
        console.group(`${prefix ? `[${prefix}] ` : ''}${label}`)
        try {
          fn()
        } finally {
          console.groupEnd()
        }
      } else {
        fn()
      }
    },

    /**
     * Time - mät exekveringstid (endast utveckling)
     */
    time: (label: string) => {
      if (enabled) {
        console.time(`${prefix ? `[${prefix}] ` : ''}${label}`)
      }
    },

    timeEnd: (label: string) => {
      if (enabled) {
        console.timeEnd(`${prefix ? `[${prefix}] ` : ''}${label}`)
      }
    },

    /**
     * Log - för bakåtkompatibilitet, använd debug/info istället
     * @deprecated Använd debug() eller info() istället
     */
    log: (...args: unknown[]) => {
      if (enabled) {
        console.log(...args)
      }
    },
  }
}

/**
 * Hämta alla köade errors (för debugging/testing)
 */
export function getErrorQueue(): readonly StructuredError[] {
  return [...errorQueue]
}

/**
 * Rensa error-kön (för testing)
 */
export function clearErrorQueue(): void {
  errorQueue.length = 0
}

// Default logger instance
export const logger = createLogger()

// Named loggers for specific modules
export const apiLogger = createLogger({ prefix: 'API' })
export const authLogger = createLogger({ prefix: 'Auth' })
export const cvLogger = createLogger({ prefix: 'CV' })
export const jobLogger = createLogger({ prefix: 'Jobs' })
export const aiLogger = createLogger({ prefix: 'AI' })
export const swLogger = createLogger({ prefix: 'SW' })
export const storageLogger = createLogger({ prefix: 'Storage' })

// Export the factory for custom loggers
export { createLogger }
