/**
 * AktivitetsplanSektion — deltagarens aktivitetsplan i konsulentvyn:
 * veckoschema, närvaro och veckosaldo (KM3/KM4/KM6).
 *
 * Omtaget "Kvarter", steg 5 (2026-10-11): uppdelad i tre delar —
 *   aktivitetsplan/PlanVecka       veckan som fem dagar, summeringen, passen
 *   aktivitetsplan/VeckoSummering  veckan i en mening + "Så räknas det"
 *   aktivitetsplan/PlanHogerspalt  högerspalten per kundtyp
 * Hämtningen bor i aktivitetsplan/useAktivitetsplan, så deltagarsidans huvud
 * (läget, Mer-menyn med "Plan som PDF" och "Avsluta plan") och Översikt läser
 * samma plan. Sidan skickar `styrning`; fristående hämtar sektionen själv.
 *
 * Närvaron sätts bara här, av konsulenten. Ogiltig frånvaro är beslutsunderlag
 * för biståndshandläggaren — själva beslutet om nedsättning fattas av
 * socialnämnden i kommunens system, aldrig i portalen. Ingen AI i kedjan.
 *
 * Saldot visar `—` när inga pass finns i veckan, aldrig 0 %.
 */

import { useState, type ReactNode } from 'react'
import { CalendarDays } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { notifications } from '@/lib/toast'
import { laddaNerUnderlagspaket } from '@/services/underlagspaketPdf'
import { aktivitetsplanApi, type ActivityPlan, type Forsorjningshinder, type PlanHandover } from '@/services/aktivitetApi'
import { forslagetPassdatum, formatLocalDate, veckansMandag } from '@/services/aktivitetSchema'
import { TillampaMallDialog } from './TillampaMallDialog'
import { UnderlagDialog } from './UnderlagDialog'
import { PlatsKoppling } from './PlatsKoppling'
import { AvvikelserapportKort } from './AvvikelserapportKort'
import type { Regelverk } from './orgTypVisning'
import { useAktivitetsplan, type AktivitetsplanStyrning } from './aktivitetsplan/useAktivitetsplan'
import { PlanVecka } from './aktivitetsplan/PlanVecka'
import { PlanYta, UnderlagYta } from './aktivitetsplan/PlanHogerspalt'
import { NyttPassDialog } from './aktivitetsplan/NyttPassDialog'

interface AktivitetsplanSektionProps {
  participantId: string
  participantName: string
  /** Planen hämtad av sidan (useAktivitetsplan). Utan den hämtar sektionen själv. */
  styrning?: AktivitetsplanStyrning
  /**
   * Det sidan lägger överst i högerspalten för ett visst regelverk — för
   * Rusta och matcha mötesklockan och placeringen, som sidan redan hämtat.
   */
  hogerspaltForst?: (regelverk: Regelverk) => ReactNode
}

