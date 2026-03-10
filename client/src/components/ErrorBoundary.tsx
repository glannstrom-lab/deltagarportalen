import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isChunkError: boolean
}

// ChunkLoadError detection - happens when lazy-loaded modules fail to load
// This typically happens after a new deployment when old chunks are removed
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false
  const message = error.message?.toLowerCase() || ''
  return (
    message.includes('chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically') ||
    error.name === 'ChunkLoadError'
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, isChunkError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError = isChunkLoadError(error)
    
    // Auto-reload on chunk errors after a short delay to allow logging
    if (isChunkError) {
      console.warn('[ErrorBoundary] ChunkLoadError detected, scheduling reload...')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
    
    return { hasError: true, error, errorInfo: null, isChunkError }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    
    // Log chunk errors specially
    if (isChunkLoadError(error)) {
      console.warn('[ErrorBoundary] This is a chunk load error - likely due to new deployment')
    }
    
    // Skicka till vår error-logging endpoint
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          isChunkError: isChunkLoadError(error),
        }),
      }).catch(() => {
        // Ignorera om error-logging failar
      })
    } catch {
      // Ignorera
    }

    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHardReload = () => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback for chunk errors
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Uppdatering tillgänglig
              </h2>
              <p className="text-slate-600 mb-6">
                Appen har uppdaterats sedan du senast besökte sidan. 
                Vi laddar om sidan automatiskt...
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Ladda om nu
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Om sidan inte laddas om automatiskt, klicka på knappen ovan.
              </p>
            </div>
          </div>
        )
      }

      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Något gick fel
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Ett oväntat fel uppstod. Försök ladda om sidan eller kontakta support om problemet kvarstår.
              </p>
              <details className="text-xs text-slate-500 mb-4">
                <summary className="cursor-pointer hover:text-slate-700">Visa teknisk information</summary>
                <pre className="mt-2 p-3 bg-slate-100 rounded-lg overflow-auto max-h-40 text-left">
                  {this.state.error?.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Ladda om sidan
                </button>
                <button
                  onClick={this.handleHardReload}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Rensa cache
                </button>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
