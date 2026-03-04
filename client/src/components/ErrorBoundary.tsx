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

/**
 * Global Error Boundary
 * Fångar JavaScript-fel i child-komponenter och visar ett vänligt felmeddelande
 * istället för att krascha hela applikationen
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary fångade fel:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Logga till analytics eller felrapportering
    if (import.meta.env.PROD) {
      // TODO: Skicka till felrapporteringstjänst (Sentry, etc.)
      console.error('[Production Error]', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
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
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Illustration */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-600" />
            </div>

            {/* Titel */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Oj då, något gick fel
            </h1>
            
            {/* Beskrivning */}
            <p className="text-slate-600 mb-6">
              Ett oväntat fel uppstod. Oroa dig inte - vi har sparat dina data och 
              du kan fortsätta där du slutade.
            </p>

            {/* Felmeddelande (endast i utveckling) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <p className="text-red-800 font-medium text-sm mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-red-700 text-xs overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Knappar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <RefreshCw size={20} />
                Ladda om sidan
              </button>

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
  sectionName = 'innehåll' 
}: { 
  children: ReactNode
  sectionName?: string 
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
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={16} />
            Ladda om
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
