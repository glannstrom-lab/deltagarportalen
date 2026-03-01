import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Log to error tracking service
    // TODO: Send to Sentry/LogRocket in production
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Oj, något gick fel!
            </h1>
            
            <p className="text-slate-600 mb-6">
              Vi är ledsna, men något gick fel när sidan skulle visas. 
              Prova att ladda om sidan eller gå tillbaka till startsidan.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left overflow-auto">
                <p className="text-red-600 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Ladda om sidan
              </button>
              
              <Link
                to="/"
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Till startsidan
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
import { useState, useCallback } from 'react'

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((error: Error) => {
    console.error('Caught error:', error)
    setError(error)
    // TODO: Send to error tracking service
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
