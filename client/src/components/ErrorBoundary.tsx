import { Component, ErrorInfo, ReactNode, useState, useCallback } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  errorId: string | null
}

/**
 * Global Error Boundary
 * Fångar JavaScript-fel i child-komponenter och visar ett vänligt felmeddelande
 * istället för att krascha hela applikationen
 */
export class ErrorBoundary extends Component<Props, State> {
  private errorCount: number = 0
  private readonly MAX_RETRIES = 3

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorCount++
    const errorId = this.generateErrorId()
    
    this.setState({ 
      errorInfo,
      errorId,
    })
    
    // Logga till analytics eller felrapportering
    this.logError(error, errorInfo, errorId)
    
    // Callback till parent om det finns
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // Återställ om resetKeys ändras
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )
      
      if (hasResetKeyChanged) {
        this.handleReset()
      }
    }
  }

  private generateErrorId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private logError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    const errorData = {
      errorId,
      error: error.toString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      retryCount: this.errorCount,
    }

    console.error('[ErrorBoundary]', errorData)
    
    // I produktion, skicka till felrapporteringstjänst
    if (import.meta.env.PROD) {
      // TODO: Integrera med Sentry, LogRocket, eller liknande
      // sentry.captureException(error, { extra: errorData })
      
      // Fallback: Skicka till egen endpoint
      this.sendErrorToServer(errorData).catch(console.error)
    }
  }

  private async sendErrorToServer(errorData: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      })
    } catch {
      // Ignorera fel vid rapportering
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
    })
  }

  handleRetry = () => {
    if (this.errorCount < this.MAX_RETRIES) {
      this.handleReset()
    } else {
      // För många retries, ladda om sidan
      this.handleReload()
    }
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      // Anpassad fallback om den finns
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Standard fallback UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Illustration */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-600" />
            </div>

            {/* Titel */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Oj då, något gick fel
            </h1>
            
            {/* Beskrivning */}
            <p className="text-slate-600 mb-2">
              Ett oväntat fel uppstod. Oroa dig inte - vi har sparat dina data.
            </p>

            {/* Error ID för support */}
            {this.state.errorId && (
              <p className="text-xs text-slate-400 mb-6">
                Fel-ID: <code className="bg-slate-100 px-1 py-0.5 rounded">{this.state.errorId}</code>
              </p>
            )}

            {/* Retry-warning */}
            {this.errorCount >= this.MAX_RETRIES && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  Problemet verkar bestå. Vi rekommenderar att ladda om sidan.
                </p>
              </div>
            )}

            {/* Felmeddelande (endast i utveckling) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 text-left">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-2"
                >
                  <Bug size={16} />
                  {this.state.showDetails ? 'Dölj detaljer' : 'Visa feldetaljer'}
                  {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {this.state.showDetails && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium text-sm mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-red-700 text-xs overflow-auto max-h-48 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                    {this.state.error.stack && (
                      <pre className="text-red-600 text-xs overflow-auto max-h-48 mt-2 pt-2 border-t border-red-200">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Knappar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.errorCount < this.MAX_RETRIES ? (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                  <RefreshCw size={20} />
                  Försök igen
                </button>
              ) : (
                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                  <RefreshCw size={20} />
                  Ladda om sidan
                </button>
              )}

              <Link
                to="/"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                <Home size={20} />
                Gå till startsidan
              </Link>
            </div>

            {/* Hjälplänkar */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-3">
                Behöver du hjälp?
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <Link 
                  to="/diary" 
                  className="text-teal-600 hover:underline"
                  onClick={this.handleReset}
                >
                  Kontakta arbetskonsulent
                </Link>
                <span className="text-slate-300">|</span>
                <a 
                  href="mailto:support@deltagarportalen.se" 
                  className="text-teal-600 hover:underline"
                >
                  Mejla support
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Default export för bakåtkompatibilitet
export default ErrorBoundary

/**
 * Sektionsspecifik Error Boundary
 * Används för att isolera fel till specifika delar av appen
 */
export function SectionErrorBoundary({ 
  children, 
  sectionName = 'innehåll',
  onReset,
}: { 
  children: ReactNode
  sectionName?: string
  onReset?: () => void
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} className="text-red-600" />
            <h3 className="font-semibold text-red-800">
              Kunde inte ladda {sectionName}
            </h3>
          </div>
          <p className="text-red-700 text-sm mb-4">
            Något gick fel när {sectionName} skulle visas. 
            Du kan försöka ladda om sidan.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <RefreshCw size={16} />
              Ladda om
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Försök igen
              </button>
            )}
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Async Error Boundary
 * Fångar fel i async/await-kod
 */
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err)
    } else {
      setError(new Error(String(err)))
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}


