/**
 * GruppnarvaroPage — närvaro för ett helt pass på en skärm (RK36, rollspelet
 * 2026-09-27). Route: /consultant/pass/grupp?datum=&start=&slut=&titel=
 *
 * Nås från Dagens pass i Min dag ("Markera hela passet"). Utan valt pass visas
 * dagens gemensamma pass att välja bland; datumet går att byta.
 *
 * Ett grupppass = konsulentens egna pass med samma datum, tid och titel (se
 * lib/gruppnarvaro.ts). Urvalet är samma som Dagens pass — planer där den
 * inloggade är konsulent — så varje knapp som visas också får skriva (ST2).
 * Närvaron sätts per pass genom aktivitetsplanApi.markAttendance.
 *
 * Bara omarkerade pass kan markeras här. Ett redan markerat pass ändras på
 * deltagarsidan, där anteckning och intyg syns — ett massklick här får aldrig
 * skriva över en anteckning. "Ångra" finns för det som markerats på den här
 * skärmen (då vet vi att det inte fanns någon anteckning).
 *
 * Tre lägen: laddar / fel / klart. Konsulentvyn översätts inte (DESIGN.md §2).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Users } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { aktivitetsplanApi } from '@/services/aktivitetApi'
import { formatLocalDate, type Attendance } from '@/services/aktivitetSchema'
import { hamtaDagensPass, passStatus, NARVARO_ETIKETT, type PassIdag } from '@/lib/dagensPass'
import { gruppLank, gruppNyckel, grupperaPass, kanMarkerasNarvarandeIMassa } from '@/lib/gruppnarvaro'
import { fetchCachedConsultantParticipants } from './consultantParticipantsQuery'
import { langtDatum } from '@/components/consultant/aktivitetEtiketter'
import { cn } from '@/lib/utils'

type Lage = { status: 'laddar' } | { status: 'fel'; fel: string } | { status: 'klart' }

const VAL: readonly Attendance[] = ['present', 'absent_valid', 'absent_invalid', 'sick_certified']

export function GruppnarvaroPage() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const datum = params.get('datum') || formatLocalDate(new Date())
  const start = params.get('start')
  const slut = params.get('slut')
  const titel = params.get('titel')
  const valdNyckel = start && slut && titel ? gruppNyckel({ date: datum, start_time: start, end_time: slut, title: titel }) : null

  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [pass, setPass] = useState<PassIdag[]>([])
  const [namn, setNamn] = useState<Map<string, string>>(new Map())
  const [sparar, setSparar] = useState<Set<string>>(new Set())
  const [markeradeHar, setMarkeradeHar] = useState<Set<string>>(new Set())
  const [besked, setBesked] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)

  const ladda = useCallback(async () => {
    setLage({ status: 'laddar' })
    try {
      const [dagens, deltagare] = await Promise.all([
        hamtaDagensPass(datum),
        fetchCachedConsultantParticipants(queryClient).catch(() => []),
      ])
      const karta = new Map<string, string>()
      for (const d of deltagare as Array<{ participant_id: string; first_name?: string | null; last_name?: string | null; email?: string | null }>) {
        karta.set(d.participant_id, `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.email || '')
      }
      setNamn(karta)
      setPass(dagens)
      setLage({ status: 'klart' })
    } catch (e) {
      setLage({ status: 'fel', fel: e instanceof Error ? e.message : 'Passen kunde inte hämtas.' })
    }
  }, [datum, queryClient])

  useEffect(() => {
    void ladda()
  }, [ladda])

  const grupper = useMemo(() => grupperaPass(pass), [pass])
  const grupp = valdNyckel ? grupper.find((g) => g.nyckel === valdNyckel) ?? null : null
  const namnFor = (pid: string) => namn.get(pid) || 'Namn saknas'

  const satt = (id: string, pa: boolean, mangd: Set<string>) => {
    const ny = new Set(mangd)
    if (pa) ny.add(id)
    else ny.delete(id)
    return ny
  }

  const markera = async (p: PassIdag, attendance: Attendance | null): Promise<boolean> => {
    setSparar((s) => satt(p.id, true, s))
    try {
      const uppdaterad = await aktivitetsplanApi.markAttendance(p.id, { attendance })
      setPass((prev) => prev.map((x) => (x.id === p.id ? { ...x, attendance: uppdaterad.attendance } : x)))
      setMarkeradeHar((m) => satt(p.id, attendance !== null, m))
      return true
    } catch {
      return false
    } finally {
      setSparar((s) => satt(p.id, false, s))
    }
  }

  const enstaka = async (p: PassIdag, attendance: Attendance | null) => {
    setBesked(null)
    setFel(null)
    if (!(await markera(p, attendance))) setFel(`Närvaron för ${namnFor(p.participant_id)} kunde inte sparas. Försök igen.`)
  }

  const allaNarvarande = async () => {
    if (!grupp) return
    setBesked(null)
    setFel(null)
    const aktuella = grupp.pass.filter(kanMarkerasNarvarandeIMassa)
    const misslyckade: string[] = []
    // En i taget: ett fel på en deltagare stoppar inte resten, och varje fel namnges.
    for (const p of aktuella) {
      if (!(await markera(p, 'present'))) misslyckade.push(namnFor(p.participant_id))
    }
    const lyckade = aktuella.length - misslyckade.length
    if (lyckade > 0) setBesked(`${lyckade} ${lyckade === 1 ? 'deltagare markerad' : 'deltagare markerade'} som närvarande.`)
    if (misslyckade.length > 0) setFel(`Kunde inte spara för ${misslyckade.join(', ')}. Försök igen.`)
  }

  const antalMassa = grupp ? grupp.pass.filter(kanMarkerasNarvarandeIMassa).length : 0

  return (
    <div className="space-y-4">
      <Link to="/consultant" className="inline-flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300 hover:underline">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Till Översikt
      </Link>

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">Närvaro för ett helt pass</h2>
          </div>
          <label className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-2">
            Datum
            <input
              type="date"
              value={datum}
              onChange={(e) => e.target.value && setParams({ datum: e.target.value })}
              className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </label>
        </div>

        {lage.status === 'laddar' && <LoadingState message="Hämtar passen…" size="sm" />}
        {lage.status === 'fel' && <ErrorState title="Passen kunde inte hämtas" message={lage.fel} onRetry={() => void ladda()} />}

        {lage.status === 'klart' && !grupp && (
          <>
            {valdNyckel && (
              <p role="status" className="text-sm text-stone-600 dark:text-stone-300">
                Passet finns inte hos dina deltagare {langtDatum(datum)}. Välj ett av passen nedan.
              </p>
            )}
            {grupper.length === 0 ? (
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Inga pass {langtDatum(datum)}. Planerna finns under varje deltagares Aktivitet.
              </p>
            ) : (
              <ul className="space-y-2" aria-label={`Pass ${langtDatum(datum)}`}>
                {grupper.map((g) => (
                  <li key={g.nyckel}>
                    <Link to={gruppLank(g)} className="block p-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:underline">
                      <span className="font-medium text-sm text-stone-900 dark:text-stone-100">{g.title}</span>
                      <span className="block text-xs text-stone-600 dark:text-stone-400">
                        {g.start_time}–{g.end_time} · {g.pass.length} {g.pass.length === 1 ? 'deltagare' : 'deltagare'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {lage.status === 'klart' && grupp && (
          <>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">{grupp.title}</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {langtDatum(grupp.date)} · {grupp.start_time}–{grupp.end_time} · {grupp.pass.length} deltagare
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={() => void allaNarvarande()} disabled={antalMassa === 0 || sparar.size > 0}>
                Markera alla omarkerade som närvarande ({antalMassa})
              </Button>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-prose">
                Den som anmält frånvaro räknas inte in — den frånvaron bedömer du för sig. Ett redan markerat pass ändrar du på deltagarsidan.
              </p>
            </div>

            {besked && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{besked}</p>}
            {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}

            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {grupp.pass.map((p) => {
                const status = passStatus(p)
                const namnet = namnFor(p.participant_id)
                const upptagen = sparar.has(p.id)
                return (
                  <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/consultant/participants/${p.participant_id}`} className="font-medium text-sm text-stone-900 dark:text-stone-100 hover:underline">
                        {namnet}
                      </Link>
                      <p
                        className={cn(
                          'text-xs flex items-center gap-1',
                          status.ton === 'ok' && 'text-emerald-700 dark:text-emerald-400',
                          status.ton === 'varning' && 'text-amber-700 dark:text-amber-400',
                          status.ton === 'info' && 'text-sky-700 dark:text-sky-400',
                          status.ton === 'neutral' && 'text-stone-600 dark:text-stone-400',
                        )}
                      >
                        {p.attendance === 'present' && <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                        {status.text}
                      </p>
                    </div>
                    {p.attendance === null ? (
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Närvaro för ${namnet}`}>
                        {VAL.map((a) => (
                          <button
                            key={a}
                            type="button"
                            disabled={upptagen}
                            onClick={() => void enstaka(p, a)}
                            className="text-xs px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50"
                          >
                            {NARVARO_ETIKETT[a]}
                          </button>
                        ))}
                      </div>
                    ) : markeradeHar.has(p.id) ? (
                      <button
                        type="button"
                        disabled={upptagen}
                        onClick={() => void enstaka(p, null)}
                        className="text-xs text-stone-600 dark:text-stone-300 underline disabled:opacity-50"
                        aria-label={`Ångra markeringen för ${namnet}`}
                      >
                        Ångra
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
