/**
 * SamtyckeSteg — villkor och integritetspolicy i efterhand (DP1, 2026-09-24)
 * ==========================================================================
 *
 * VARFÖR DEN FINNS
 * ----------------
 * Registreringen (`pages/Register.tsx`) kräver två kryss: användarvillkoren och
 * integritetspolicyn. Två vägar in har aldrig visat dem:
 *
 *   · Google-inloggningen. `signInWithOAuth` går direkt till Google och tillbaka
 *     till `/`; kryssrutorna i Register.tsx passeras aldrig, och
 *     `handle_new_user()` sätter kolumnerna bara ur metadata som aldrig skickas.
 *   · Äldre e-postkonton från före kryssrutorna.
 *
 * Mätt mot prod 2026-09-24: 17 av 17 Google-konton (senast 2026-09-22) och 38 av
 * 63 e-postkonton saknade `terms_accepted_at`/`privacy_accepted_at`. Art. 7.1
 * lägger bevisbördan på oss — vi ska kunna visa att samtycket gavs.
 *
 * VÄGEN IN
 * --------
 * Skrivningen går genom `consentApi.beviljaSamtycke`, alltså RPC:n
 * `grant_consent`. Den är SECURITY DEFINER, sätter kolumnen för `auth.uid()` och
 * triggern `log_consent_changes` skriver raden i `consent_history`. Skriv aldrig
 * kolumnerna direkt här (grind: `test/consent-loggas.test.ts`).
 *
 * VEM SOM FÅR FRÅGAN — ETT MEDVETET VAL
 * -------------------------------------
 * Alla inloggade konton som saknar något av de två, oavsett roll: deltagare,
 * konsulent, admin och företagskontakt. Skälen:
 *   1. Villkoren och integritetspolicyn gäller den som har ett konto, inte en
 *      roll. En konsulent är också en registrerad person vars uppgifter vi
 *      behandlar, och har rätt till samma information (art. 13).
 *   2. Rollen går att växla (`activeRole`). En regel som undantar en roll blir en
 *      väg förbi steget för den som har två.
 *   3. Den som redan godkänt ser aldrig steget — 32 av 113 profiler har båda
 *      satta, bland dem företagsdemot och demokonsulenten.
 * AI-kryssrutan visas däremot inte för företagskontot: företaget har inga
 * AI-funktioner, och en fråga om något man inte kan använda är brus.
 *
 * OBLIGATORISKT, MEN INTE ETT HOT
 * -------------------------------
 * Till skillnad från KS3-frågan (`KonsulentSamtyckeFraga`) går steget inte att
 * skjuta upp: utan villkoren finns inget avtal att använda tjänsten under. Esc
 * stänger därför inget. Men det finns alltid en väg ut — "Logga ut i stället" —
 * så rutan är ett val, inte en fälla (DESIGN.md §1).
 *
 * AI-samtycket är frivilligt, precis som vid registreringen, och skrivs FÖRST när
 * det är ikryssat. Går det fel har inget obligatoriskt skrivits än och hela
 * formuläret kan skickas igen; gick det bra men villkoren fallerar, är AI-rutan
 * borta vid nästa försök (kolumnen är satt) och bara villkoren skickas om. Så
 * blir det aldrig två `granted`-rader för samma klick.
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Loader2, AlertCircle } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import {
  beviljaSamtycke,
  saknadeGrundsamtycken,
  SAMTYCKESKOLUMN,
  type SamtyckesTyp,
} from '@/services/consentApi'

interface Props {
  /** Visa den frivilliga AI-rutan. Av för företagskontot, som saknar AI-funktioner. */
  visaAiVal?: boolean
}

/**
 * Speglar serverns nya värde i den lokala profilen, så steget stängs och
 * resten av appen (t.ex. AI-grinden) ser samtycket utan en ny hämtning.
 * Serverns egen `NOW()` är den som gäller; det här är bara klientens kopia
 * tills nästa `initialize()`. Via store-API:t, inte `updateProfile`, som
 * skriver profilraden direkt och därmed förbi registret.
 */
function speglaLokalt(typ: SamtyckesTyp) {
  const nu = new Date().toISOString()
  useAuthStore.setState((s) =>
    s.profile ? { profile: { ...s.profile, [SAMTYCKESKOLUMN[typ]]: nu } } : {}
  )
}

