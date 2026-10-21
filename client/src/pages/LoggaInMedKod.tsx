/**
 * Logga in med engångskod (KC6, 2026-10-21) — utan lösenord. Adressen skickas
 * till edge-funktionen `engangskod`, som mejlar en sexsiffrig kod och en länk.
 * Koden skrivs in här (verifyOtp type 'email'); länken leder hit med ?th= och
 * löses in direkt (verifyOtp type 'magiclink'). Båda fungerar på vilken enhet
 * som helst. Svaret är alltid detsamma, oavsett om adressen har ett konto.
 *
 * Efter inloggningen laddas sidan om, inte navigate(): authStore hinner annars
 * inte läsa in sessionen (samma fälla som VisaSom, uppmätt 2026-09-27).
 * Tvåstegsinloggningen tar vid därefter (MfaGrind), precis som efter lösenord.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Mail } from '@/components/ui/icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { supabase } from '@/lib/supabase'
import { PUBLIC_PAGE_BOTTOM_PADDING } from '@/components/CookieConsent'

type Steg = 'epost' | 'kod' | 'loser' | 'ogiltig'

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KOD = /^\d{6}$/

function laddaOmInloggad() {
  window.location.replace(`${window.location.pathname}#/`)
  window.location.reload()
}

export default function LoggaInMedKod() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const th = params.get('th')
  const [steg, setSteg] = useState<Steg>(th ? 'loser' : 'epost')
  const [epost, setEpost] = useState('')
  const [kod, setKod] = useState('')
  const [arbetar, setArbetar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const inlost = useRef(false)
  const kodRef = useRef<HTMLInputElement>(null)

  // Länken ur mejlet.
  useEffect(() => {
    if (!th || inlost.current) return
    inlost.current = true
    supabase.auth.verifyOtp({ token_hash: th, type: 'magiclink' }).then(({ error }) => {
      if (error) setSteg('ogiltig')
      else laddaOmInloggad()
    })
  }, [th])

  useEffect(() => {
    if (steg === 'kod') kodRef.current?.focus()
  }, [steg])

  const skicka = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setFel(null)
    if (!EPOST.test(epost.trim())) {
      setFel(t('aterstall.ogiltigEpost'))
      return
    }
    setArbetar(true)
    try {
      const { error } = await supabase.functions.invoke('engangskod', { body: { email: epost.trim() } })
      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status
        setFel(status === 429 ? t('aterstall.forManga') : t('engangskod.gickInte'))
        return
      }
      setKod('')
      setSteg('kod')
    } catch {
      setFel(t('engangskod.gickInte'))
    } finally {
      setArbetar(false)
    }
  }

  const loggaIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setFel(null)
    const ren = kod.replace(/\s/g, '')
    if (!KOD.test(ren)) {
      setFel(t('engangskod.kodFormat'))
      return
    }
    setArbetar(true)
    const { error } = await supabase.auth.verifyOtp({ email: epost.trim().toLowerCase(), token: ren, type: 'email' })
    if (error) {
      setArbetar(false)
      setFel(t('engangskod.kodFel'))
      return
    }
    laddaOmInloggad()
  }

  const falt = 'w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]'
  const knapp = 'w-full bg-[var(--c-solid)] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2'

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
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 text-center">{t('engangskod.rubrik')}</h1>

          {steg === 'loser' && (
            <p role="status" className="text-stone-700 dark:text-stone-200 flex items-center gap-2 justify-center">
              <Loader2 className="animate-spin" size={20} aria-hidden="true" />
              {t('engangskod.loggarIn')}
            </p>
          )}

          {steg === 'ogiltig' && (
            <div className="space-y-4">
              <p role="alert" className="text-stone-800 dark:text-stone-100">{t('engangskod.lankOgiltig')}</p>
              <button type="button" className={knapp} onClick={() => { setSteg('epost'); setFel(null) }}>
                {t('engangskod.nyKod')}
              </button>
            </div>
          )}

          {steg === 'epost' && (
            <form onSubmit={skicka} className="space-y-4" noValidate>
              <p className="text-stone-600 dark:text-stone-300">{t('engangskod.ingress')}</p>
              <div>
                <label htmlFor="kod-epost" className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                  <input
                    id="kod-epost"
                    type="email"
                    autoComplete="email"
                    value={epost}
                    onChange={(e) => setEpost(e.target.value)}
                    aria-invalid={!!fel}
                    aria-describedby={fel ? 'kod-fel' : undefined}
                    className={`${falt} pl-10`}
                  />
                </div>
                {fel && <p id="kod-fel" role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{fel}</p>}
              </div>
              <button type="submit" disabled={arbetar} className={knapp}>
                {arbetar && <Loader2 className="animate-spin" size={20} aria-hidden="true" />}
                {t('engangskod.skicka')}
              </button>
            </form>
          )}

          {steg === 'kod' && (
            <form onSubmit={loggaIn} className="space-y-4" noValidate>
              <p role="status" className="text-stone-700 dark:text-stone-200">{t('engangskod.skickat', { epost: epost.trim() })}</p>
              <div>
                <label htmlFor="kod-kod" className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1">{t('engangskod.kodEtikett')}</label>
                <input
                  id="kod-kod"
                  ref={kodRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  value={kod}
                  onChange={(e) => setKod(e.target.value)}
                  aria-invalid={!!fel}
                  aria-describedby={fel ? 'kod-fel' : 'kod-tips'}
                  className={`${falt} text-center text-2xl tracking-[0.4em] tabular-nums`}
                />
                {fel
                  ? <p id="kod-fel" role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{fel}</p>
                  : <p id="kod-tips" className="mt-1 text-sm text-stone-600 dark:text-stone-300">{t('engangskod.tips')}</p>}
              </div>
              <button type="submit" disabled={arbetar} className={knapp}>
                {arbetar && <Loader2 className="animate-spin" size={20} aria-hidden="true" />}
                {t('auth.login')}
              </button>
              <button
                type="button"
                disabled={arbetar}
                onClick={() => skicka()}
                className="w-full text-[var(--c-text)] underline underline-offset-2 min-h-[44px]"
              >
                {t('engangskod.skickaIgen')}
              </button>
            </form>
          )}

          <p className="text-center">
            <Link to="/login" className="text-[var(--c-text)] font-semibold inline-flex items-center min-h-[44px] px-2">{t('engangskod.medLosenord')}</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
