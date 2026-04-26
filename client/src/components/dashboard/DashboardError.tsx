/**
 * Dashboard Error Component
 * Displayed when dashboard data fails to load
 */

import { AlertTriangle, RefreshCw } from '@/components/ui/icons'

interface DashboardErrorProps {
  error?: string | null
  onRetry: () => void
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div
      className="pb-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 p-6 sm:p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>

          <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Kunde inte ladda dashboard
          </h2>

          <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">
            {error || 'Ett oväntat fel uppstod. Kontrollera din internetanslutning och försök igen.'}
          </p>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Försök igen
          </button>

          <p className="text-xs text-red-500 dark:text-red-400/70 mt-4">
            Om problemet kvarstår, kontakta support.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardError
