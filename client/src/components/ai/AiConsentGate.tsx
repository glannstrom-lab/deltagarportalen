/**
 * AI Consent Gate Component
 * Wraps AI functionality and shows consent prompt if user hasn't consented
 */

import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain, Shield, Settings, ExternalLink, Loader2 } from 'lucide-react'
import { useAiConsent } from '@/hooks/useAiConsent'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/services/supabaseApi'
import { cn } from '@/lib/utils'

interface AiConsentGateProps {
  children: ReactNode
  /** Compact mode shows a smaller prompt */
  compact?: boolean
  /** Feature name to show in the prompt */
  featureName?: string
  /** Custom class for the container */
  className?: string
}

/**
 * Wraps AI components and shows consent prompt if user hasn't given AI consent.
 * If user has consent, renders children normally.
 */
export function AiConsentGate({
  children,
  compact = false,
  featureName,
  className,
}: AiConsentGateProps) {
  const { t } = useTranslation()
  const { hasConsent, isLoading } = useAiConsent()
  const { profile } = useAuthStore()
  const [isGranting, setIsGranting] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)

  // Handle quick consent grant
  const handleGrantConsent = async () => {
    try {
      setIsGranting(true)
      setGrantError(null)

      await userApi.updateProfile({
        ai_consent_at: new Date().toISOString(),
      })

      // Force refresh the auth store to get updated profile
      window.location.reload()
    } catch (error) {
      console.error('Error granting AI consent:', error)
      setGrantError(t('ai.consent.grantError'))
    } finally {
      setIsGranting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    )
  }

  // User has consent - render children
  if (hasConsent) {
    return <>{children}</>
  }

  // User hasn't given consent - show prompt
  if (compact) {
    return (
      <div className={cn(
        "p-4 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800",
        "bg-violet-50/50 dark:bg-violet-900/20",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex-shrink-0">
            <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-violet-900 dark:text-violet-100 text-sm">
              {t('ai.consent.requiredTitle')}
            </h4>
            <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
              {featureName
                ? t('ai.consent.requiredForFeature', { feature: featureName })
                : t('ai.consent.requiredDesc')}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleGrantConsent}
                disabled={isGranting}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  "bg-violet-600 text-white hover:bg-violet-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-1.5"
                )}
              >
                {isGranting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                {t('ai.consent.grantNow')}
              </button>
              <Link
                to="/settings"
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                {t('ai.consent.manageInSettings')}
              </Link>
            </div>
            {grantError && (
              <p className="text-xs text-red-600 mt-2">{grantError}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Full prompt
  return (
    <div className={cn(
      "p-6 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-800",
      "bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20",
      className
    )}>
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>

        <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-2">
          {t('ai.consent.fullTitle')}
        </h3>

        <p className="text-sm text-violet-700 dark:text-violet-300 mb-4">
          {featureName
            ? t('ai.consent.fullDescWithFeature', { feature: featureName })
            : t('ai.consent.fullDesc')}
        </p>

        <div className="p-4 bg-white/60 dark:bg-stone-800/60 rounded-xl text-left mb-4">
          <h4 className="text-sm font-medium text-violet-900 dark:text-violet-100 mb-2">
            {t('ai.consent.whatThisMeans')}
          </h4>
          <ul className="space-y-2 text-xs text-violet-700 dark:text-violet-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
              {t('ai.consent.point1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
              {t('ai.consent.point2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
              {t('ai.consent.point3')}
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleGrantConsent}
            disabled={isGranting}
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 font-medium rounded-xl transition-colors",
              "bg-violet-600 text-white hover:bg-violet-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGranting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {t('ai.consent.grantConsent')}
          </button>

          <Link
            to="/settings"
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 font-medium rounded-xl transition-colors",
              "border border-violet-300 dark:border-violet-700",
              "text-violet-700 dark:text-violet-300",
              "hover:bg-violet-100 dark:hover:bg-violet-900/30",
              "flex items-center justify-center gap-2"
            )}
          >
            <Settings className="w-4 h-4" />
            {t('ai.consent.goToSettings')}
          </Link>
        </div>

        {grantError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-3">{grantError}</p>
        )}

        <p className="text-xs text-violet-500 dark:text-violet-400 mt-4">
          {t('ai.consent.canWithdraw')}{' '}
          <Link to="/privacy" className="underline hover:text-violet-700 dark:hover:text-violet-300">
            {t('ai.consent.privacyPolicy')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AiConsentGate
