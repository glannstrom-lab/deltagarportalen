/**
 * AvtalskravKort — aktivitetsloggen mot avtalskravet (RM4).
 *
 * Rusta och matcha, FFU §4.1.1: minst 1 timme aktivitet per vecka månad 1–6
 * och 2 timmar per vecka månad 7–12, räknat från planens start. Minst 50 %
 * av aktiviteterna fysiska, per deltagare, i den periodiska rapporten.
 * Räkningen bor i `services/aktivitetslogg.ts`; kortet väljer månad, hämtar
 * planer och pass, och visar en rad per plan som var aktiv i månaden.
 *
 * Bara avslutade veckor bedöms — en påbörjad vecka kan inte ha uppfyllt
 * något. Ett värde utan underlag visar — och en rad om varför, aldrig 0.
 *
 * Kravet gäller leverantörer i Rusta och matcha. För kommunens
 * aktivitetskrav (KM-spåret) är måttet veckomålet i planen, inte det här.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { aktivitetsplanApi, type ActivityPlan, type ActivitySession } from '@/services/aktivitetApi'
import { avtalskravPerDeltagare, manadGranser, senasteSondag, veckogranser, type Avtalskrav } from '@/services/aktivitetslogg'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { fetchCachedConsultantParticipants } from '@/pages/consultant/consultantParticipantsQuery'
import { langtDatum } from './aktivitetEtiketter'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; nyckel: string; fel: string }
  | { status: 'klart'; nyckel: string; plans: ActivityPlan[]; sessions: ActivitySession[]; namn: Map<string, string> }

const MANAD_NAMN = ['', 'januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function manadEtikett(ym: string): string {
  const [ar, manad] = ym.split('-').map(Number)
  return `${MANAD_NAMN[manad]} ${ar}`
}

/** Innevarande månad och de tolv före, nyast först. */
function manadAlternativ(idag: Date): { value: string; label: string }[] {
  const ut: { value: string; label: string }[] = []
  for (let i = 0; i < 13; i++) {
    const d = new Date(idag.getFullYear(), idag.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    ut.push({ value, label: manadEtikett(value) })
  }
  return ut
}

function procent(andel: number): string {
  return `${Math.round(andel * 100)} %`
}

export function AvtalskravKort() {
  const queryClient = useQueryClient()
  const [hamtat, setHamtat] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)
  const alternativ = useMemo(() => manadAlternativ(new Date()), [])
  const [val, setVal] = useState(() => alternativ[0].value)

  const idag = formatLocalDate(new Date())
  const { period, harAvslutadVecka, hamtning } = useMemo(() => {
    const granser = manadGranser(val)
    // Bara avslutade veckor: klipp vid senaste söndag.
    const sistaSondag = senasteSondag(idag)
    const p = { from: granser.from, to: granser.to < sistaSondag ? granser.to : sistaSondag }
    return { period: p, harAvslutadVecka: p.from <= p.to, hamtning: veckogranser(granser) }
  }, [val, idag])

  // Ny månad = nytt underlag. Svaret bär sin nyckel, så förra månadens rader
  // visas aldrig medan nästa hämtas — utan att effekten sätter state själv.
  const nyckel = `${hamtning.from}:${hamtning.to}:${omgang}`
  const lage = useMemo<Lage>(
    () => (hamtat.status !== 'laddar' && hamtat.nyckel !== nyckel ? { status: 'laddar' } : hamtat),
    [hamtat, nyckel],
  )

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const [plans, sessions, deltagare] = await Promise.all([
          aktivitetsplanApi.listAll(),
          aktivitetsplanApi.listSessionsBetween(hamtning.from, hamtning.to),
          fetchCachedConsultantParticipants(queryClient).catch(() => []),
        ])
        if (!aktiv) return
        const namn = new Map<string, string>()
        for (const d of deltagare) {
          namn.set(d.participant_id, `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim())
        }
        setHamtat({ status: 'klart', nyckel, plans, sessions, namn })
      } catch (err) {
        if (aktiv) setHamtat({ status: 'fel', nyckel, fel: err instanceof Error ? err.message : 'Aktivitetsloggen kunde inte hämtas.' })
      }
    })()
    return () => { aktiv = false }
  }, [hamtning.from, hamtning.to, omgang, nyckel, queryClient])

  const rader = useMemo(() => {
    if (lage.status !== 'klart' || !harAvslutadVecka) return []
    return lage.plans
      .map((p) => ({ plan: p, krav: avtalskravPerDeltagare(p, lage.sessions, period) }))
      .filter((r) => r.krav.veckorTotalt > 0)
      .map((r) => ({ ...r, namn: lage.namn.get(r.plan.participant_id) || `Deltagare ${r.plan.participant_id.slice(0, 8)}` }))
      .sort((a, b) => a.namn.localeCompare(b.namn, 'sv') || a.plan.start_date.localeCompare(b.plan.start_date))
  }, [lage, period, harAvslutadVecka])

  const flerPlanerForSamma = useMemo(() => {
    const antal = new Map<string, number>()
    for (const r of rader) antal.set(r.plan.participant_id, (antal.get(r.plan.participant_id) ?? 0) + 1)
    return antal
  }, [rader])

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Aktivitetsloggen mot avtalskravet</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Rusta och matcha, FFU §4.1.1: timkravet per vecka och andelen fysiska aktiviteter, per deltagare.
          </p>
        </div>
        <ClipboardList className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <Select
          id="avtalskrav-manad"
          label="Månad"
          options={alternativ}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <p className="text-sm text-stone-500 dark:text-stone-400 sm:col-span-3">
          {harAvslutadVecka
            ? <>Avslutade veckor {langtDatum(period.from)} – {langtDatum(period.to)}</>
            : <>Ingen vecka i {manadEtikett(val)} är avslutad än.</>}
        </p>
      </div>

      {lage.status === 'laddar' && <LoadingState message="Räknar aktivitetsloggen…" size="sm" />}
      {lage.status === 'fel' && (
        <ErrorState title="Aktivitetsloggen kunde inte hämtas" message={lage.fel} onRetry={() => setOmgang((n) => n + 1)} />
      )}

      {lage.status === 'klart' && (
        <>
          {rader.length === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-300" role="status">
              {harAvslutadVecka
                ? <>Ingen plan var aktiv i en avslutad vecka i {manadEtikett(val)} — underlaget visar <span aria-hidden="true">—</span><span className="sr-only">inget värde</span>.</>
                : <>Bedömningen görs när första veckan i månaden är slut.</>}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700">
                    <th className="py-2 pr-3 font-medium">Deltagare</th>
                    <th className="py-2 px-3 font-medium text-right">Veckor med uppfyllt timkrav</th>
                    <th className="py-2 px-3 font-medium text-right">Andel fysiska</th>
                    <th className="py-2 pl-3 font-medium">Krav just nu</th>
                  </tr>
                </thead>
                <tbody>
                  {rader.map(({ plan, krav, namn }) => (
                    <AvtalskravRad
                      key={plan.id}
                      namn={namn}
                      plan={plan}
                      krav={krav}
                      visaPlanstart={(flerPlanerForSamma.get(plan.participant_id) ?? 0) > 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-prose">
            Närvarotid är pass markerade närvarande eller extern aktivitet. Fysiskt = aktivitetstypen arbetsplats eller ett ifyllt platsfält —
            portalen har ingen egen flagga för fysiskt/digitalt. Kravet gäller Rusta och matcha-avtalet; kommunens
            aktivitetskrav mäts mot planens veckomål.
          </p>
        </>
      )}
    </Card>
  )
}

function AvtalskravRad({ namn, plan, krav, visaPlanstart }: { namn: string; plan: ActivityPlan; krav: Avtalskrav; visaPlanstart: boolean }) {
  const allaVeckor = krav.veckorUppfyllda === krav.veckorTotalt
  const underHalften = krav.andelFysiska !== null && krav.andelFysiska < 0.5
  const senasteKrav = krav.veckor[krav.veckor.length - 1]
  const varning = 'text-amber-800 dark:text-amber-300 font-semibold'
  return (
    <tr className="border-b border-stone-100 dark:border-stone-800">
      <td className="py-2 pr-3 text-stone-800 dark:text-stone-100">
        {namn}
        {visaPlanstart && <span className="text-stone-500 dark:text-stone-400"> · plan från {langtDatum(plan.start_date)}</span>}
      </td>
      <td className={`py-2 px-3 text-right tabular-nums ${allaVeckor ? '' : varning}`}>
        {krav.veckorUppfyllda} av {krav.veckorTotalt}
        {!allaVeckor && <span className="sr-only"> — timkravet är inte uppfyllt alla veckor</span>}
      </td>
      <td className={`py-2 px-3 text-right tabular-nums ${underHalften ? varning : ''}`}>
        {krav.andelFysiska === null ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">inget närvaropass i perioden</span>
          </>
        ) : (
          <>
            {procent(krav.andelFysiska)}
            <span className="text-stone-500 dark:text-stone-400 font-normal"> ({krav.passFysiska} av {krav.passNarvaro} pass)</span>
            {underHalften && <span className="sr-only"> — under 50 %</span>}
          </>
        )}
      </td>
      <td className="py-2 pl-3 text-stone-600 dark:text-stone-300">
        {senasteKrav ? `${senasteKrav.kravTimmar} h/vecka (månad ${senasteKrav.planManad})` : '—'}
      </td>
    </tr>
  )
}
