/**
 * KonsulentSamtyckeFraga — KS3, efterhandsfrågan (beslut Mikael 2026-09-01)
 * =========================================================================
 *
 * VARFÖR DEN FINNS
 * ----------------
 * Mätt mot prod 2026-09-01: 31 kopplingar i `consultant_participants`, 18 med
 * samtycke i `consultant_consents` — alla med `program = 'steg_till_arbete'`.
 * **13 hade inget.**
 *
 * Orsaken låg i två halvor som drog åt olika håll:
 *   · `InviteHandler.tsx` visade samtyckesrutorna bara för STA-inbjudningar
 *     (`consentOk = !isStaInvite || …`), och STA är avstängd sedan 3 augusti.
 *   · `handle_invitation_acceptance()` satte däremot `profiles.consultant_id`
 *     och `consultant_participants` **ovillkorligt**.
 *
 * Kopplingen skapades alltså alltid, samtycket bara ibland. Framåt är det lagat
 * i `InviteParticipantDialog` + `InviteHandler`; den här komponenten är för de
 * som redan är kopplade.
 *
 * VAD DEN INTE ÄR
 * ---------------
 * Ingen tvingande spärr. Målgruppen är arbetssökande, ofta med psykisk ohälsa,
 * och en modal som inte går att stänga är inte "lugn vän" (DESIGN.md §1) — den
 * är ett hot. Därför finns "Jag vill tänka på det", som lägger frågan åt sidan
 * för den här sessionen och tar upp den nästa gång. Esc gör samma sak, uttryckligen.
 * Kopplingen består under tiden; det var beslutet.
 *
 * PÅSTÅENDENA ÄR MÄTTA, INTE FORMULERADE
 * --------------------------------------
 * Listan över vad konsulenten ser är hämtad ur kolumnerna i vyn
 * `consultant_dashboard_participants` (mätt mot prod samma dag): kontaktuppgifter,
 * `has_cv`, `ats_score`, `cv_updated_at`, `completed_interest_test`, `holland_code`,
 * `saved_jobs_count`, `last_login`, `consultant_notes`. Dagbok och mående saknas i
 * vyn och är dessutom grindade var för sig (MV2) — därför står det rakt ut att de
 * inte ingår. Skriv inget här du inte kan belägga i schemat.
 *
 * Att uppsägningen biter är också verifierat: KS2 (2026-08-31) kopplade
 * `consultant_journal` och `consultant_goals` till en **aktiv** rad i
 * `consultant_participants`, och `revoke_consultant_link` tar bort den raden.
 * Före KS2 hade meningen "då slutar konsulenten se dina uppgifter" varit osann.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Loader2, AlertCircle } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { consultantConsentsApi, staEnrollmentsApi } from '@/services/staApi'

/**
 * Frågan läggs åt sidan per session, inte per webbläsare. `localStorage` hade
 * betytt "aldrig mer" för den som klickar bort den en gång — och då vore det
 * ingen fråga, bara en ruta som försvann.
 */
const SESSIONSNYCKEL = 'ks3-samtyckesfraga-uppskjuten'

type Lage = 'laddar' | 'dold' | 'fraga' | 'sparar' | 'fel'

/**
 * Supabase returnerar ett vanligt objekt med `message`, inte en `Error`. Ett
 * `err instanceof Error`-test faller därför tillbaka på den generiska texten och
 * döljer vad som faktiskt gick fel — här är det skillnaden mellan "nätverket
 * strulade" och "42501 permission denied", vilket är precis vad KS3 handlar om.
 */
function felmeddelande(err: unknown, reserv: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m.trim()) return m
  }
  return reserv
}

