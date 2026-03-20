/**
 * Logger utility for the application
 * Only logs in development mode to keep production clean
 */

const isDev = import.meta.env.DEV

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  prefix?: string
  enabled?: boolean
}

function createLogger(options: LoggerOptions = {}) {
  const { prefix = '', enabled = isDev } = options

  const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString().slice(11, 23)
    const prefixStr = prefix ? `[${prefix}]` : ''
    return `${timestamp} ${prefixStr} ${message}`
  }

  return {
    debug: (...args: unknown[]) => {
      if (enabled) {
        console.debug(formatMessage('debug', ''), ...args)
      }
    },

    info: (...args: unknown[]) => {
      if (enabled) {
        console.info(formatMessage('info', ''), ...args)
      }
    },

    warn: (...args: unknown[]) => {
      // Warnings are always shown
      console.warn(formatMessage('warn', ''), ...args)
    },

    error: (...args: unknown[]) => {
      // Errors are always shown
      console.error(formatMessage('error', ''), ...args)
    },

    // For backwards compatibility - acts like debug in dev, silent in prod
    log: (...args: unknown[]) => {
      if (enabled) {
        console.log(...args)
      }
    },
  }
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
