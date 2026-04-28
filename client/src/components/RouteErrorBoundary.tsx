/**
 * Route Error Boundary
 *
 * Enhanced error boundary specifically for lazy-loaded routes.
 * Handles chunk loading failures with automatic retry and user-friendly messaging.
 */

import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home, WifiOff, Loader2 } from '@/components/ui/icons'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorType: 'chunk' | 'network' | 'general' | null
  retryCount: number
}

// Max retries for chunk loading
const MAX_RETRIES = 2

/**
 * Detects if error is a chunk loading failure
 */
function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Loading chunk') ||
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('error loading dynamically imported module')
  )
}

/**
 * Detects if error is a network failure
 */
function isNetworkError(error: Error): boolean {
  return (
    error.name === 'NetworkError' ||
    error.message.includes('NetworkError') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed')
  )
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorType: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    let errorType: State['errorType'] = 'general'

    if (isChunkLoadError(error)) {
      errorType = 'chunk'
    } else if (isNetworkError(error)) {
      errorType = 'network'
    }

    return {
      hasError: true,
      error,
      errorType,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RouteErrorBoundary] Error caught:', {
      error: error.message,
      type: this.state.errorType,
      componentStack: errorInfo.componentStack,
    })

    // Report to error tracking in production
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      // @ts-ignore - Sentry may be available globally
      window.Sentry?.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          errorType: this.state.errorType,
        },
      })
    }
  }

  handleRetry = () => {
    const { retryCount, errorType } = this.state

    if (errorType === 'chunk' && retryCount < MAX_RETRIES) {
      // For chunk errors, try clearing cache and reloading the module
      this.setState({
        hasError: false,
        error: null,
        errorType: null,
        retryCount: retryCount + 1,
      })
    } else {
      // Full page reload as last resort
      window.location.reload()
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: null,
      retryCount: 0,
    })
  }

  render() {
    if (this.state.hasError) {
      const { errorType, retryCount } = this.state

      return (
        <div
          className="min-h-[60vh] flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
          data-testid="route-error-fallback"
        >
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 text-center border border-stone-200 dark:border-stone-700">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              errorType === 'network'
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {errorType === 'network' ? (
                <WifiOff className="w-8 h-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {errorType === 'chunk' && 'Kunde inte ladda sidan'}
              {errorType === 'network' && 'Nätverksproblem'}
              {errorType === 'general' && 'Något gick fel'}
            </h2>

            {/* Message */}
            <p className="text-stone-600 dark:text-stone-300 mb-6">
              {errorType === 'chunk' && (
                <>
                  Sidan kunde inte laddas. Detta kan bero på en uppdatering.
                  {retryCount < MAX_RETRIES && ' Klicka på knappen nedan för att försöka igen.'}
                </>
              )}
              {errorType === 'network' && (
                'Det verkar som att du har problem med nätverksanslutningen. Kontrollera din internetanslutning och försök igen.'
              )}
              {errorType === 'general' && (
                'Ett oväntat fel inträffade. Du kan försöka ladda om sidan eller gå tillbaka till startsidan.'
              )}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] hover:bg-[var(--c-text)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)] text-white rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                {retryCount < MAX_RETRIES && errorType === 'chunk'
                  ? 'Försök igen'
                  : 'Ladda om sidan'
                }
              </button>

              <Link
                to="/"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Till startsidan
              </Link>
            </div>

            {/* Retry count info */}
            {retryCount > 0 && retryCount < MAX_RETRIES && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-4">
                Försök {retryCount} av {MAX_RETRIES}
              </p>
            )}

            {/* Support link */}
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-4">
              Om problemet kvarstår,{' '}
              <Link to="/help" className="text-[var(--c-text)] dark:text-[var(--c-solid)] hover:underline">
                kontakta support
              </Link>
              .
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Loading fallback for lazy routes
 */
export function RouteLoadingFallback() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <Loader2
          className="animate-spin text-[var(--c-solid)] dark:text-[var(--c-solid)] mx-auto mb-3"
          size={32}
          aria-hidden="true"
        />
        <p className="text-sm text-stone-600 dark:text-stone-300">Laddar sida...</p>
      </div>
    </div>
  )
}

/**
 * Wrapper component that combines Suspense with RouteErrorBoundary
 * Use this for lazy-loaded routes
 */
export function LazyRouteWrapper({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  )
}

/**
 * Hook to get the current error state (for parent components)
 */
export function useRouteError() {
  const location = useLocation()
  return {
    path: location.pathname,
    // Could be extended to track errors per route
  }
}

export default RouteErrorBoundary