export function SamtyckeSteg({ visaAiVal = true }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)

  const saknade = saknadeGrundsamtycken(profile)
  const visas = saknade.length > 0
  const fragaOmAi = visaAiVal && !!profile && !profile.ai_consent_at

  const [villkor, setVillkor] = useState(false)
  const [integritet, setIntegritet] = useState(false)
  const [ai, setAi] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)

  // Ingen onEscape: steget är obligatoriskt. Utvägen är "Logga ut i stället".
  const dialogRef = useFocusTrap<HTMLDivElement>(visas)

  if (!visas) return null

  const kanFortsatta = villkor && integritet && !sparar

  async function godkann(e: FormEvent) {
    e.preventDefault()
    // Knappen är låst, men formuläret kan också skickas med Enter i en kryssruta.
    // Kontrollen här är den som faktiskt håller.
    if (!villkor || !integritet || sparar) return
    setSparar(true)
    setFel(false)
    try {
      const attGe: SamtyckesTyp[] = [...(fragaOmAi && ai ? (['ai_processing'] as const) : []), ...saknade]
      for (const typ of attGe) {
        await beviljaSamtycke(typ)
        speglaLokalt(typ)
      }
    } catch {
      setFel(true)
    } finally {
      setSparar(false)
    }
  }

  async function loggaUt() {
    await signOut()
    navigate('/login')
  }

  const lankKlass =
    'text-[var(--c-text)] dark:text-[var(--c-text)] underline underline-offset-2 hover:no-underline'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      data-testid="samtyckessteg"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="samtyckessteg-titel"
        aria-describedby="samtyckessteg-intro"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-stone-900"
      >
        <form onSubmit={godkann} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto p-6 pb-2">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-xl bg-[var(--c-bg)] p-2 text-[var(--c-text)] dark:bg-[var(--c-bg)]/30 dark:text-[var(--c-solid)]">
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <h2 id="samtyckessteg-titel" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {t('consentStep.heading', 'Ett steg kvar innan du fortsätter')}
              </h2>
            </div>

            <p id="samtyckessteg-intro" className="mb-5 text-sm text-stone-700 dark:text-stone-200">
              {t(
                'consentStep.intro',
                'Vi har inte ditt godkännande av användarvillkoren och integritetspolicyn sparat. Kryssa i båda rutorna för att fortsätta använda Jobin. Länkarna öppnas i en ny flik.'
              )}
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="samtycke-villkor"
                  checked={villkor}
                  onChange={(e) => setVillkor(e.target.checked)}
                  aria-required="true"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 dark:border-stone-600"
                />
                <label htmlFor="samtycke-villkor" className="text-sm text-stone-800 dark:text-stone-100">
                  {t('auth.consent.acceptTerms')}{' '}
                  <Link to="/terms" target="_blank" rel="noopener" className={lankKlass}>
                    {t('auth.consent.termsLink')}
                  </Link>{' '}
                  <span className="text-red-600 dark:text-red-400" aria-hidden="true">*</span>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="samtycke-integritet"
                  checked={integritet}
                  onChange={(e) => setIntegritet(e.target.checked)}
                  aria-required="true"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 dark:border-stone-600"
                />
                <label htmlFor="samtycke-integritet" className="text-sm text-stone-800 dark:text-stone-100">
                  {t('auth.consent.acceptPrivacy')}{' '}
                  <Link to="/privacy" target="_blank" rel="noopener" className={lankKlass}>
                    {t('auth.consent.privacyLink')}
                  </Link>{' '}
                  <span className="text-red-600 dark:text-red-400" aria-hidden="true">*</span>
                </label>
              </div>

              {fragaOmAi && (
                <div className="mt-3 flex items-start gap-3 border-t border-stone-200 pt-3 dark:border-stone-700">
                  <input
                    type="checkbox"
                    id="samtycke-ai"
                    checked={ai}
                    onChange={(e) => setAi(e.target.checked)}
                    aria-describedby="samtycke-ai-beskrivning"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 dark:border-stone-600"
                  />
                  <div>
                    <label htmlFor="samtycke-ai" className="text-sm text-stone-800 dark:text-stone-100">
                      {t('auth.consent.acceptAi')}{' '}
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                        ({t('auth.consent.optionalLabel')})
                      </span>
                    </label>
                    <p id="samtycke-ai-beskrivning" className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                      {t('auth.consent.aiDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-200 px-6 pb-6 pt-4 dark:border-stone-700">
            {fel && (
              <p role="alert" className="mb-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                {t('consentStep.saveFailed', 'Det gick inte att spara just nu. Försök igen om en stund.')}
              </p>
            )}

            {!kanFortsatta && !sparar && (
              <p id="samtyckessteg-krav" className="mb-3 text-sm text-stone-600 dark:text-stone-300">
                {t('consentStep.requiredHint', 'Båda rutorna med stjärna behöver vara ikryssade.')}
              </p>
            )}

            <Button
              type="submit"
              disabled={!kanFortsatta}
              aria-describedby={!kanFortsatta && !sparar ? 'samtyckessteg-krav' : undefined}
              className="w-full"
            >
              {sparar ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
              {t('consentStep.continue', 'Godkänn och fortsätt')}
            </Button>

            <button
              type="button"
              onClick={loggaUt}
              disabled={sparar}
              className="mt-3 min-h-[44px] w-full text-sm text-stone-600 underline underline-offset-2 dark:text-stone-300"
            >
              {t('consentStep.logout', 'Logga ut i stället')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SamtyckeSteg
