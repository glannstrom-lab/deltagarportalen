/**
 * AvvikelserapportKort — leverantörens avvikelser per månad (RR28,
 * rollspelet 2026-09-27): datum, typ, orsak och om AF underrättats, enligt
 * FFU §4.4. Visas i stället för kommunens "Underlag till handläggaren /
 * socialnämnden", som är dolt för leverantörer (`regelverkForPlan`).
 *
 * Raderna räknas ur passen (services/avvikelserapport.ts). Portalen skickar
 * ingenting till Arbetsförmedlingen — det står på kortet. "Underrättad" är
 * konsulentens anteckning och finns först efter PENDING_20260927d.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useMemo, useState } from 'react'
import { AlertTriangle } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { aktivitetsplanApi, type ActivitySession } from '@/services/aktivitetApi'
import { avvikelseManader, avvikelserader, avvikelserSomText, omarkeradePasserade } from '@/services/avvikelserapport'
import { manadGranser } from '@/services/aktivitetslogg'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { PLAN_PASS_KOLUMNER_FINNS } from '@/services/planMarkning'
import { kortDatum } from './aktivitetEtiketter'

const MANAD = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function manadEtikett(ym: string): string {
  const [ar, m] = ym.split('-').map(Number)
  return `${MANAD[m - 1]} ${ar}`
}

export function AvvikelserapportKort({ planStart, sessions, onChanged, kolumnerFinns = PLAN_PASS_KOLUMNER_FINNS }: {
  planStart: string
  sessions: readonly ActivitySession[]
  onChanged: (s: ActivitySession) => void
  /** Injicerbar för test. */
  kolumnerFinns?: boolean
}) {
  const idag = formatLocalDate(new Date())
  const manader = useMemo(() => avvikelseManader(planStart, idag), [planStart, idag])
  const [manad, setManad] = useState(manader[0])
  const [sparar, setSparar] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [kopierat, setKopierat] = useState<'ja' | 'fel' | null>(null)

  const { from, to } = manadGranser(manad)
  const rader = avvikelserader(sessions, from, to)
  const okanda = omarkeradePasserade(sessions, from, to, idag)

  const vaxlaUnderrattad = async (sessionId: string, underrattad: boolean) => {
    setSparar(sessionId)
    setFel(null)
    try {
      onChanged(await aktivitetsplanApi.sattAfUnderrattad(sessionId, underrattad ? null : new Date().toISOString()))
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Underrättelsen kunde inte sparas')
    } finally {
      setSparar(null)
    }
  }

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(avvikelserSomText(rader, kolumnerFinns))
      setKopierat('ja')
    } catch {
      setKopierat('fel')
    }
  }

  return (
    <Card className="p-5 space-y-3" data-testid="avvikelserapport">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-stone-500" aria-hidden="true" />
            Avvikelser till Arbetsförmedlingen
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">FFU §4.4: datum, typ, orsak och om handläggaren på Arbetsförmedlingen underrättats.</p>
        </div>
        <div className="w-44">
          <Select id="avvikelse-manad" label="Månad" options={manader.map((m) => ({ value: m, label: manadEtikett(m) }))} value={manad} onChange={(e) => setManad(e.target.value)} />
        </div>
      </div>

      {rader.length === 0 ? (
        <p className="text-sm text-stone-600 dark:text-stone-300" role="status">Inga avvikelser registrerade i {manadEtikett(manad)}.</p>
      ) : (
        <ul className="space-y-2" aria-label={`Avvikelser i ${manadEtikett(manad)}`}>
          {rader.map((r) => (
            <li key={r.sessionId} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 text-sm">
              <p className="font-medium text-stone-900 dark:text-stone-100">{kortDatum(r.datum)} · {r.typ}</p>
              <p className="text-stone-600 dark:text-stone-300">{r.pass}</p>
              <p className="text-stone-700 dark:text-stone-200"><span className="text-stone-500">Orsak:</span> {r.orsak ?? <span className="text-stone-500">ingen antecknad — skriv den i passets anteckning</span>}</p>
              {kolumnerFinns && (
                <p className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={r.underrattad ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}>
                    {r.underrattad
                      ? `AF underrättad ${kortDatum(new Date(r.underrattad).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))}`
                      : 'AF inte underrättad'}
                  </span>
                  <button
                    type="button"
                    className="text-xs underline text-stone-600 dark:text-stone-300"
                    disabled={sparar !== null}
                    onClick={() => void vaxlaUnderrattad(r.sessionId, r.underrattad !== null)}
                  >
                    {r.underrattad ? 'Ångra' : 'Markera som underrättad'}
                  </button>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {okanda > 0 && (
        <p className="text-sm rounded-xl bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100 px-3 py-2" role="status">
          {okanda} {okanda === 1 ? 'passerat pass är' : 'passerade pass är'} inte markerade i {manadEtikett(manad)} — utfallet är okänt och finns inte med ovan.
        </p>
      )}
      {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" className="text-sm underline text-stone-700 dark:text-stone-200" onClick={() => void kopiera()}>
          {kopierat === 'ja' ? 'Kopierat' : 'Kopiera avvikelserna'}
        </button>
        {kopierat === 'fel' && <span role="alert" className="text-xs text-rose-700 dark:text-rose-300">Webbläsaren tillät inte kopiering — markera texten och kopiera den för hand.</span>}
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Portalen skickar ingenting till Arbetsförmedlingen. Avvikelserna rapporterar du själv i Arbetsförmedlingens system;
        {kolumnerFinns ? ' markera här när det är gjort.' : ' kopiera texten därifrån.'} Bara pass som verksamheten håller i och som du markerat räknas.
      </p>
    </Card>
  )
}
