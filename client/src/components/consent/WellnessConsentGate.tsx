/**
 * Wellness Consent Gate Component
 * Wraps wellness/mood/diary data functionality and shows consent prompt if user hasn't consented
 * Explains data collection for self-reflection and personal development
 */

import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, Shield, Settings, Loader2, AlertCircle } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/services/supabaseApi'
import { cn } from '@/lib/utils'

interface WellnessConsentGateProps {
  children: ReactNode
  /** Compact mode shows a smaller prompt */
  compact?: boolean
  /** Custom class for the container */
  className?: string
}

/**
 * Wraps wellness data components and shows consent prompt if user hasn't given wellness consent.
 * If user has consent, renders children normally.
 */
export function WellnessConsentGate({
  children,
  compact = false,
  className,
}: WellnessConsentGateProps) {
  const { t } = useTranslation()
  const { profile, isLoading } = useAuthStore()
  const [isGranting, setIsGranting] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)

  // Check if user has wellness consent
  const hasConsent = !!profile?.wellness_consent_at

  // Handle consent grant
  const handleGrantConsent = async () => {
    try {
      setIsGranting(true)
      setGrantError(null)

      await userApi.updateProfile({
        wellness_consent_at: new Date().toISOString(),
      })

      // Force refresh the auth store to get updated profile
      window.location.reload()
    } catch (error) {
      console.error('Error granting wellness consent:', error)
      setGrantError(t('wellness.consent.grantError') || 'Kunde inte spara samtycke')
    } finally {
      setIsGranting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
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
        "p-4 rounded-xl border-2 border-dashed border-pink-200 dark:border-pink-800",
        "bg-pink-50/50 dark:bg-pink-900/20",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex-shrink-0">
            <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-pink-900 dark:text-pink-100 text-sm">
              {t('wellness.consent.requiredTitle') || 'Samtycke krävs'}
            </h4>
            <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
              {t('wellness.consent.requiredDesc') || 'Du måste ge samtycke för att kunna använda denna funktion'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleGrantConsent}
                disabled={isGranting}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  "bg-pink-600 text-white hover:bg-pink-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-1.5"
                )}
              >
                {isGranting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                {t('wellness.consent.grantNow') || 'Ge samtycke'}
              </button>
              <Link
                to="/settings"
                className="text-xs text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                {t('wellness.consent.manageInSettings') || 'Hantera'}
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
      "p-6 rounded-xl border-2 border-dashed border-pink-200 dark:border-pink-800",
      "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20",
      className
    )}>
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
        </div>

        <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('wellness.consent.fullTitle') || 'Samtycke för välmåndedata'}
        </h3>

        <p className="text-sm text-pink-700 dark:text-pink-300 mb-4">
          {t('wellness.consent.fullDesc') || 'För att kunna stödja ditt personliga utveckling och välmående behöver vi ditt samtycke att samla in data om ditt humör och energi.'}
        </p>

        <div className="p-4 bg-white/60 dark:bg-stone-800/60 rounded-xl text-left mb-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
              {t('wellness.consent.whatWeCollect') || 'Vilken data samlar vi in?'}
            </h4>
            <ul className="space-y-1.5 text-xs text-pink-700 dark:text-pink-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                <span>{t('wellness.consent.item.mood') || 'Dagligt humör och emotionellt tillstånd'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                <span>{t('wellness.consent.item.energy') || 'Energi- och stressnivåer'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                <span>{t('wellness.consent.item.sleep') || 'Sömnkvalitet och mönster'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                <span>{t('wellness.consent.item.diary') || 'Dagboksanteckningar och reflektioner'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                <span>{t('wellness.consent.item.gratitude') || 'Tacksamhetsanteckningar och positiva reflektioner'}</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-current/10">
            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
              {t('wellness.consent.whyWeCollect') || 'Varför samlar vi in denna data?'}
            </h4>
            <p className="text-xs text-pink-700 dark:text-pink-300">
              {t('wellness.consent.whyDesc') || 'För att stödja din personliga utveckling, självkänsla och för att ge dig insikter om ditt välmående över tid.'}
            </p>
          </div>

          <div className="pt-3 border-t border-current/10">
            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
              {t('wellness.consent.whoHasAccess') || 'Vem har åtkomst?'}
            </h4>
            <p className="text-xs text-pink-700 dark:text-pink-300">
              {t('wellness.consent.whoAccessDesc') || 'Du är den enda som kan se denna data, om du inte aktiverar delning med din tilldelad konsulent.'}
            </p>
          </div>
        </div>

        {/* Privacy & Data Protection Notice */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {t('wellness.consent.dataProtection') || 'Din väl mål data är helt privat och behandlas enligt GDPR.'}
          </p>
        </div>

        <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/50 rounded-lg text-left">
          <p className="text-xs text-brand-900 dark:text-brand-300">
            <strong>{t('wellness.consent.canWithdraw') || 'Du kan när som helst:'}</strong>
            <ul className="mt-2 space-y-1">
              <li>• {t('wellness.consent.withdrawDetail1') || 'Dra tillbaka ditt samtycke i Inställningar'}</li>
              <li>• {t('wellness.consent.withdrawDetail2') || 'Få all din välmål data raderad'}</li>
              <li>• {t('wellness.consent.withdrawDetail3') || 'Kontakta oss för mer information'}</li>
            </ul>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleGrantConsent}
            disabled={isGranting}
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 font-medium rounded-xl transition-colors",
              "bg-pink-600 text-white hover:bg-pink-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGranting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {t('wellness.consent.grantConsent') || 'Jag samtycker'}
          </button>

          <Link
            to="/settings"
            className={cn(
              "w-full sm:w-auto px-5 py-2.5 font-medium rounded-xl transition-colors",
              "border border-pink-300 dark:border-pink-700",
              "text-pink-700 dark:text-pink-300",
              "hover:bg-pink-100 dark:hover:bg-pink-900/30",
              "flex items-center justify-center gap-2"
            )}
          >
            <Settings className="w-4 h-4" />
            {t('wellness.consent.goToSettings') || 'Gå till Inställningar'}
          </Link>
        </div>

        {grantError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-3">{grantError}</p>
        )}

        <p className="text-xs text-pink-600 dark:text-pink-400 mt-4">
          {t('wellness.consent.privacyLink') || 'Läs mer i vår'} {' '}
          <Link to="/privacy" className="underline hover:text-pink-700 dark:hover:text-pink-300">
            {t('wellness.consent.privacyPolicy') || 'integritetspolicy'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default WellnessConsentGate
