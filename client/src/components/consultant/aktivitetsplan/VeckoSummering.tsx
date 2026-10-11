/**
 * VeckoSummering — veckan i en mening och en mätare, med reglerna bakom
 * "Så räknas det" (omtaget "Kvarter", steg 5, 2026-10-11).
 *
 * Förut stod fyra saldorutor, två regeltexter och en ampel i lika vikt
 * ovanför passen. Nu: hur många timmar anvisad aktivitet deltagaren varit
 * på, ampeln som ett ord, och det som behöver göras (kvittens, glapp).
 * Talen och reglerna finns kvar — en <details> bort.
 *
 * Mätaren räknar samma sak som ampeln: bekräftad närvaro i anvisade pass mot
 * den anvisade delen av veckomålet (RK1). Eget jobbsökande står på en egen
 * rad och räknas först när konsulenten kvitterat det (RK15). En vecka utan
 * pass visar `—` i talen, aldrig 0 %.
 */
import { StatusChip } from '@/components/ui/StatusChip'
import { formatLocalDate, anvisatVeckomal, veckoampel, veckomalMotSchema, veckosaldo } from '@/services/aktivitetSchema'
import { AMPEL_TEXT } from './veckodagar'
import { egetJobbsokSaldo } from '@/services/egenrapport'
import type { ActivityPlan, ActivitySession } from '@/services/aktivitetApi'
import { JobbsokTidKort } from '../JobbsokTidKort'
import { formatTimmar, omarkeradeText } from '../aktivitetEtiketter'

