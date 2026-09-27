/**
 * PlatsPassDialog — lägg in en plats från Platser som arbetsplatspass i
 * planen (RK37, rollspelet 2026-09-27), så att timmarna där räknas i
 * veckosaldot och avtalsloggen.
 *
 * Veckodagarna väljs av konsulenten — Platsens schemafält är fritext och
 * tolkas inte. Perioden förslås ur platsens och planens datum
 * (services/passSerie). Passen får platsens namn som plats, så
 * avstämningen känner igen dem även före migrationen; efter den bär de
 * dessutom platsens id.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { aktivitetsplanApi } from '@/services/aktivitetApi'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { platsPassDatum, platsPassPeriod, platsPassTimmarPerVecka } from '@/services/passSerie'
import type { Placering } from '@/services/placeringarApi'
import { PLACERING_TYP_LABEL } from './placeringLabels'
import { formatTimmar, kortDatum } from './aktivitetEtiketter'

const VECKODAGAR: Array<[number, string]> = [[1, 'Mån'], [2, 'Tis'], [3, 'Ons'], [4, 'Tor'], [5, 'Fre'], [6, 'Lör'], [7, 'Sön']]

export interface PlatsPassPlan {
  id: string
  participant_id: string
  start_date: string
  end_date: string | null
}

export function PlatsPassDialog({ plats, plan, onClose, onSkapade }: {
  plats: Placering
  plan: PlatsPassPlan
  onClose: () => void
  onSkapade: (antal: number) => void
}) {
  const period = platsPassPeriod(plats, plan, formatLocalDate(new Date()))
  const [veckodagar, setVeckodagar] = useState<number[]>([])
  const [start, setStart] = useState('08:00')
  const [slut, setSlut] = useState('12:00')
  const [fran, setFran] = useState(period.fran)
  const [till, setTill] = useState(period.till ?? '')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const datum = platsPassDatum({ veckodagar, from: fran, to: till })
  const perVecka = platsPassTimmarPerVecka(veckodagar, start, slut)
  const valideringsfel = veckodagar.length === 0 ? 'Välj minst en veckodag'
    : slut <= start ? 'Sluttiden måste vara efter starttiden'
      : !till ? 'Ange sista dag'
        : datum.length === 0 ? 'Inga dagar i perioden'
          : plan.end_date && till > plan.end_date ? `Planen slutar ${kortDatum(plan.end_date)} — passen kan inte gå längre`
            : null

  const vaxla = (d: number) => setVeckodagar((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d].sort()))

  const spara = async () => {
    if (valideringsfel) { setFel(valideringsfel); return }
    setSparar(true)
    setFel(null)
    try {
      const skapade = await aktivitetsplanApi.addSessionsOnDates(
        plan.id,
        plan.participant_id,
        { date: datum[0], start_time: start, end_time: slut, title: plats.company_name, activity_type: 'workplace', location: plats.company_name },
        datum,
        // Praktik och arbetsträning på en arbetsplats: fysiskt och hållet av verksamheten.
        { work_placement_id: plats.id, is_physical: true, is_provider_led: true },
      )
      onSkapade(skapade.length)
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Passen kunde inte läggas in')
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog isOpen onClose={onClose} labelledBy="plats-pass-title" className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="p-5 border-b border-stone-200 dark:border-stone-700">
        <h2 id="plats-pass-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">Lägg in {plats.company_name} i planen</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {PLACERING_TYP_LABEL[plats.placement_type] ?? plats.placement_type}
          {plats.hours_per_week ? ` · ${formatTimmar(Number(plats.hours_per_week))}/vecka under Platser` : ' · timmar per vecka saknas under Platser'}
        </p>
      </div>
      <div className="p-5 space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">Veckodagar på platsen</legend>
          <div className="flex flex-wrap gap-2">
            {VECKODAGAR.map(([d, namn]) => (
              <label key={d} className="flex items-center gap-1 text-sm text-stone-800 dark:text-stone-100">
                <input type="checkbox" checked={veckodagar.includes(d)} onChange={() => vaxla(d)} />
                {namn}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Input id="plats-pass-start" label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} fullWidth />
          <Input id="plats-pass-slut" label="Slut" type="time" value={slut} onChange={(e) => setSlut(e.target.value)} fullWidth />
          <Input id="plats-pass-fran" label="Från och med" type="date" value={fran} onChange={(e) => setFran(e.target.value)} fullWidth />
          <Input id="plats-pass-till" label="Till och med" type="date" value={till} onChange={(e) => setTill(e.target.value)} fullWidth />
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-300" role="status">
          {datum.length > 0 && perVecka !== null
            ? `${datum.length} pass, ${formatTimmar(perVecka)}/vecka${plats.hours_per_week ? ` mot ${formatTimmar(Number(plats.hours_per_week))}/vecka under Platser` : ''}.`
            : 'Välj veckodagar och tider så räknas passen fram.'}
        </p>
        {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button onClick={() => void spara()} disabled={sparar}>
          {sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}
          Lägg in {datum.length > 0 ? `${datum.length} pass` : 'passen'}
        </Button>
      </div>
    </Dialog>
  )
}
