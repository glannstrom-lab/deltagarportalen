/**
 * GruppnarvaroPage — närvaro för ett helt pass på en skärm (RK36, rollspelet
 * 2026-09-27; omtaget "Kvarter" steg 4, 2026-10-11).
 * Route: /consultant/pass/grupp?datum=&start=&slut=&titel=
 *
 * Nås från Dagens pass i Min dag. Utan valt pass visas dagens pass att välja
 * bland; datumet går att byta.
 *
 * Ett grupppass = konsulentens egna pass med samma datum, tid och titel (se
 * lib/gruppnarvaro.ts). Urvalet är samma som Dagens pass — planer där den
 * inloggade är konsulent — så varje val som visas också får skriva (ST2).
 *
 * Omtaget: en rad per deltagare med NarvaroVal. Deltagarens egen incheckning
 * och anmälda frånvaro ger ett FÖRSLAG som konsulenten bekräftar — "Bekräfta
 * alla förslag" är sidans primärknapp. Inget sparas utan konsulentens klick.
 * "Markera resten som närvarande" följer `kanMarkerasNarvarandeIMassa`: den
 * som anmält frånvaro räknas aldrig in.
 *
 * Bara omarkerade pass (och det som markerats här) kan ändras på den här
 * skärmen — se NarvaroRad. Tre lägen: laddar / fel / klart. Konsulentvyn
 * översätts inte (DESIGN.md §2).
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { KVARTER_FOKUS, NARVARO_STANDARDVAL, type NarvaroAlternativ } from '@/components/ui/kvarterStatus'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { formatLocalDate, parseLocalDate, type Attendance } from '@/services/aktivitetSchema'
import { hamtaDagensPass, type PassIdag } from '@/lib/dagensPass'
import {
  gruppLank,
  gruppNyckel,
  grupperaPass,
  narvaroForslag,
  restenNarvarande,
  type PassGrupp,
} from '@/lib/gruppnarvaro'
import { fetchCachedConsultantParticipants } from './consultantParticipantsQuery'
import { langtDatum } from '@/components/consultant/aktivitetEtiketter'
import { NarvaroRad } from '@/components/consultant/NarvaroRad'
import { useNarvaroMarkering } from '@/components/consultant/useNarvaroMarkering'
import { cn } from '@/lib/utils'

type Lage = { status: 'laddar' } | { status: 'fel'; fel: string } | { status: 'klart' }

const VECKODAG = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

function datumMedVeckodag(datum: string): string {
  return `${VECKODAG[parseLocalDate(datum).getDay()]} ${langtDatum(datum)}`
}

const antalDeltagare = (g: PassGrupp) => new Set(g.pass.map((p) => p.participant_id)).size

export interface GruppnarvaroPageProps {
  /** Kundtypens närvaroval. Standard: Här / Giltig / Ogiltig / Sjuk. */
  alternativ?: readonly NarvaroAlternativ[]
}