export function VeckoSummering({ plan, sessions, vecka, arLeverantor, participantId }: {
  plan: ActivityPlan
  sessions: readonly ActivitySession[]
  /** Måndag i veckan som visas. */
  vecka: string
  arLeverantor: boolean
  participantId: string
}) {
  const saldo = veckosaldo(sessions, vecka)
  const egetSaldo = egetJobbsokSaldo(sessions, vecka, formatLocalDate(new Date()))
  const anvisatMal = anvisatVeckomal(plan)
  const egetJobbsokPlan = Number(plan.jobsearch_hours_per_week) || 0
  const ampel = veckoampel(saldo, anvisatMal)
  // RK2: går målet ihop med veckans schema? Bara den anvisade delen varnas här.
  const glapp = ampel === 'inga_pass'
    ? null
    : veckomalMotSchema({ veckomal: Number(plan.weekly_hours_target) || 0, egetJobbsokPlan, anvisatSchema: saldo.planeradeTimmar, egetJobbsokSchema: saldo.jobbsokTimmar }).anvisat
  const andel = anvisatMal > 0 ? Math.min(1, saldo.narvaroTimmar / anvisatMal) : 0

  return (
    <section aria-labelledby={`summering-${vecka}`} className="grid gap-3" data-testid="vecko-summering">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h4 id={`summering-${vecka}`} className="m-0 text-base font-normal text-[var(--j-blak)]">
          {ampel === 'inga_pass'
            ? <span className="font-semibold">{AMPEL_TEXT.inga_pass.text}</span>
            : <><span className="font-semibold">{formatTimmar(saldo.narvaroTimmar)} av {formatTimmar(anvisatMal)}</span> anvisad aktivitet den här veckan</>}
        </h4>
        {ampel !== 'inga_pass' && (
          <span role="status"><StatusChip status={AMPEL_TEXT[ampel].status}>{AMPEL_TEXT[ampel].text}</StatusChip></span>
        )}
      </div>

      {ampel !== 'inga_pass' && (
        <div
          className="h-2.5 rounded-full bg-[var(--j-sankt)] overflow-hidden"
          role="img"
          aria-label={`${formatTimmar(saldo.narvaroTimmar)} bekräftad närvaro av ${formatTimmar(anvisatMal)} anvisad aktivitet`}
        >
          <div className="h-full rounded-full bg-[var(--s-narvarande-ikon)]" style={{ width: `${Math.round(andel * 100)}%` }} />
        </div>
      )}

      <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--j-blak-2)]">
        {egetJobbsokPlan > 0 || saldo.jobbsokTimmar > 0
          ? <span>Eget jobbsökande: {formatTimmar(egetSaldo.kvitteradeTimmar)} kvitterat av {formatTimmar(egetJobbsokPlan)} i planen</span>
          : null}
        {saldo.antalOgiltigFranvaro > 0 && (
          <span className="font-semibold text-[var(--s-ogiltig-text)]">
            {saldo.antalOgiltigFranvaro === 1 ? '1 pass ogiltig frånvaro' : `${saldo.antalOgiltigFranvaro} pass ogiltig frånvaro`}
          </span>
        )}
      </p>

      {egetSaldo.antalVantar > 0 && (
        <p className="m-0 text-sm rounded-[var(--j-r-m)] bg-[var(--s-vantar-bg)] text-[var(--s-vantar-text)] px-3 py-2" role="status" data-testid="vantar-kvittens">
          {egetSaldo.antalVantar} pass väntar på din kvittens
          {egetSaldo.vantarTimmar > 0 ? ` (varav ${formatTimmar(egetSaldo.vantarTimmar)} eget jobbsökande)` : ''} — deltagarens egen redovisning eller incheckning.
          Kvittera passet nedan när du stämt av det; först då räknas det.
        </p>
      )}
      {glapp && (
        <p className="m-0 text-sm rounded-[var(--j-r-m)] bg-[var(--s-vantar-bg)] text-[var(--s-vantar-text)] px-3 py-2" role="status">
          {glapp}
        </p>
      )}

      <details className="group text-sm text-[var(--j-blak-2)]">
        <summary className="cursor-pointer select-none font-semibold text-[var(--j-gran-text)] underline-offset-2 hover:underline min-h-[44px] sm:min-h-0 inline-flex items-center rounded-[var(--j-r-s)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]">
          Så räknas det
        </summary>
        <div className="mt-3 grid gap-3">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 m-0">
            <Saldotal etikett="Planerat anvisat" varde={ampel === 'inga_pass' ? '—' : `${formatTimmar(saldo.planeradeTimmar)} / ${formatTimmar(anvisatMal)}`} />
            <Saldotal etikett="Närvaro" varde={ampel === 'inga_pass' ? '—' : formatTimmar(saldo.narvaroTimmar)} />
            <Saldotal
              etikett="Eget jobbsökande, kvitterat"
              varde={ampel === 'inga_pass' && saldo.jobbsokTimmar === 0 ? '—' : formatTimmar(egetSaldo.kvitteradeTimmar)}
            />
            <Saldotal
              etikett="Ogiltig frånvaro"
              varde={ampel === 'inga_pass' ? '—' : saldo.antalOgiltigFranvaro === 0 ? 'Ingen' : `${saldo.antalOgiltigFranvaro} pass`}
              varning={saldo.antalOgiltigFranvaro > 0}
            />
          </dl>
          <p className="m-0">
            Veckomålet {formatTimmar(Number(plan.weekly_hours_target) || 0)} = {formatTimmar(anvisatMal)} anvisad aktivitet + {formatTimmar(egetJobbsokPlan)} eget jobbsökande.
            Mätaren jämför bekräftad närvaro i anvisade pass med den anvisade delen; eget jobbsökande är deltagarens egen redovisning och räknas inte in. Eget jobbsökande räknas som utfört först när du kvitterat det.
          </p>
          <p className="m-0">
            {arLeverantor
              ? 'Ogiltig frånvaro är underlag för avvikelserapporteringen till Arbetsförmedlingen enligt avtalet.'
              : 'Beslut om nedsättning fattas av socialnämnden, inte här. Ogiltig frånvaro är underlag till handläggaren.'}
            {saldo.antalOmarkerade > 0 && <span> {omarkeradeText(saldo.antalOmarkerade)}</span>}
          </p>
          {/* KM9: eget jobbsökande ur portalens data — deltagarens redovisning, inte kontroll. */}
          <JobbsokTidKort participantId={participantId} plan={plan} vecka={vecka} />
        </div>
      </details>
    </section>
  )
}

function Saldotal({ etikett, varde, varning }: { etikett: string; varde: string; varning?: boolean }) {
  return (
    <div className="rounded-[var(--j-r-s)] px-3 py-2" style={{ backgroundColor: varning ? 'var(--s-ogiltig-bg)' : 'var(--j-sankt)' }}>
      <dt className="text-xs text-[var(--j-blak-3)]">{etikett}</dt>
      <dd className="m-0 font-semibold tabular-nums" style={{ color: varning ? 'var(--s-ogiltig-text)' : 'var(--j-blak)' }}>{varde}</dd>
    </div>
  )
}
