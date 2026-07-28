/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent with granular control
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Cookie, Settings, Check, X } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'

export interface CookiePreferences {
  necessary: boolean // Always true, cannot be disabled
  analytics: boolean // Sentry error tracking
}

const COOKIE_CONSENT_KEY = 'jobin_cookie_consent'
const COOKIE_PREFERENCES_KEY = 'jobin_cookie_preferences'

export function getCookieConsent(): boolean {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
}

export function getCookiePreferences(): CookiePreferences {
  const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Invalid JSON, return defaults
    }
  }
  return { necessary: true, analytics: false }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() && getCookiePreferences().analytics
}

export function CookieConsent() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false
  })

  useEffect(() => {
    // Check if consent has been given
    const hasConsent = getCookieConsent()
    if (!hasConsent) {
      // Small delay to prevent flash on fast page loads
      const timer = setTimeout(() => setShow(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setShow(false)

    // Dispatch event for Sentry to react
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }))
  }

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true })
  }

  const handleAcceptNecessary = () => {
    saveConsent({ necessary: true, analytics: false })
  }

  const handleSaveCustom = () => {
    saveConsent(preferences)
  }

  if (!show) return null

  return (
    /* UX10 (2026-07-27): wrappern låg som `fixed bottom-0 … z-50 p-4` rakt över
       HubBottomNav (`z-30`, 64 px) och gjorde ALLA FEM hubbar otappbara på mobil
       vid första besöket — hit-test gav 5/5 blockerade knappar på 390×844 och
       360×640. Två ändringar löser det:
         1. `pointer-events-none` på wrappern + `pointer-events-auto` på kortet,
            så den osynliga paddingytan inte längre äter tappar.
         2. Bottenpadding = 1rem + `--bottom-nav-h`, som HubBottomNav sätter när
            det är monterat. Där navet finns lämnar kortet plats åt det; på
            publika sidor (login, registrering) är variabeln 0 och kortet ligger
            kvar exakt där det låg — annars hade fixen skjutit upp kortet över
            inloggningsknappen på mobil. */
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none"
      style={{ paddingBottom: 'calc(1rem + var(--bottom-nav-h, 0px))' }}
    >
      <div className="max-w-2xl mx-auto bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden pointer-events-auto">
        {/* Main Banner */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
              <Cookie className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                {t('cookieConsent.title')}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-600 mb-4">
                {t('cookieConsent.description')}
              </p>

              {/* Customize Panel */}
              {showCustomize && (
                <div className="space-y-3 mb-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl">
                  {/* Necessary - Always enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {t('cookieConsent.necessary')}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-600">
                        {t('cookieConsent.necessaryDesc')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600">
                        {t('settings.privacy.consent.required')}
                      </span>
                      <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Analytics - Optional */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {t('cookieConsent.analytics')}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-600">
                        {t('cookieConsent.analyticsDesc')}
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                      className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.analytics
                          ? 'bg-green-500 justify-end'
                          : 'bg-stone-300 dark:bg-stone-600 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow" />
                    </button>
                  </div>
                </div>
              )}

              {/* Links */}
              <p className="text-xs text-stone-500 dark:text-stone-600 mb-4">
                {t('cookieConsent.moreInfo')}{' '}
                <Link to="/privacy" className="text-indigo-600 hover:underline">
                  {t('cookieConsent.privacyPolicy')}
                </Link>
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                {showCustomize ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveCustom}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t('cookieConsent.save')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomize(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAcceptAll}
                    >
                      {t('cookieConsent.acceptAll')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAcceptNecessary}
                    >
                      {t('cookieConsent.acceptNecessary')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomize(true)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      {t('cookieConsent.customize')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
