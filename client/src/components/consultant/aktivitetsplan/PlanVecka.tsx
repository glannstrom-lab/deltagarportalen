/**
 * PlanVecka — planen som en vecka (omtaget "Kvarter", steg 5, 2026-10-11).
 *
 * Överst veckan som fem dagar (Veckoremsa, stor), sedan veckan i en mening
 * med reglerna bakom "Så räknas det", sedan passen dag för dag med närvaron
 * direkt på raden. En vecka utan pass säger det en gång, inte tre.
 */
import { Plus } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Veckoremsa } from '@/components/ui/Veckoremsa'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { addDays, formatLocalDate, isoWeekday, veckansMandag } from '@/services/aktivitetSchema'
import type { ActivityPlan, ActivitySession } from '@/services/aktivitetApi'
import { VECKODAG_LANG, kortDatum, veckoRubrik } from '../aktivitetEtiketter'
import { PassRad } from './PassRad'
import { VeckoSummering } from './VeckoSummering'
import { helgpass, veckansDagar } from './veckodagar'
import { STATUS_ORD_LEVERANTOR, type Regelverk } from '../franvaroFakta'

export function PlanVecka({ plan, sessions, vecka, onVecka, participantId, participantName, arLeverantor, regelverk = null, onLaggTill, onChanged, onLadda, onSerieAndrad }: {
  plan: ActivityPlan
  sessions: readonly ActivitySession[]
  /** Måndag i veckan som visas. */
  vecka: string
  onVecka: (mandag: string) => void
  participantId: string
  participantName: string
  arLeverantor: boolean
  /** KSL21: planens regelverk (null medan medlemskapen laddar — då kommunens val, som förut). */
  regelverk?: Regelverk | null
  onLaggTill: () => void
  onChanged: (s: ActivitySession) => void
  onLadda: () => void
  onSerieAndrad: (antal: number) => void
}) {
  const idag = formatLocalDate(new Date())
  const veckansPass = sessions.filter((s) => s.date >= vecka && s.date <= addDays(vecka, 6))
  const dagar = Array.from(new Set(veckansPass.map((s) => s.date))).sort()
  const helg = helgpass(sessions, vecka)

  return (
    <section
      aria-labelledby={`vecka-${vecka}`}
      className="grid gap-5 p-5 sm:p-6 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-l)] text-[var(--j-blak)]"
      data-testid="plan-vecka"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`vecka-${vecka}`} className="m-0 font-rubrik text-[1.25rem] font-bold">{veckoRubrik(vecka)}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => onVecka(addDays(vecka, -7))} aria-label="Föregående vecka">
            <KvarterIkon namn="tillbaka" size={20} />
          </Button>
          <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => onVecka(addDays(vecka, 7))} aria-label="Nästa vecka">
            <KvarterIkon namn="pil" size={20} />
          </Button>
          {vecka !== veckansMandag(idag) && (
            <Button ton="kvarter" variant="tertiary" size="sm" onClick={() => onVecka(veckansMandag(idag))}>Idag</Button>
          )}
          <Button ton="kvarter" variant="secondary" size="sm" onClick={onLaggTill} leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}>
            Lägg till pass
          </Button>
        </div>
      </header>

      <Veckoremsa
        storlek="stor"
        rubrik={`Veckan för ${participantName}`}
        dagar={veckansDagar(sessions, vecka, idag)}
        idag={idag}
        statusOrd={regelverk === 'leverantor' ? STATUS_ORD_LEVERANTOR : undefined}
      />
      {helg > 0 && (
        <p className="m-0 -mt-2 text-sm text-[var(--j-blak-3)]">
          {helg === 1 ? 'Ett pass ligger på helgen' : `${helg} pass ligger på helgen`} — det står i listan nedan.
        </p>
      )}

      <VeckoSummering plan={plan} sessions={sessions} vecka={vecka} arLeverantor={arLeverantor} participantId={participantId} />

      {dagar.length > 0 && (
        <div className="grid gap-5 border-t border-[var(--j-linje)] pt-4">
          {dagar.map((datum) => (
            <section key={datum} aria-labelledby={`dag-${datum}`}>
              <h4
                id={`dag-${datum}`}
                className="m-0 mb-1 text-[0.8125rem] font-bold uppercase tracking-[0.06em]"
                style={{ color: datum === idag ? 'var(--j-gran-text)' : 'var(--j-blak-3)' }}
              >
                {VECKODAG_LANG[isoWeekday(datum)]} {kortDatum(datum)}{datum === idag ? ' · idag' : ''}
              </h4>
              <ul className="m-0 p-0 list-none">
                {veckansPass.filter((s) => s.date === datum).map((s) => (
                  <PassRad
                    key={s.id}
                    session={s}
                    allaPass={sessions}
                    visaMarkning={arLeverantor}
                    regelverk={regelverk}
                    onChanged={onChanged}
                    onRemoved={onLadda}
                    onSerieAndrad={onSerieAndrad}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
