/**
 * AIX3 — "Luckan i CV:t".
 *
 * Visas bara när personens egna datum visar en tidslucka. Personen väljer själv
 * en neutral förklaring och får tre formuleringar: en CV-rad, en mening till
 * brevet och ett kort intervjusvar. Inget läggs till i CV:t utan ett klick.
 *
 * Inga AI-anrop. Orsaken är en kod, hanteras helt i webbläsaren och sparas
 * eller loggas ingenstans (se luckformuleringar.ts för motiveringen). Därför
 * ingen AI-märkning: texterna är färdiga mallar, inte modellutdata.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from '@/components/ui/icons'
import type { WorkExperience } from '@/types/cv'
import { hittaTidsluckor } from './tidsluckor'
import { LUCKKODER, luckformuleringar, periodText, type Luckkod } from './luckformuleringar'

interface Props {
  /** Erfarenhetsraderna, samma som skickas till ContextualHelp. */
  poster: unknown
  /** Anropas med en ny erfarenhetsrad när personen klickat "Lägg till som rad". */
  onAdd: (rad: WorkExperience) => void
}

export function LuckanICv({ poster, onAdd }: Props) {
  const { t } = useTranslation()
  const rubrikId = useId()
  const [luckIndex, setLuckIndex] = useState(0)
  const [kod, setKod] = useState<Luckkod | null>(null)
  const [kopierad, setKopierad] = useState<string | null>(null)
  const [tillagd, setTillagd] = useState(false)

  const luckor = hittaTidsluckor(poster)
  if (luckor.length === 0) return null
  const lucka = luckor[Math.min(luckIndex, luckor.length - 1)]
  const text = kod ? luckformuleringar(kod, lucka.fran, lucka.till) : null

  const etiketter: Record<Luckkod, string> = {
    barn: t('luckanCv.kod.barn', 'Jag var hemma med barn'),
    narstaende: t('luckanCv.kod.narstaende', 'Jag tog hand om en närstående'),
    studier: t('luckanCv.kod.studier', 'Jag studerade'),
    omstallning: t('luckanCv.kod.omstallning', 'Jag ställde om och sökte nytt arbete'),
    sjukdom: t('luckanCv.kod.sjukdom', 'Jag behövde tid för att återhämta mig'),
    vill_inte_ange: t('luckanCv.kod.vill_inte_ange', 'Jag vill inte ange varför'),
  }

  const valjLucka = (i: number) => {
    setLuckIndex(i)
    setTillagd(false)
    setKopierad(null)
  }

  const kopiera = async (nyckel: string, innehall: string) => {
    try {
      await navigator.clipboard.writeText(innehall)
      setKopierad(nyckel)
    } catch {
      setKopierad(null)
    }
  }

  const laggTill = () => {
    if (!text) return
    onAdd({
      id: crypto.randomUUID(),
      title: text.cvRad,
      company: '',
      location: '',
      startDate: lucka.fran,
      endDate: lucka.till,
      current: false,
      description: '',
    })
    setTillagd(true)
  }

  const knappKlass = 'inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800'

  const rader: Array<{ nyckel: string; rubrik: string; innehall: string }> = text
    ? [
        { nyckel: 'cv', rubrik: t('luckanCv.cvRad', 'Som rad i CV:t'), innehall: text.cvRad },
        { nyckel: 'brev', rubrik: t('luckanCv.brev', 'En mening till brevet'), innehall: text.brev },
        { nyckel: 'intervju', rubrik: t('luckanCv.intervju', 'Om någon frågar i en intervju'), innehall: text.intervju },
      ]
    : []

  return (
    <section aria-labelledby={rubrikId} className="mb-6">
      <details className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700/50 dark:bg-stone-800/50">
        <summary id={rubrikId} className="cursor-pointer text-sm font-semibold text-stone-800 dark:text-stone-200">
          {t('luckanCv.rubrik', 'Vad skriver jag om tiden utan jobb?')}
        </summary>
        <div className="mt-3 space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('luckanCv.intro', 'Många har perioder utan arbete, och de flesta arbetsgivare har sett det förut. Välj det som stämmer, så får du tre färdiga formuleringar. Du behöver inte berätta mer än du vill. Det du väljer sparas inte och skickas ingenstans.')}
          </p>

          {luckor.length > 1 && (
            <div>
              <label htmlFor={`${rubrikId}-lucka`} className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                {t('luckanCv.vilkenLucka', 'Vilken period gäller det?')}
              </label>
              <select
                id={`${rubrikId}-lucka`}
                value={luckIndex}
                onChange={(e) => valjLucka(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                {luckor.map((l, i) => (
                  <option key={`${l.fran}-${l.till}`} value={i}>{periodText(l.fran, l.till)}</option>
                ))}
              </select>
            </div>
          )}

          <fieldset>
            <legend className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {t('luckanCv.fraga', 'Vad stämmer för {{period}}?', { period: periodText(lucka.fran, lucka.till) })}
            </legend>
            <div className="mt-2 space-y-1">
              {LUCKKODER.map((k) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone-800 dark:text-stone-200">
                  <input
                    type="radio"
                    name={`${rubrikId}-kod`}
                    checked={kod === k}
                    onChange={() => { setKod(k); setTillagd(false); setKopierad(null) }}
                    className="h-4 w-4"
                  />
                  {etiketter[k]}
                </label>
              ))}
            </div>
          </fieldset>

          <div role="status" aria-live="polite">
            {text && (
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {t('luckanCv.forslagRubrik', 'Så kan du formulera det. Ändra så det låter som du, och ta bara med det som stämmer.')}
                </p>
                <ul className="mt-3 space-y-3">
                  {rader.map((r) => (
                    <li key={r.nyckel} className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
                      <p className="text-sm text-stone-700 dark:text-stone-300">{r.rubrik}</p>
                      <p className="mt-1 text-sm text-stone-900 dark:text-stone-100">{r.innehall}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => kopiera(r.nyckel, r.innehall)} className={knappKlass}>
                          {t('luckanCv.kopiera', 'Kopiera')}
                        </button>
                        {r.nyckel === 'cv' && !tillagd && (
                          <button type="button" onClick={laggTill} className={knappKlass}>
                            {t('luckanCv.laggTill', 'Lägg till som rad i mitt CV')}
                          </button>
                        )}
                        {kopierad === r.nyckel && (
                          <span className="inline-flex items-center gap-1 text-sm text-stone-800 dark:text-stone-200">
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                            {t('luckanCv.kopierad', 'Kopierad')}
                          </span>
                        )}
                        {r.nyckel === 'cv' && tillagd && (
                          <span className="inline-flex items-center gap-1 text-sm text-stone-800 dark:text-stone-200">
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                            {t('luckanCv.tillagd', 'Tillagd under Arbetslivserfarenhet.')}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </details>
    </section>
  )
}
