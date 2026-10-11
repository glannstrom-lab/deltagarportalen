/**
 * VeckanKort — deltagarens vecka överst på Översikt (omtaget "Kvarter", steg 5).
 *
 * Fem dagar med status, en mening om timmarna, och en väg in i planen. Det
 * är det konsulenten ska se först — också på mobilen, före allt annat.
 * Tre lägen: laddar (ingenting påstås), fel (felet i ord), klart.
 */
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { Veckoremsa } from '@/components/ui/Veckoremsa'
import { anvisatVeckomal, formatLocalDate, veckansMandag, veckoampel, veckosaldo } from '@/services/aktivitetSchema'
import { formatTimmar, veckoRubrik } from '../aktivitetEtiketter'
import { AMPEL_TEXT, passStatus, veckansDagar } from './veckodagar'
import type { PlanLage } from './useAktivitetsplan'

export function VeckanKort({ lage, participantName, onOppnaPlan, onForsokIgen }: {
  lage: PlanLage
  participantName: string
  /** Öppnar Aktivitet-fliken. */
  onOppnaPlan: () => void
  onForsokIgen: () => void
}) {
  const idag = formatLocalDate(new Date())
  const mandag = veckansMandag(idag)

  let innehall: React.ReactNode
  if (lage.status === 'laddar') {
    innehall = <p className="sr-only" role="status">Hämtar veckan</p>
  } else if (lage.status === 'fel') {
    innehall = (
      <p className="m-0 text-sm text-[var(--s-ogiltig-text)]">
        Veckan kunde inte hämtas.{' '}
        <button type="button" className="font-semibold underline underline-offset-2" onClick={onForsokIgen}>Försök igen</button>
      </p>
    )
  } else if (!lage.plan) {
    innehall = (
      <div className="grid gap-3 justify-items-start">
        <p className="m-0 text-[0.9375rem] text-[var(--j-blak-2)]">
          {participantName} har ingen aktivitetsplan än. Med en plan syns veckan här, dag för dag.
        </p>
        <Button ton="kvarter" variant="secondary" size="sm" onClick={onOppnaPlan}>Skapa en plan under Aktivitet</Button>
      </div>
    )
  } else {
    const { plan, sessions } = lage
    const saldo = veckosaldo(sessions, idag)
    const anvisatMal = anvisatVeckomal(plan)
    const ampel = veckoampel(saldo, anvisatMal)
    const attMarkera = sessions.filter((s) => s.date >= mandag && s.date <= idag && passStatus(s, idag) === 'vantar').length
    innehall = (
      <div className="grid gap-4">
        <Veckoremsa storlek="stor" rubrik={`Veckan för ${participantName}`} dagar={veckansDagar(sessions, idag, idag)} idag={idag} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[0.9375rem] text-[var(--j-blak-2)]">
            {ampel === 'inga_pass'
              ? 'Inga pass inlagda den här veckan.'
              : <><span className="font-semibold text-[var(--j-blak)]">{formatTimmar(saldo.narvaroTimmar)} av {formatTimmar(anvisatMal)}</span> anvisad aktivitet bekräftad</>}
            {attMarkera > 0 && <> · {attMarkera === 1 ? 'ett pass väntar på din markering' : `${attMarkera} pass väntar på din markering`}</>}
          </p>
          {ampel !== 'inga_pass' && <StatusChip status={AMPEL_TEXT[ampel].status}>{AMPEL_TEXT[ampel].text}</StatusChip>}
        </div>
        <div>
          <Button ton="kvarter" variant="secondary" size="sm" onClick={onOppnaPlan}>Öppna planen och markera närvaro</Button>
        </div>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="veckan-rubrik"
      className="grid gap-4 p-5 sm:p-6 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-l)] text-[var(--j-blak)]"
      data-testid="veckan-kort"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="veckan-rubrik" className="m-0 font-rubrik text-[1.25rem] font-bold">Den här veckan</h2>
        <span className="text-sm text-[var(--j-blak-3)]">{veckoRubrik(mandag)}</span>
      </div>
      {innehall}
    </section>
  )
}