export function AktivitetsplanSektion({ participantId, participantName, styrning, hogerspaltForst }: AktivitetsplanSektionProps) {
  const egen = useAktivitetsplan(participantId, participantName, !styrning)
  const { lage, ladda, ersattPlan, ersattSession, taEmotUnderlag, regelverk } = styrning ?? egen
  const profile = useAuthStore((s) => s.profile)
  const [underlagDialog, setUnderlagDialog] = useState<null | { lage: 'lamna' } | { lage: 'angra'; underlag: PlanHandover }>(null)
  const [vecka, setVecka] = useState(() => veckansMandag(formatLocalDate(new Date())))
  const [visaTillampa, setVisaTillampa] = useState(false)
  const [visaNyttPass, setVisaNyttPass] = useState(false)
  const [sparaHinder, setSparaHinder] = useState(false)
  // SKK5: paketet (PDF) går att ladda ner från historiken, när som helst.
  const [paketLaddar, setPaketLaddar] = useState<string | null>(null)

  const laddaNerPaket = async (plan: ActivityPlan, h: PlanHandover) => {
    setPaketLaddar(h.id)
    try {
      await laddaNerUnderlagspaket({ plan, underlag: h, participantName })
    } catch (err) {
      notifications.error(err instanceof Error ? `PDF:en kunde inte skapas: ${err.message}` : 'PDF:en kunde inte skapas')
    } finally {
      setPaketLaddar(null)
    }
  }

  // KM7: kategori för IVO-underlaget. Ändras direkt på planen.
  const sattHinder = async (plan: ActivityPlan, varde: '' | Forsorjningshinder) => {
    setSparaHinder(true)
    try {
      ersattPlan(await aktivitetsplanApi.update(plan.id, { forsorjningshinder: varde || null }))
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Försörjningshinder kunde inte sparas')
    } finally {
      setSparaHinder(false)
    }
  }

  if (lage.status === 'laddar') return <LoadingState message="Hämtar aktivitetsplan…" />
  if (lage.status === 'fel') return <ErrorState title="Planen kunde inte hämtas" message={lage.fel} onRetry={() => void ladda()} />

  const { plan, sessions } = lage

  if (!plan) {
    return (
      <>
        <EmptyState
          icon={CalendarDays}
          title="Ingen aktivitetsplan än"
          description={`Tillämpa en schemamall så får ${participantName} ett veckoschema och du kan följa närvaron.`}
          action={{ label: 'Tillämpa schemamall', onClick: () => setVisaTillampa(true) }}
        />
        <TillampaMallDialog
          isOpen={visaTillampa}
          onClose={() => setVisaTillampa(false)}
          participantId={participantId}
          participantName={participantName}
          onCreated={() => {
            setVisaTillampa(false)
            notifications.success('Planen är skapad')
            void ladda()
          }}
        />
      </>
    )
  }

  // Under laddning av medlemskapen och vid fel gäller kommunens vy, som förut.
  const arLeverantor = regelverk === 'leverantor'
  const idag = formatLocalDate(new Date())

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
      <div className="grid gap-6 min-w-0">
        <PlanVecka
          plan={plan}
          sessions={sessions}
          vecka={vecka}
          onVecka={setVecka}
          participantId={participantId}
          participantName={participantName}
          arLeverantor={arLeverantor}
          regelverk={regelverk}
          onLaggTill={() => setVisaNyttPass(true)}
          onChanged={ersattSession}
          onLadda={() => void ladda()}
          onSerieAndrad={(antal) => { notifications.success(antal > 1 ? `${antal} pass är ändrade` : 'Passet är ändrat'); void ladda() }}
        />

        {/* RR10: praktik/arbetsträning i planen ↔ Platser. RK37: och in i planen härifrån. */}
        <PlatsKoppling
          participantId={participantId}
          sessions={sessions}
          plan={plan.status === 'ended' ? null : plan}
          onPassSkapade={(antal) => { notifications.success(`${antal} pass är inlagda i planen`); void ladda() }}
        />
      </div>

      <aside className="grid gap-4 min-w-0" aria-label={arLeverantor ? 'Avtalet med Arbetsförmedlingen' : 'Underlag och plan'}>
        {regelverk && hogerspaltForst?.(regelverk)}
        {arLeverantor ? (
          // RR28: leverantörens avvikelserapport — ersätter kommunens underlag, som är dolt här.
          <AvvikelserapportKort planStart={plan.start_date} sessions={sessions} onChanged={ersattSession} />
        ) : (
          <UnderlagYta
            sessions={sessions}
            underlag={lage.underlag}
            underlagFel={lage.underlagFel}
            egetId={profile?.id}
            paketLaddar={paketLaddar}
            onLamna={() => setUnderlagDialog({ lage: 'lamna' })}
            onAngra={(h) => setUnderlagDialog({ lage: 'angra', underlag: h })}
            onLaddaNer={(h) => void laddaNerPaket(plan, h)}
          />
        )}
        <PlanYta
          plan={plan}
          arLeverantor={arLeverantor}
          sparar={sparaHinder}
          onHinder={(v) => void sattHinder(plan, v)}
          onPlanSparad={ersattPlan}
        />
      </aside>

      <NyttPassDialog
        isOpen={visaNyttPass}
        onClose={() => setVisaNyttPass(false)}
        planId={plan.id}
        participantId={participantId}
        defaultDate={forslagetPassdatum(vecka, idag)}
        planSlut={plan.end_date}
        onCreated={(antal) => { setVisaNyttPass(false); notifications.success(antal > 1 ? `${antal} pass är tillagda` : 'Passet är tillagt'); void ladda() }}
      />
      {/* F10: underlag till handläggaren — bara med en plan att lämna underlag om */}
      {underlagDialog && (
        underlagDialog.lage === 'lamna'
          ? <UnderlagDialog lage="lamna" plan={plan} sessions={sessions} participantName={participantName} onClose={() => setUnderlagDialog(null)} onSparat={(h) => { setUnderlagDialog(null); taEmotUnderlag(h) }} />
          : <UnderlagDialog lage="angra" underlag={underlagDialog.underlag} onClose={() => setUnderlagDialog(null)} onSparat={(h) => { setUnderlagDialog(null); taEmotUnderlag(h) }} />
      )}
    </div>
  )
}
