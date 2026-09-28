/**
 * Glömt lösenordet? (PUB-1, skarpt test 2026-09-28) — portalen hade ingen väg
 * tillbaka för den som glömt sitt lösenord. Adressen skickas till edge-funktionen
 * `losenord-aterstall`, som mejlar en engångslänk till /nytt-losenord.
 * Svaret är alltid detsamma, oavsett om adressen har ett konto.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Mail } from '@/components/ui/icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { supabase } from '@/lib/supabase'
import { PUBLIC_PAGE_BOTTOM_PADDING } from '@/components/CookieConsent'

export default function GlomtLosenord() {
  const { t } = useTranslation()
  const [epost, setEpost] = useState('')
  const [skickar, setSkickar] = useState(false)
  const [skickat, setSkickat] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const skicka = async (e: React.FormEvent) => {
    e.preventDefault()
    setFel(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost.trim())) {
      setFel(t('aterstall.ogiltigEpost'))
      return
    }
    setSkickar(true)
    try {
      const { error } = await supabase.functions.invoke('losenord-aterstall', { body: { email: epost.trim() } })
      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status
        setFel(status === 429 ? t('aterstall.forManga') : t('aterstall.gickInte'))
        return
      }
      setSkickat(true)
    } catch {
      setFel(t('aterstall.gickInte'))
    } finally {
      setSkickar(false)
    }
  }

  return (
    <main
      className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4"
      style={{ paddingBottom: PUBLIC_PAGE_BOTTOM_PADDING }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <OptimizedImage src="/logo-icon.svg" alt="Jobin" loading="eager" className="w-16 h-16 mx-auto mb-4 object-contain" />
        </div>
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-8 space-y-5">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 text-center">{t('aterstall.glomtRubrik')}</h1>
          {skickat ? (
            <div role="status" className="space-y-3 text-stone-700 dark:text-stone-200">
              <p>{t('aterstall.skickat', { epost: epost.trim() })}</p>
              <p className="text-sm">{t('aterstall.skickatTips')}</p>
            </div>
          ) : (
            <form onSubmit={skicka} className="space-y-4" noValidate>
              <p className="text-stone-600 dark:text-stone-300">{t('aterstall.glomtIngress')}</p>
              <div>
                <label htmlFor="aterstall-epost" className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                  <input
                    id="aterstall-epost"
                    type="email"
                    autoComplete="email"
                    value={epost}
                    onChange={(e) => setEpost(e.target.value)}
                    aria-invalid={!!fel}
                    aria-describedby={fel ? 'aterstall-fel' : undefined}
                    className="w-full pl-10 pr-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
                  />
                </div>
                {fel && <p id="aterstall-fel" role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{fel}</p>}
              </div>
              <button
                type="submit"
                disabled={skickar}
                className="w-full bg-[var(--c-solid)] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
              >
                {skickar && <Loader2 className="animate-spin" size={20} aria-hidden="true" />}
                {t('aterstall.skickaLank')}
              </button>
            </form>
          )}
          <p className="text-center">
            <Link to="/login" className="text-[var(--c-text)] font-semibold inline-flex items-center min-h-[44px] px-2">{t('aterstall.tillbakaTillLogin')}</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
