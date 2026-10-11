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
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { SpaltYta } from '../SpaltYta'
import { cn } from '@/lib/utils'
import { formatLocalDate } from '@/services/aktivitetSchema'
import {
  FORSORJNINGSHINDER,
  FORSORJNINGSHINDER_ETIKETT,
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
      </dl>
      {/* RK40: ärende-/dossiernummer — matchning utan personnummer. */}
      {PLAN_PASS_KOLUMNER_FINNS && (
        <dl className="m-0 text-sm">
          <ArendenummerFalt plan={plan} regelverk={arLeverantor ? 'leverantor' : 'kommun'} onSparad={onPlanSparad} />
        </dl>
      )}
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