export function GruppnarvaroPage({ alternativ = NARVARO_STANDARDVAL }: GruppnarvaroPageProps = {}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const datum = params.get('datum') || formatLocalDate(new Date())
  const start = params.get('start')
  const slut = params.get('slut')
  const titel = params.get('titel')
  const valdNyckel = start && slut && titel ? gruppNyckel({ date: datum, start_time: start, end_time: slut, title: titel }) : null

  const [pass, setPass] = useState<PassIdag[]>([])
  const [namn, setNamn] = useState<Map<string, string>>(new Map())
  // Vilket datum och vilket försök som senast blev klart. Läget härleds ur det,
  // så ett nytt datum eller "Försök igen" är "laddar" utan setState i effekten.
  const [forsok, setForsok] = useState(0)
  const [klar, setKlar] = useState<{ datum: string; forsok: number; fel: string | null } | null>(null)

  useEffect(() => {
    let aktiv = true
    Promise.all([
      hamtaDagensPass(datum),
      fetchCachedConsultantParticipants(queryClient).catch(() => []),
    ])
      .then(([dagens, deltagare]) => {
        if (!aktiv) return
        const karta = new Map<string, string>()
        for (const d of deltagare as Array<{ participant_id: string; first_name?: string | null; last_name?: string | null; email?: string | null }>) {
          karta.set(d.participant_id, `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.email || '')
        }
        setNamn(karta)
        setPass(dagens)
        setKlar({ datum, forsok, fel: null })
      })
      .catch((e: unknown) => {
        if (aktiv) setKlar({ datum, forsok, fel: e instanceof Error ? e.message : 'Passen kunde inte hämtas.' })
      })
    return () => {
      aktiv = false
    }
  }, [datum, forsok, queryClient])

  const lage: Lage = !klar || klar.datum !== datum || klar.forsok !== forsok
    ? { status: 'laddar' }
    : klar.fel !== null
      ? { status: 'fel', fel: klar.fel }
      : { status: 'klart' }
  const ladda = () => setForsok((n) => n + 1)

  // Slipningen 2026-10-11 (kommun A11): deltagarens eget jobbsökande kvitteras, det
  // markeras inte på plats — det hör inte hemma i en närvarolista. Gemensamma pass
  // (två deltagare eller fler) först, ensamma pass efter.
  const grupper = useMemo(() => {
    const alla = grupperaPass(pass.filter((p) => p.activity_type !== 'jobsearch_own'))
    return [...alla.filter((g) => antalDeltagare(g) >= 2), ...alla.filter((g) => antalDeltagare(g) < 2)]
  }, [pass])
  const grupp = valdNyckel ? grupper.find((g) => g.nyckel === valdNyckel) ?? null : null
  const namnFor = (pid: string) => namn.get(pid) || 'Namn saknas'

  const markering = useNarvaroMarkering({
    namnFor,
    onSparat: (id, attendance) => setPass((prev) => prev.map((x) => (x.id === id ? { ...x, attendance } : x))),
  })

  const forslagen = grupp
    ? grupp.pass.flatMap((p) => {
        const f = narvaroForslag(p)
        return f ? [{ pass: p, varde: f.varde }] : []
      })
    : []
  const resten = grupp ? restenNarvarande(grupp.pass) : []
  const markerade = grupp ? grupp.pass.filter((p) => p.attendance !== null).length : 0

  const bekraftaForslagen = () =>
    void markering.markeraFlera(forslagen, (n) => `${n} ${n === 1 ? 'förslag bekräftat' : 'förslag bekräftade'}.`)
  const markeraResten = () =>
    void markering.markeraFlera(
      resten.map((p) => ({ pass: p, varde: 'present' as Attendance })),
      (n) => `${n} ${n === 1 ? 'deltagare markerad' : 'deltagare markerade'} som närvarande.`,
    )

  return (
    <div className="grid gap-4 text-[var(--j-blak)]">
      <Link
        to="/consultant"
        className={cn('inline-flex items-center gap-1.5 justify-self-start text-[0.9375rem] font-semibold text-[var(--j-gran-text)] hover:underline rounded-[var(--j-r-s)] min-h-[44px] sm:min-h-0', KVARTER_FOKUS)}
      >
        <KvarterIkon namn="tillbaka" size={18} /> Till Översikt
      </Link>

      <section
        aria-labelledby="gruppnarvaro-rubrik"
        className="bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-m)] overflow-hidden"
      >
        {lage.status === 'laddar' && (
          <div className="p-5">
            <h2 id="gruppnarvaro-rubrik" className="sr-only">Närvaro per pass</h2>
            <LoadingState message="Hämtar passen…" size="sm" />
          </div>
        )}
        {lage.status === 'fel' && (
          <div className="p-5">
            <h2 id="gruppnarvaro-rubrik" className="sr-only">Närvaro per pass</h2>
            <ErrorState title="Passen kunde inte hämtas" message={lage.fel} onRetry={() => ladda()} />
          </div>
        )}

        {lage.status === 'klart' && !grupp && (
          <>
            <header className="flex flex-wrap items-end justify-between gap-3 px-4 sm:px-[18px] py-4 border-b border-[var(--j-linje)]">
              <div className="grid gap-1">
                <h2 id="gruppnarvaro-rubrik" className="m-0 font-rubrik text-[1.375rem] leading-tight font-bold">
                  Närvaro per pass
                </h2>
                <p className="m-0 text-[0.9375rem] text-[var(--j-blak-2)]">Välj ett pass och markera alla på en skärm.</p>
              </div>
              <div className="grid gap-1 text-[0.8125rem] font-semibold text-[var(--j-blak-2)]">
                <label htmlFor="gruppnarvaro-datum">Datum</label>
                <input
                  id="gruppnarvaro-datum"
                  type="date"
                  value={datum}
                  onChange={(e) => e.target.value && setParams({ datum: e.target.value })}
                  className={cn('min-h-[44px] px-3 rounded-[var(--j-r-s)] border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)] text-base font-normal', KVARTER_FOKUS)}
                />
              </div>
            </header>
            {valdNyckel && (
              <p role="status" className="m-0 px-4 sm:px-[18px] pt-4 text-[0.9375rem] text-[var(--j-blak-2)]">
                Passet finns inte hos dina deltagare {langtDatum(datum)}. Välj ett av passen nedan.
              </p>
            )}
            {grupper.length === 0 ? (
              <p className="m-0 px-4 sm:px-[18px] py-5 text-[0.9375rem] text-[var(--j-blak-2)]">
                Inga pass {langtDatum(datum)}. Planerna finns under varje deltagares Aktivitet.
              </p>
            ) : (
              <ul className="list-none m-0 p-0" aria-label={`Pass ${langtDatum(datum)}`}>
                {grupper.map((g) => {
                  const antal = g.pass.length
                  const klara = g.pass.filter((p) => p.attendance !== null).length
                  const forslag = g.pass.filter((p) => narvaroForslag(p)).length
                  return (
                    <li key={g.nyckel} className="border-b border-[var(--j-linje)] last:border-b-0">
                      <Link
                        to={gruppLank(g)}
                        className={cn(
                          'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 px-4 sm:px-[18px] py-3.5 hover:bg-[var(--j-sankt)]',
                          KVARTER_FOKUS,
                          'focus-visible:outline-offset-[-3px]',
                        )}
                      >
                        <span className="font-rubrik text-lg font-bold tabular-nums w-14">{g.start_time}</span>
                        <span className="grid gap-0.5 min-w-0">
                          <span className="text-base font-semibold">{g.title}</span>
                          <span className="text-[0.875rem] text-[var(--j-blak-2)]">
                            {g.start_time}–{g.end_time} · {antal} deltagare
                            {klara === antal ? ' · alla markerade' : klara > 0 ? ` · ${klara} av ${antal} markerade` : ''}
                            {forslag > 0 ? ` · ${forslag} ${forslag === 1 ? 'förslag' : 'förslag'} att bekräfta` : ''}
                          </span>
                        </span>
                        <KvarterIkon namn="pil" size={20} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {lage.status === 'klart' && grupp && (
          <>
            <header className="grid gap-3 px-4 sm:px-[18px] py-4 border-b border-[var(--j-linje)]">
              <div className="grid gap-1">
                <h2 id="gruppnarvaro-rubrik" className="m-0 font-rubrik text-[1.375rem] sm:text-[1.45rem] leading-tight font-bold">
                  {grupp.title}
                </h2>
                <p className="m-0 text-[0.9375rem] text-[var(--j-blak-2)]">
                  {datumMedVeckodag(grupp.date)} · {grupp.start_time}–{grupp.end_time} · {grupp.pass.length} deltagare
                </p>
              </div>
              {(forslagen.length > 0 || resten.length > 0) && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {forslagen.length > 0 && (
                    <Button ton="kvarter" variant="primary" onClick={bekraftaForslagen} disabled={markering.upptagen} className="w-full sm:w-auto">
                      Bekräfta alla förslag ({forslagen.length})
                    </Button>
                  )}
                  {resten.length > 0 && (
                    <Button
                      ton="kvarter"
                      variant={forslagen.length > 0 ? 'secondary' : 'primary'}
                      onClick={markeraResten}
                      disabled={markering.upptagen}
                      className="w-full sm:w-auto"
                    >
                      Markera resten som närvarande ({resten.length})
                    </Button>
                  )}
                </div>
              )}
              <p className="m-0 text-[0.8125rem] leading-5 text-[var(--j-blak-3)] max-w-prose">
                Förslagen kommer från deltagarnas egen incheckning och anmälan. Inget sparas förrän du bekräftar. Den som
                anmält frånvaro räknas aldrig in i resten.
              </p>
            </header>

            {markering.besked && (
              <p role="status" className="m-0 px-4 sm:px-[18px] pt-3 text-[0.9375rem] font-semibold text-[var(--s-narvarande-text)]">
                {markering.besked}
              </p>
            )}
            {markering.fel && (
              <p role="alert" className="m-0 px-4 sm:px-[18px] pt-3 text-[0.9375rem] font-semibold text-[var(--s-ogiltig-text)]">
                {markering.fel}
              </p>
            )}

            <ul className="list-none m-0 p-0" aria-label={`Deltagare på ${grupp.title}`}>
              {grupp.pass.map((p) => (
                <NarvaroRad
                  key={p.id}
                  pass={p}
                  namn={namnFor(p.participant_id)}
                  alternativ={alternativ}
                  sparar={markering.sparar.has(p.id)}
                  markeradHar={markering.markeradeHar.has(p.id)}
                  onValj={(v) => markering.valj(p, v)}
                  onAngra={() => void markering.markera(p, null)}
                  utkast={markering.utkast.get(p.id)}
                  onOppna={() => navigate(`/consultant/participants/${p.participant_id}`)}
                />
              ))}
            </ul>

            <p
              aria-live="polite"
              className="m-0 px-4 sm:px-[18px] py-3 border-t border-[var(--j-linje)] bg-[var(--j-sankt)] text-[0.875rem] text-[var(--j-blak-2)]"
            >
              {markerade === grupp.pass.length ? 'Alla är markerade.' : `${markerade} av ${grupp.pass.length} markerade.`}
            </p>
          </>
        )}
      </section>
    </div>
  )
}
