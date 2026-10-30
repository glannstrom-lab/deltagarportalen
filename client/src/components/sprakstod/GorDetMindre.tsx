/**
 * AIX29 — Gör det mindre.
 *
 * "Jag måste ringa AF" blir tre till fem små steg, en handling var. Det är ett
 * förslag, inte ett krav: personen sparar listan om hen vill ha den, bockar av
 * i sin takt och tar bort den när hen vill. Listorna ligger bara i den här
 * webbläsaren (services/gorDetMindreLista.ts) och det sägs öppet här.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, AlertCircle } from '@/components/ui/icons'
import { delaUppgift, UPPGIFT_MAX_TECKEN } from '@/services/sprakStodApi'
import { lasListor, sparaLista, vaxlaSteg, taBortLista, type GorMindreLista } from '@/services/gorDetMindreLista'

export function GorDetMindre() {
  const { t } = useTranslation()
  const faltId = useId()
  const [uppgift, setUppgift] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [forslag, setForslag] = useState<{ uppgift: string; steg: string[] } | null>(null)
  const [listor, setListor] = useState<GorMindreLista[]>(() => lasListor())
  const [sparfel, setSparfel] = useState(false)

  const kor = async () => {
    setLaddar(true)
    setFel(null)
    setForslag(null)
    setSparfel(false)
    try {
      const steg = await delaUppgift(uppgift)
      setForslag({ uppgift: uppgift.trim(), steg })
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('sprakStod.mindre.fel', 'Det gick inte att dela upp det just nu. Försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  const spara = () => {
    if (!forslag) return
    const r = sparaLista(forslag.uppgift, forslag.steg)
    setListor(r.listor)
    setSparfel(!r.sparad)
    if (r.sparad) setForslag(null)
  }

  return (
    <div className="space-y-3">
      <label htmlFor={faltId} className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t('sprakStod.mindre.etikett', 'Vad känns för stort just nu?')}
      </label>
      <input
        id={faltId}
        type="text"
        value={uppgift}
        onChange={(e) => setUppgift(e.target.value)}
        maxLength={UPPGIFT_MAX_TECKEN}
        placeholder={t('sprakStod.mindre.exempel', 'Till exempel: Jag måste ringa Arbetsförmedlingen')}
        className="w-full rounded-lg border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      />
      <button
        type="button"
        onClick={() => void kor()}
        disabled={laddar || uppgift.trim().length < 3}
        className="flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--c-solid)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {laddar ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
        {t('sprakStod.mindre.knapp', 'Dela upp det')}
      </button>

      <div aria-live="polite">
        {laddar && <p role="status" className="text-sm text-stone-700 dark:text-stone-300">{t('sprakStod.mindre.laddar', 'Tänker ut små steg …')}</p>}
        {fel && !laddar && (
          <div role="alert" className="flex items-start gap-2 text-sm text-stone-800 dark:text-stone-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{fel}</p>
          </div>
        )}
        {forslag && !laddar && (
          <div className="mt-2 space-y-3 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {t('sprakStod.mindre.forslag', 'Det här är ett förslag från AI, inte ett krav. Gör som det passar dig.')}
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              {forslag.steg.map((s, i) => <li key={`f${i}`}>{s}</li>)}
            </ol>
            <button
              type="button"
              onClick={spara}
              className="min-h-[44px] rounded-lg border border-stone-300 px-4 py-2 font-medium hover:bg-stone-50 dark:border-stone-600 dark:hover:bg-stone-800"
            >
              {t('sprakStod.mindre.spara', 'Spara som lista med bockrutor')}
            </button>
            {sparfel && (
              <p role="alert">{t('sprakStod.mindre.sparfel', 'Webbläsaren lät oss inte spara listan. Skriv av stegen om du vill ha dem kvar.')}</p>
            )}
          </div>
        )}
      </div>

      <section aria-labelledby={`${faltId}-listor`} className="pt-2">
        <h3 id={`${faltId}-listor`} className="mb-1 text-sm font-semibold text-stone-800 dark:text-stone-200">
          {t('sprakStod.mindre.dinaListor', 'Dina listor')}
        </h3>
        <p className="mb-2 text-xs text-stone-600 dark:text-stone-400">
          {t('sprakStod.mindre.privat', 'Listorna är bara dina. De sparas i den här webbläsaren och syns inte på andra enheter.')}
        </p>
        {listor.length === 0 ? (
          <p className="text-sm text-stone-700 dark:text-stone-300">{t('sprakStod.mindre.tomt', 'Här hamnar de listor du sparar.')}</p>
        ) : (
          <ul className="space-y-3">
            {listor.map((l) => (
              <li key={l.id}>
                <fieldset className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
                  <legend className="px-1 text-sm font-medium text-stone-800 dark:text-stone-200">{l.uppgift}</legend>
                  <ul className="space-y-1">
                    {l.steg.map((s, i) => (
                      <li key={`${l.id}-${i}`}>
                        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-stone-800 dark:text-stone-200">
                          <input type="checkbox" checked={s.klar} onChange={() => setListor(vaxlaSteg(l.id, i))} className="h-5 w-5" />
                          <span className={s.klar ? 'line-through text-stone-600 dark:text-stone-400' : ''}>{s.text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setListor(taBortLista(l.id))}
                    className="mt-1 min-h-[44px] text-sm text-stone-700 underline dark:text-stone-300"
                  >
                    {t('sprakStod.mindre.taBort', 'Ta bort listan')}
                  </button>
                </fieldset>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default GorDetMindre
