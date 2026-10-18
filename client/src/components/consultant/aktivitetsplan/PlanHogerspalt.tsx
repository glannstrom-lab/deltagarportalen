/**
 * PlanHogerspalt — högerspalten på Aktivitet-fliken, olika per kundtyp
 * (omtaget "Kvarter", steg 5, 2026-10-11). Förslaget: "Samma skal, olika
 * högerspalt" — allt annat på deltagarsidan är identiskt.
 *
 *   Kommun:          Underlag till handläggaren (Lämna underlag som knapp,
 *                    lämnade underlag och kvittenser), sedan Planen.
 *   Rusta och matcha: det sidan skickar in (mötesklockan, placeringen),
 *                    Avvikelser till Arbetsförmedlingen, sedan Planen.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2). Underlagets
 * texter har redan nycklar (consultant.underlag.*) och läses därifrån.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { planBekraftelseApi, bekraftelseLage } from '@/services/planBekraftelseApi'
import { GRUND_PER_DAG } from '@/services/rom2Ersattning'
import { StatusChip } from '@/components/ui/StatusChip'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { SpaltYta } from '../SpaltYta'
import { cn } from '@/lib/utils'
import { formatLocalDate } from '@/services/aktivitetSchema'
import {
  FORSORJNINGSHINDER,
  FORSORJNINGSHINDER_ETIKETT,
  aktivitetsplanApi,
  kanAngraUnderlag,
  type ActivityPlan,
  type ActivitySession,
  type Forsorjningshinder,
  type PlanHandover,
} from '@/services/aktivitetApi'
import { PLAN_PASS_KOLUMNER_FINNS } from '@/services/planMarkning'
import { ArendenummerFalt } from '../ArendenummerFalt'
import { formatTimmar, kortDatum, langtDatum } from '../aktivitetEtiketter'

const MANAD = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
const STATUS_TEXT: Record<ActivityPlan['status'], string> = { active: 'Aktiv', paused: 'Pausad', ended: 'Avslutad' }

// ---------------------------------------------------------------------------
// Kommun: underlag till handläggaren
// ---------------------------------------------------------------------------

export function UnderlagYta({ sessions, underlag, underlagFel, egetId, paketLaddar, onLamna, onAngra, onLaddaNer }: {
  sessions: readonly ActivitySession[]
  underlag: readonly PlanHandover[]
  underlagFel: string | null
  /** Den inloggade konsulentens id — "av dig". */
  egetId: string | undefined
  paketLaddar: string | null
  onLamna: () => void
  onAngra: (h: PlanHandover) => void
  onLaddaNer: (h: PlanHandover) => void
}) {
  const { t } = useTranslation()
  const idag = formatLocalDate(new Date())
  const manad = idag.slice(0, 7)
  const manadNamn = MANAD[Number(idag.slice(5, 7)) - 1]
  const ogiltiga = sessions
    .filter((s) => s.attendance === 'absent_invalid' && s.date.startsWith(manad))
    .sort((a, b) => b.date.localeCompare(a.date))
  const sammanfattning = ogiltiga.length === 0
    ? `Ingen ogiltig frånvaro registrerad i ${manadNamn}.`
    : ogiltiga.length === 1
      ? `En ogiltig frånvaro i ${manadNamn}.`
      : `${ogiltiga.length} ogiltiga frånvaron i ${manadNamn}.`

  return (
    <SpaltYta ikon="handlaggare" rubrik={t('consultant.underlag.rubrik')} testId="rad-underlag">
      <p className="m-0 text-sm text-[var(--j-blak-2)]">{sammanfattning}</p>
      {ogiltiga.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-2" aria-label={`Ogiltig frånvaro i ${manadNamn}`}>
          {ogiltiga.slice(0, 3).map((s) => (
            <li key={s.id} className="grid gap-1 rounded-[var(--j-r-m)] bg-[var(--j-sankt)] px-3 py-2.5 text-sm">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{kortDatum(s.date)} · {s.title}</span>
                <StatusChip status="ogiltig">Ogiltig</StatusChip>
              </span>
              <span className="text-[var(--j-blak-2)]">
                {s.attendance_note ? s.attendance_note : 'Ingen orsak antecknad — skriv den på passet.'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* Slipningen 2026-10-11 (kommun A4): aktivitetskravets viktigaste handling var en 12 px-länk. */}
      <Button
        ton="kvarter"
        variant="secondary"
        fullWidth
        onClick={onLamna}
        leftIcon={<KvarterIkon namn="underlag" size={20} />}
      >
        {t('consultant.underlag.lamna')}
      </Button>
      {underlagFel && (
        <p className="m-0 text-sm text-[var(--s-ogiltig-text)]" role="status">{underlagFel}</p>
      )}
      {underlag.length === 0 && !underlagFel && (
        <p className="m-0 text-sm text-[var(--j-blak-3)]">{t('consultant.underlag.tomt')}</p>
      )}
      {underlag.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-2 text-sm" aria-label={t('consultant.underlag.rubrik')}>
          {underlag.map((h) => {
            const datum = langtDatum(new Date(h.handed_over_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))
            return (
              <li key={h.id} className="grid gap-1 border-t border-[var(--j-linje)] pt-2 first:border-t-0 first:pt-0">
                <span className={cn(h.withdrawn_at && 'line-through text-[var(--j-blak-3)]')}>
                  {t('consultant.underlag.lamnat', { datum, mottagare: h.recipient })}
                  {h.handed_over_by === egetId && <span className="text-[var(--j-blak-3)]"> · {t('consultant.underlag.avVem', { namn: 'dig' })}</span>}
                  <span className="text-[var(--j-blak-3)]"> · {t('consultant.underlag.period', { from: kortDatum(h.period_from), to: kortDatum(h.period_to) })}</span>
                </span>
                {/* KH11: handläggaren i portalen har kvitterat — eller inte än. */}
                {h.recipient_user_id && !h.withdrawn_at && (
                  <span>
                    {h.received_at
                      ? <StatusChip status="narvarande">{t('consultant.underlag.kvitterat', { datum: kortDatum(h.received_at.slice(0, 10)) })}</StatusChip>
                      : <StatusChip status="vantar">{t('consultant.underlag.ejKvitterat')}</StatusChip>}
                  </span>
                )}
                {h.withdrawn_at && (
                  <span className="text-xs text-[var(--j-blak-3)]">{t('consultant.underlag.angrat', { datum: kortDatum(h.withdrawn_at.slice(0, 10)), skal: h.withdrawn_reason ?? '' })}</span>
                )}
                <span className="flex flex-wrap gap-x-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-[var(--j-gran-text)] underline-offset-2 hover:underline disabled:opacity-60"
                    disabled={paketLaddar === h.id}
                    onClick={() => onLaddaNer(h)}
                  >
                    {paketLaddar === h.id ? 'Skapar PDF…' : 'Ladda ner PDF'}
                  </button>
                  {kanAngraUnderlag(h) && (
                    <button type="button" className="text-sm text-[var(--j-blak-2)] underline-offset-2 hover:underline" onClick={() => onAngra(h)}>
                      {t('consultant.underlag.angra')}
                    </button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SpaltYta>
  )
}

// ---------------------------------------------------------------------------
// Båda: planens fakta
// ---------------------------------------------------------------------------

/**
 * KF2: AF:s nivå och deltagandegrad — det grundersättningen räknas på (FFU ROM2 §5.1).
 * Sparas direkt vid ändring; ett fel visas och värdet återställs.
 */
function Rom2PlanFalt({ plan, onPlanSparad }: { plan: ActivityPlan; onPlanSparad: (p: ActivityPlan) => void }) {
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [grad, setGrad] = useState(plan.deltagandegrad != null ? String(plan.deltagandegrad) : '')
  const spara = async (patch: Partial<Pick<ActivityPlan, 'rom_niva' | 'deltagandegrad'>>) => {
    setSparar(true); setFel(null)
    try { onPlanSparad(await aktivitetsplanApi.update(plan.id, patch)) }
    catch (e) { setFel(e instanceof Error ? e.message : 'Kunde inte spara'); setGrad(plan.deltagandegrad != null ? String(plan.deltagandegrad) : '') }
    finally { setSparar(false) }
  }
  const valtGrad = (v: string) => {
    const n = v === '' ? null : Math.round(Number(v))
    if (n !== null && (!Number.isFinite(n) || n < 1 || n > 100)) { setFel('Deltagandegraden ska vara 1–100 %'); return }
    if (n !== (plan.deltagandegrad ?? null)) void spara({ deltagandegrad: n })
  }
  return (
    <div className="grid gap-2 text-sm" data-testid="rom2-planfalt">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
        <label htmlFor={`rom-niva-${plan.id}`} className="text-[var(--j-blak-3)]">Nivå (AF)</label>
        <select id={`rom-niva-${plan.id}`} disabled={sparar} value={plan.rom_niva ?? ''}
          onChange={(e) => void spara({ rom_niva: (e.target.value || null) as ActivityPlan['rom_niva'] })}
          className="min-h-[44px] sm:min-h-[36px] rounded-[var(--j-r-s)] border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)] px-2 py-1 text-sm">
          <option value="">Inte angiven</option>
          {(['A', 'B', 'C'] as const).map((n) => <option key={n} value={n}>{n} — {GRUND_PER_DAG[n]} kr/dag</option>)}
        </select>
        <label htmlFor={`rom-grad-${plan.id}`} className="text-[var(--j-blak-3)]">Deltagandegrad</label>
        <span className="flex items-center gap-2">
          <input id={`rom-grad-${plan.id}`} inputMode="numeric" disabled={sparar} value={grad} onChange={(e) => setGrad(e.target.value)} onBlur={(e) => valtGrad(e.target.value.trim())}
            className="w-20 min-h-[44px] sm:min-h-[36px] rounded-[var(--j-r-s)] border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)] px-2 py-1 text-sm" />
          <span className="text-[var(--j-blak-3)]">% {plan.deltagandegrad != null && plan.deltagandegrad < 100 ? '· 80 % av grundersättningen' : ''}</span>
        </span>
      </div>
      {fel && <p role="alert" className="m-0 text-[var(--s-ogiltig-text)]">{fel}</p>}
    </div>
  )
}

/** KF5: har deltagaren bekräftat att hen läst DEN HÄR versionen av planen? */
function PlanBekraftelseRad({ plan }: { plan: ActivityPlan }) {
  const q = useQuery({ queryKey: ['plan-bekraftelse', plan.id], queryFn: () => planBekraftelseApi.lista(plan.id), staleTime: 60_000 })
  if (q.isLoading) return <span className="text-[var(--j-blak-3)]">…</span>
  if (q.isError || !q.data) return <span className="text-[var(--j-blak-3)]">Bekräftelsen kunde inte läsas</span>
  const lage = bekraftelseLage(plan.updated_at, q.data)
  if (lage.lage === 'aktuell') return <>Bekräftade att hen läst planen {langtDatum(formatLocalDate(new Date(lage.bekraftad)))}</>
  if (lage.lage === 'aldre') return <>Bekräftade {langtDatum(formatLocalDate(new Date(lage.bekraftad)))} — planen har ändrats sedan dess</>
  return <span className="text-[var(--j-blak-3)]">Har inte bekräftat planen i Min vecka</span>
}

export function PlanYta({ plan, arLeverantor, sparar, onHinder, onPlanSparad }: {
  plan: ActivityPlan
  arLeverantor: boolean
  sparar: boolean
  onHinder: (v: '' | Forsorjningshinder) => void
  onPlanSparad: (p: ActivityPlan) => void
}) {
  const mal = Number(plan.weekly_hours_target) || 0
  const eget = Number(plan.jobsearch_hours_per_week) || 0
  return (
    <SpaltYta ikon="plan" rubrik="Planen" testId="plan-yta">
      <p className="m-0 flex flex-wrap items-center gap-2 font-semibold">
        <span>{plan.template_name ?? 'Aktivitetsplan'}</span>
        <StatusChip status={plan.status === 'active' ? 'narvarande' : 'planerat'}>{STATUS_TEXT[plan.status]}</StatusChip>
      </p>
      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-[var(--j-blak-3)]">Veckomål</dt>
        <dd className="m-0">{formatTimmar(mal)}: {formatTimmar(Math.max(0, mal - eget))} anvisat, {formatTimmar(eget)} eget</dd>
        <dt className="text-[var(--j-blak-3)]">Period</dt>
        <dd className="m-0">{langtDatum(plan.start_date)}{plan.end_date ? ` – ${langtDatum(plan.end_date)}` : ', tills vidare'}</dd>
        {plan.decided_at && (<>
          <dt className="text-[var(--j-blak-3)]">Beslutad</dt>
          <dd className="m-0">{langtDatum(plan.decided_at)}</dd>
        </>)}
        <dt className="text-[var(--j-blak-3)]">Deltagaren</dt>
        <dd className="m-0"><PlanBekraftelseRad plan={plan} /></dd>
      </dl>
      {/* RK40: ärende-/dossiernummer — matchning utan personnummer. */}
      {PLAN_PASS_KOLUMNER_FINNS && (
        <dl className="m-0 text-sm">
          <ArendenummerFalt plan={plan} regelverk={arLeverantor ? 'leverantor' : 'kommun'} onSparad={onPlanSparad} />
        </dl>
      )}
      {arLeverantor && <Rom2PlanFalt plan={plan} onPlanSparad={onPlanSparad} />}
      {!arLeverantor && (
        <div className="grid gap-1 text-sm" data-testid="rad-forsorjningshinder">
          <label htmlFor={`hinder-${plan.id}`} className="text-[var(--j-blak-3)]">Försörjningshinder</label>
          <select
            id={`hinder-${plan.id}`}
            className="w-full max-w-full min-h-[44px] sm:min-h-[36px] rounded-[var(--j-r-s)] border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)] px-2 py-1 text-sm"
            value={plan.forsorjningshinder ?? ''}
            disabled={sparar}
            onChange={(e) => onHinder(e.target.value as '' | Forsorjningshinder)}
          >
            <option value="">Inte angivet</option>
            {FORSORJNINGSHINDER.map((f) => <option key={f} value={f}>{FORSORJNINGSHINDER_ETIKETT[f]}</option>)}
          </select>
        </div>
      )}
      {plan.target_reason && (
        <p className="m-0 text-sm"><span className="text-[var(--j-blak-3)]">Motivering till veckomålet:</span> {plan.target_reason}</p>
      )}
      {plan.plan_text && (
        <p className="m-0 text-sm whitespace-pre-wrap border-t border-[var(--j-linje)] pt-3">{plan.plan_text}</p>
      )}
    </SpaltYta>
  )
}
