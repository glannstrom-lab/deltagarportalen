/**
 * PeriodiskRapportUnderlag — underlag för den periodiska rapporten (RM6/NF2).
 *
 * Per deltagare och valfritt datumintervall (månad räcker inte: rapportperioden
 * i avtalet är inte belagd i repot, och en plan kan börja mitt i en månad).
 * Fälten kopieras ett och ett för att klistras in i Mina sidor för fristående
 * aktörer. Portalen skickar ingenting till Arbetsförmedlingen, och
 * fältordningen är inte verifierad mot AF:s formulär — det står i rutan.
 *
 * Hämtar först när konsulenten trycker "Ta fram underlag". Svenska literaler
 * (konsulentvyn översätts inte, DESIGN.md §2).
 */

import { useState } from 'react'
import { aktivitetsplanApi, type ActivityPlan } from '@/services/aktivitetApi'
import { hamtaMotenIPeriod } from '@/services/moteskadens'
import { allaFaltSomText, faltSomText, kontrolleraPeriod, sammanstallPeriodiskRapport, type PeriodiskRapport } from '@/services/periodiskRapport'
import { laddaNerPeriodiskRapportPdf } from '@/services/periodiskRapportPdf'

interface Props {
  plans: readonly ActivityPlan[]
  namn: (plan: ActivityPlan) => string
  /** Förvalt intervall, `YYYY-MM-DD`. */
  forvaltFran: string
  forvaltTill: string
}

export function PeriodiskRapportUnderlag({ plans, namn, forvaltFran, forvaltTill }: Props) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? '')
  const [from, setFrom] = useState(forvaltFran)
  const [to, setTo] = useState(forvaltTill)
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [rapport, setRapport] = useState<{ namn: string; r: PeriodiskRapport; motenSaknas: boolean } | null>(null)
  const [kopierat, setKopierat] = useState<string | null>(null)

  const plan = plans.find((p) => p.id === planId)

  const taFram = async () => {
    if (!plan) return
    const periodFel = kontrolleraPeriod(from, to)
    if (periodFel) { setFel(periodFel); return }
    setLaddar(true)
    setFel(null)
    setKopierat(null)
    try {
      const [pass, moten] = await Promise.all([
        aktivitetsplanApi.listSessionsBetween(from, to),
        hamtaMotenIPeriod(from, to).catch(() => null),
      ])
      setRapport({ namn: namn(plan), r: sammanstallPeriodiskRapport(plan, pass, moten ?? [], { from, to }), motenSaknas: moten === null })
    } catch (e) {
      setRapport(null)
      setFel(e instanceof Error ? e.message : 'Underlaget kunde inte tas fram.')
    } finally {
      setLaddar(false)
    }
  }

  const kopiera = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setKopierat(id) } catch { setFel('Webbläsaren tillät inte kopiering — markera texten och kopiera den för hand.') }
  }

  if (plans.length === 0) return null

  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3" aria-labelledby="periodrapport-rubrik" data-testid="periodrapport">
      <h4 id="periodrapport-rubrik" className="font-semibold text-stone-900 dark:text-stone-100">Underlag för periodisk rapport</h4>
      <p className="text-xs text-stone-600 dark:text-stone-300 max-w-prose">
        Välj deltagare och datumintervall. Underlaget är <strong>inte</strong> den periodiska rapporten, och
        <strong> fältordningen är inte verifierad mot Arbetsförmedlingens formulär</strong> — kontrollera mot Mina sidor
        innan du för över. Frånvaro redovisas som fakta (anmäld i förväg eller inte), aldrig som godtagbar eller inte.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <label className="text-xs text-stone-600 dark:text-stone-300 flex flex-col gap-1">
          Deltagare
          <select className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-2 text-sm" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => <option key={p.id} value={p.id}>{namn(p)} (plan från {p.start_date})</option>)}
          </select>
        </label>
        <label className="text-xs text-stone-600 dark:text-stone-300 flex flex-col gap-1">
          Från
          <input type="date" className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs text-stone-600 dark:text-stone-300 flex flex-col gap-1">
          Till
          <input type="date" className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="rounded-lg bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 px-3 py-2 text-sm" disabled={laddar} onClick={() => void taFram()}>
          {laddar ? 'Räknar…' : 'Ta fram underlag'}
        </button>
      </div>
      {fel && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{fel}</p>}

      {rapport && (
        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-4 space-y-3" data-testid="periodrapport-resultat">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {rapport.namn}, {rapport.r.period.from} – {rapport.r.period.to} ({rapport.r.dagar} dagar)
            </p>
            <div className="flex gap-3 text-sm">
              <button type="button" className="underline" onClick={() => void kopiera('allt', allaFaltSomText(rapport.namn, rapport.r))}>
                {kopierat === 'allt' ? 'Kopierat' : 'Kopiera allt'}
              </button>
              <button type="button" className="underline" onClick={() => void laddaNerPeriodiskRapportPdf(rapport.namn, rapport.r)}>Ladda ner PDF</button>
            </div>
          </div>
          {rapport.motenSaknas && (
            <p role="status" className="text-xs text-rose-700 dark:text-rose-300">Mötena kunde inte hämtas — fältet för möten är inte komplett.</p>
          )}
          <dl className="space-y-3">
            {rapport.r.falt.map((f) => (
              <div key={f.id}>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-xs font-medium text-stone-600 dark:text-stone-300">{f.etikett}</dt>
                  <button type="button" className="text-xs underline text-stone-600 dark:text-stone-300" aria-label={`Kopiera ${f.etikett.toLowerCase()}`} onClick={() => void kopiera(f.id, faltSomText(f))}>
                    {kopierat === f.id ? 'Kopierat' : 'Kopiera'}
                  </button>
                </div>
                <dd className="text-sm text-stone-800 dark:text-stone-100 whitespace-pre-wrap tabular-nums">{f.text}</dd>
                {f.kalla.length > 0 && (
                  <details className="text-xs text-stone-500 dark:text-stone-400">
                    <summary className="cursor-pointer">Källa: {f.kalla.length} {f.kalla.length === 1 ? 'rad' : 'rader'}</summary>
                    <ul className="list-disc pl-5">{f.kalla.map((k, i) => <li key={i}>{k}</li>)}</ul>
                  </details>
                )}
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
