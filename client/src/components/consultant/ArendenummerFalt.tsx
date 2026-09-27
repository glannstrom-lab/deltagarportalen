/**
 * ArendenummerFalt — ärende-/dossiernummer på planen (RK40, rollspelet
 * 2026-09-27). Kommunen: numret i verksamhetssystemet. Leverantören: AF:s
 * ärende-id. Då går plan och underlag att matcha hos handläggaren utan
 * personnummer i Jobin — och ett personnummer nekas här och i databasen.
 *
 * Visas bara när kolumnen finns (PENDING_20260927d, services/planMarkning.ts).
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { aktivitetsplanApi, type ActivityPlan } from '@/services/aktivitetApi'
import { ARENDE_ETIKETT, ARENDE_MAX_LANGD, planensArende, valideraArendenummer, type ArendeRegelverk } from '@/services/planMarkning'

export function ArendenummerFalt({ plan, regelverk, onSparad }: {
  plan: ActivityPlan
  regelverk: ArendeRegelverk
  onSparad: (p: ActivityPlan) => void
}) {
  const nuvarande = planensArende(plan)
  const [redigerar, setRedigerar] = useState(false)
  const [text, setText] = useState(nuvarande ?? '')
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const etikett = ARENDE_ETIKETT[regelverk]

  const spara = async () => {
    const v = valideraArendenummer(text)
    if (!v.ok) { setFel(v.fel); return }
    setSparar(true)
    setFel(null)
    try {
      onSparad(await aktivitetsplanApi.sattArendenummer(plan.id, v.varde))
      setRedigerar(false)
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Ärendenumret kunde inte sparas')
    } finally {
      setSparar(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center sm:col-span-2" data-testid="rad-arende">
      <dt className="text-stone-500">{etikett}</dt>
      <dd className="min-w-0 max-w-full">
        {redigerar ? (
          <span className="flex flex-wrap items-center gap-2">
            <input
              aria-label={etikett}
              aria-invalid={fel ? true : undefined}
              aria-describedby={fel ? 'arende-fel' : undefined}
              maxLength={ARENDE_MAX_LANGD}
              className="text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-2 py-1"
              value={text}
              onChange={(e) => { setText(e.target.value); setFel(null) }}
            />
            <button type="button" className="text-xs underline text-stone-700 dark:text-stone-200" disabled={sparar} onClick={() => void spara()}>Spara</button>
            <button type="button" className="text-xs underline text-stone-500" disabled={sparar} onClick={() => { setRedigerar(false); setText(nuvarande ?? ''); setFel(null) }}>Avbryt</button>
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            {nuvarande
              ? <span className="tabular-nums">{nuvarande}</span>
              : <span className="text-stone-500"><span aria-hidden="true">— </span>inte angivet</span>}
            <button type="button" className="text-xs underline text-stone-600 dark:text-stone-300" onClick={() => setRedigerar(true)}>
              {nuvarande ? 'Ändra' : 'Ange'}
            </button>
          </span>
        )}
        {fel && <p id="arende-fel" role="alert" className="text-xs text-rose-700 dark:text-rose-300 mt-1">{fel}</p>}
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Står på plan-PDF:en, närvarointyget och underlagspaketet. Inte personnummer.</p>
      </dd>
    </div>
  )
}