export function KonsulentSamtyckeFraga() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const konsulentId = profile?.consultant_id ?? null

  const [lage, setLage] = useState<Lage>('laddar')
  const [konsulentNamn, setKonsulentNamn] = useState('')
  const [samtyckerDelning, setSamtyckerDelning] = useState(false)
  const [forstarUppsagning, setForstarUppsagning] = useState(false)
  const [felText, setFelText] = useState<string | null>(null)

  const skjutUpp = useCallback(() => {
    try {
      sessionStorage.setItem(SESSIONSNYCKEL, '1')
    } catch {
      // Privat läge eller blockerad lagring — då kommer frågan tillbaka vid
      // nästa sidladdning i stället. Det är rätt håll att felsäkra åt.
    }
    setLage('dold')
  }, [])

  const modalRef = useFocusTrap<HTMLDivElement>(lage === 'fraga' || lage === 'sparar' || lage === 'fel', {
    onEscape: skjutUpp,
  })

  useEffect(() => {
    let avbruten = false

    async function avgor() {
      if (!profile || !konsulentId || profile.role !== 'USER') {
        setLage('dold')
        return
      }
      try {
        if (sessionStorage.getItem(SESSIONSNYCKEL)) {
          setLage('dold')
          return
        }
      } catch {
        // se kommentaren i skjutUpp
      }

      try {
        const befintligt = await consultantConsentsApi.getActive(konsulentId)
        if (avbruten) return
        if (befintligt) {
          setLage('dold')
          return
        }

        // `profiles` har med flit ingen SELECT-policy som låter en deltagare läsa
        // sin konsulents rad (UX12), så namnet måste komma via RPC:n.
        const { data } = await supabase.rpc('get_my_consultant')
        if (avbruten) return
        const rad = data as { first_name?: string | null; last_name?: string | null } | null
        const namn = [rad?.first_name, rad?.last_name].filter(Boolean).join(' ').trim()
        setKonsulentNamn(namn || t('consultantConsent.yourConsultant'))
        setLage('fraga')
      } catch {
        // Går uppslaget fel visas ingen fråga. Att gissa och visa den ändå vore
        // att be om samtycke till något vi just misslyckades med att beskriva.
        if (!avbruten) setLage('dold')
      }
    }

    void avgor()
    return () => {
      avbruten = true
    }
  }, [profile, konsulentId, t])

  /**
   * Texten som sparas är den texten personen faktiskt läste, satt samman ur samma
   * i18n-nycklar som renderas ovan. Ett samtycke utan sin text är ingen bevisning —
   * det är bara en tidsstämpel som påstår något (art. 7.1).
   */
  const byggSamtyckestext = useCallback(
    () =>
      [
        t('consultantConsent.heading'),
        t('consultantConsent.intro', { namn: konsulentNamn }),
        t('consultantConsent.seesHeading', { namn: konsulentNamn }),
        ...(t('consultantConsent.seesList', { returnObjects: true }) as string[]),
        t('consultantConsent.notSeen'),
        t('consultantConsent.revocation', { namn: konsulentNamn }),
        t('consultantConsent.checkboxSharing', { namn: konsulentNamn }),
        t('consultantConsent.checkboxRevocation'),
      ].join('\n'),
    [t, konsulentNamn]
  )

  async function jaTack() {
    setLage('sparar')
    setFelText(null)
    try {
      const { error } = await supabase.rpc('grant_consultant_consent', {
        p_consent_text: byggSamtyckestext(),
        p_scope: { kalla: 'efterhandsfraga', version: '2026-09-01' },
      })
      if (error) throw error
      setLage('dold')
    } catch (err) {
      setFelText(felmeddelande(err, t('common.genericError')))
      setLage('fel')
    }
  }

  async function nejTack() {
    if (!konsulentId) return
    setLage('sparar')
    setFelText(null)
    try {
      await staEnrollmentsApi.revokeConsultantLink(
        konsulentId,
        'Deltagaren svarade nej i efterhandsfrågan (KS3)'
      )
      // Profilen bär fortfarande gammal `consultant_id` i minnet. En omladdning är
      // ärligare än att gissa hur resten av appen ska se ut efter uppsägningen.
      window.location.reload()
    } catch (err) {
      setFelText(felmeddelande(err, t('common.genericError')))
      setLage('fel')
    }
  }

  if (lage === 'laddar' || lage === 'dold') return null

  const kanSvaraJa = samtyckerDelning && forstarUppsagning && lage !== 'sparar'
  const punkter = t('consultantConsent.seesList', { returnObjects: true }) as string[]

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ks3-titel"
        aria-describedby="ks3-intro"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="rounded-xl bg-sky-50 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <h2 id="ks3-titel" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t('consultantConsent.heading')}
          </h2>
        </div>

        <p id="ks3-intro" className="mb-4 text-sm text-stone-700 dark:text-stone-200">
          {t('consultantConsent.intro', { namn: konsulentNamn })}
        </p>

        <p className="mb-2 text-sm font-medium text-stone-900 dark:text-stone-100">
          {t('consultantConsent.seesHeading', { namn: konsulentNamn })}
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-200">
          {punkter.map((rad) => (
            <li key={rad}>{rad}</li>
          ))}
        </ul>

        <p className="mb-4 text-sm text-stone-700 dark:text-stone-200">{t('consultantConsent.notSeen')}</p>
        <p className="mb-5 text-sm text-stone-700 dark:text-stone-200">
          {t('consultantConsent.revocation', { namn: konsulentNamn })}
        </p>

        <label className="mb-3 flex items-start gap-3 text-sm text-stone-800 dark:text-stone-100">
          <input
            type="checkbox"
            checked={samtyckerDelning}
            onChange={(e) => setSamtyckerDelning(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{t('consultantConsent.checkboxSharing', { namn: konsulentNamn })}</span>
        </label>

        <label className="mb-5 flex items-start gap-3 text-sm text-stone-800 dark:text-stone-100">
          <input
            type="checkbox"
            checked={forstarUppsagning}
            onChange={(e) => setForstarUppsagning(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{t('consultantConsent.checkboxRevocation')}</span>
        </label>

        {felText && (
          <p role="alert" className="mb-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {t('consultantConsent.saveFailed')} {felText}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={jaTack} disabled={!kanSvaraJa} className="sm:flex-1">
            {lage === 'sparar' ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : null}
            {t('consultantConsent.yes')}
          </Button>
          <Button variant="secondary" onClick={nejTack} disabled={lage === 'sparar'} className="sm:flex-1">
            {t('consultantConsent.no')}
          </Button>
        </div>

        <button
          type="button"
          onClick={skjutUpp}
          disabled={lage === 'sparar'}
          className="mt-3 w-full text-sm text-stone-600 underline underline-offset-2 dark:text-stone-300"
        >
          {t('consultantConsent.later')}
        </button>
      </div>
    </div>
  )
}
