/**
 * Nytt lösenord (PUB-1, 2026-09-28) — dit länken i återställningsmejlet leder:
 * /nytt-losenord?th=<token_hash>. Engångskoden löses in med
 * verifyOtp({ type: 'recovery' }) — fungerar på vilken enhet som helst, till skillnad
 * från PKCE-länken (se supabase/functions/losenord-aterstall). Sedan updateUser.
 * Koden förbrukas vid första inlösen; sidan håller sessionen tills lösenordet är valt.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from '@/components/ui/icons'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { supabase } from '@/lib/supabase'
import { PUBLIC_PAGE_BOTTOM_PADDING } from '@/components/CookieConsent'
import { NyttLosenordFalt } from '@/components/auth/NyttLosenordFalt'
import { losenordetDuger } from '@/components/auth/losenordetDuger'

type Lage = 'loser' | 'redo' | 'ogiltig' | 'sparar' | 'klart'

export default function NyttLosenord() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const th = params.get('th')
  const [lage, setLage] = useState<Lage>('loser')
  const [nytt, setNytt] = useState('')
  const [bekrafta, setBekrafta] = useState('')
  const [fel, setFel] = useState<string | null>(null)
  const inlost = useRef(false)

  useEffect(() => {
    if (inlost.current) return
    inlost.current = true
    ;(async () => {
      if (!th) {
        setLage('ogiltig')
        return
      }
      const { error } = await supabase.auth.verifyOtp({ token_hash: th, type: 'recovery' })
      setLage(error ? 'ogiltig' : 'redo')
    })()
  }, [th])

  const spara = async (e: React.FormEvent) => {
    e.preventDefault()
    setFel(null)
    if (!losenordetDuger(nytt)) {
      setFel(t('aterstall.uppfyllerInte'))
      return
    }
    if (nytt !== bekrafta) {
      setFel(t('aterstall.olika'))
      return
    }
    setLage('sparar')
    const { error } = await supabase.auth.updateUser({ password: nytt })
    if (error) {
      setFel(/different from the old|same/i.test(error.message) ? t('aterstall.sammaSomForut') : t('aterstall.sparaFel'))
      setLage('redo')
      return
    }
    setLage('klart')
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
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 text-center">{t('aterstall.nyttRubrik')}</h1>

          {lage === 'loser' && (
            <p role="status" className="flex items-center justify-center gap-2 text-stone-600 dark:text-stone-300">
              <Loader2 className="animate-spin" size={20} aria-hidden="true" /> {t('aterstall.kontrollerar')}
            </p>
          )}

          {lage === 'ogiltig' && (
            <div role="alert" className="space-y-3 text-stone-700 dark:text-stone-200">
              <p>{t('aterstall.lankOgiltig')}</p>
              <Link to="/glomt-losenord" className="inline-flex min-h-[44px] items-center font-semibold text-[var(--c-text)]">{t('aterstall.nyLank')}</Link>
            </div>
          )}

          {(lage === 'redo' || lage === 'sparar') && (
            <form onSubmit={spara} className="space-y-4" noValidate>
              <NyttLosenordFalt nytt={nytt} bekrafta={bekrafta} onNytt={setNytt} onBekrafta={setBekrafta} />
              {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
              <button
                type="submit"
                disabled={lage === 'sparar'}
                className="w-full bg-[var(--c-solid)] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
              >
                {lage === 'sparar' && <Loader2 className="animate-spin" size={20} aria-hidden="true" />}
                {t('aterstall.sparaLosenord')}
              </button>
            </form>
          )}

          {lage === 'klart' && (
            <div role="status" className="space-y-4 text-stone-700 dark:text-stone-200">
              <p>{t('aterstall.klart')}</p>
              <button
                type="button"
                onClick={() => navigate('/', { replace: true })}
                className="w-full bg-[var(--c-solid)] text-white py-3 rounded-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
              >
                {t('aterstall.tillPortalen')}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
