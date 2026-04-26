/**
 * Health Consent Gate Component
 * Wraps ICF health data functionality and shows consent prompt if user hasn't consented
 * Explains ICF dimensions and GDPR Art. 9 requirements for special category data
 */

import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain, Shield, Settings, ExternalLink, Loader2, AlertCircle } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/services/supabaseApi'
import { cn } from '@/lib/utils'

interface HealthConsentGateProps {
  children: ReactNode
  /** Compact mode shows a smaller prompt */
  compact?: boolean
  /** Custom class for the container */
  className?: string
}

/**
 * Wraps health data components and shows consent prompt if user hasn't given health data consent.
 * If user has consent, renders children normally.
 */
export function HealthConsentGate({
  children,
  compact = false,
  className,
}: HealthConsentGateProps) {
  const { t } = useTranslation()
  const { profile, isLoading } = useAuthStore()
  const [isGranting, setIsGranting] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)

  // Check if user has health consent
  const hasConsent = !!profile?.health_consent_at

  // Handle consent grant
  const handleGrantConsent = async () => {
    try {
      setIsGranting(true)
      setGrantError(null)

      await userApi.updateProfile({
        health_consent_at: new Date().toISOString(),
      })

      // Force refresh the auth store to get updated profile
      window.location.reload()
    } catch (error) {
      console.error('Error granting health consent:', error)
      setGrantError(t('health.consent.grantError') || 'Kunde inte spara samtycke')
    } finally {
      setIsGranting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
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
        "p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800",
        "bg-indigo-50/50 dark:bg-indigo-900/20",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-indigo-900 dark:text-indigo-100 text-sm">
              {t('health.consent.requiredTitle') || 'Samtycke krävs'}
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
              {t('health.consent.requiredDesc') || 'Du måste ge samtycke för att kunna använda denna funktion'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleGrantConsent}
                disabled={isGranting}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  "bg-indigo-600 text-white hover:bg-indigo-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-1.5"
                )}
              >
                {isGranting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                {t('health.consent.grantNow') || 'Ge samtycke'}
              </button>
              <Link
                to="/settings"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                {t('health.consent.manageInSettings') || 'Hantera'}
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
      "p-6 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800",
      "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20",
      className
    )}>
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
          {t('health.consent.fullTitle') || 'Samtycke för hälsodata'}
        </h3>

        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
          {t('health.consent.fullDesc') || 'För att kunna ge dig personliga jobbrekomendera tioner behöver vi ditt samtycke att samla in och analysera data om dina funktionsförutsättningar.'}
        </p>

        <div className="p-4 bg-white/60 dark:bg-stone-800/60 rounded-xl text-left mb-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              {t('health.consent.whatWeCollect') || 'Vilken data samlar vi in?'}
            </h4>
            <ul className="space-y-1.5 text-xs text-indigo-700 dark:text-indigo-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{t('health.consent.dimension.cognitive') || 'Kognitiv funktion (tänkande, planering, minne)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{t('health.consent.dimension.communication') || 'Kommunikation (tal, lyssnande, samarbete)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{t('health.consent.dimension.concentration') || 'Koncentration (fokusering, uppmärksamhet)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{t('health.consent.dimension.motor') || 'Motorik (rörelse, stadiga händer, fysik)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{t('health.consent.dimension.sensory') || 'Sensorisk (ljud, ljus, sinnesintryck)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <span>{t('health.consent.dimension.energy') || 'Energi (uthållighet, ork, återhämtning)'}</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-current/10">
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              {t('health.consent.whyWeCollect') || 'Varför samlar vi in denna data?'}
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              {t('health.consent.whyDesc') || 'För att kunna ge dig personliga jobbrekomendera tioner som är anpassade till dina behov och förutsättningar.'}
            </p>
          </div>

          <div className="pt-3 border-t border-current/10">
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              {t('health.consent.whoHasAccess') || 'Vem har åtkomst?'}
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              {t('health.consent.whoAccessDesc') || 'Du och din tilldelad konsulent (endast om du aktiverar delning) kan se denna data.'}
            </p>
          </div>
        </div>

        {/* GDPR Art. 9 Warning */}
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('health.consent.gdprWarning') || 'Denna data klassificeras som "känsliga personuppgifter" enligt GDPR artikel 9.'}
          </p>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg text-left">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>{t('health.consent.canWithdraw') || 'Du kan när som helst:'}</strong>
            <ul className="mt-2 space-y-1">
              <li>• {t('health.consent.withdrawDetail1') || 'Dra tillbaka ditt samtycke i Inställningar'}</li>
              <li>• {t('health.consent.withdrawDetail2') || 'Få all din hälsodata raderad'}</li>
              <li>• {t('health.consent.withdrawDetail3') || 'Kontakta oss för mer information'}</li>
            </ul>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleGrantConsent}
            disabled={isGranting}
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 font-medium rounded-xl transition-colors",
              "bg-indigo-600 text-white hover:bg-indigo-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGranting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {t('health.consent.grantConsent') || 'Jag samtycker'}
          </button>

          <Link
            to="/settings"
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 font-medium rounded-xl transition-colors",
              "border border-indigo-300 dark:border-indigo-700",
              "text-indigo-700 dark:text-indigo-300",
              "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
              "flex items-center justify-center gap-2"
            )}
          >
            <Settings className="w-4 h-4" />
            {t('health.consent.goToSettings') || 'Gå till Inställningar'}
          </Link>
        </div>

        {grantError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-3">{grantError}</p>
        )}

        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-4">
          {t('health.consent.privacyLink') || 'Läs mer i vår'} {' '}
          <Link to="/privacy" className="underline hover:text-indigo-700 dark:hover:text-indigo-300">
            {t('health.consent.privacyPolicy') || 'integritetspolicy'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default HealthConsentGate
