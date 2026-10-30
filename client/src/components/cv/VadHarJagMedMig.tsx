/**
 * AIX2 — "Vad har jag med mig?".
 *
 * Några öppna frågor om vardag, ideellt arbete och oavlönade uppdrag blir
 * förslag till CV-rader. Många som varit borta från arbetsmarknaden eller har
 * erfarenhet utifrån tror att sådant inte räknas.
 *
 * Tre saker som inte får glida:
 *  - Varje förslag visar personens EGNA mening som citat. Servern har strukit
 *    förslag vars citat inte står ordagrant i svaren, och förslag som lägger
 *    till titlar, ledarskap, omfattning eller siffror personen inte skrivit.
 *  - Inget läggs till i CV:t utan ett klick på just den raden. Raden läggs
 *    utan datum: de fyller personen i själv.
 *  - Svar som nämner hälsa skickas inte till AI (art. 9). Personen får veta
 *    varför, och kan skriva om eller lägga till raden för hand.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, AlertCircle, CheckCircle } from '@/components/ui/icons'
import { useOrgAiSparr } from '@/hooks/useOrgAiSparr'
import {
  foreslaFranVardag,
  VARDAG_SVAR_MAX_TECKEN,
  type VardagForslag,
} from '@/services/vardagApi'
import type { WorkExperience } from '@/types/cv'

interface Props {
  /** Anropas med en ny erfarenhetsrad när personen klickat "Lägg till". */
  onAdd: (rad: WorkExperience) => void
}

type Lage =
  | { typ: 'vilar' }
  | { typ: 'laddar' }
  | { typ: 'fel'; text: string }
  | { typ: 'halsa' }
  | { typ: 'inga' }
  | { typ: 'forslag'; lista: VardagForslag[] }

export function VadHarJagMedMig({ onAdd }: Props) {
  const { t } = useTranslation()
  const rubrikId = useId()
  const orgSparr = useOrgAiSparr()

  // Fråga och fält hänger ihop via index.
  const fragor = [
    t('vardagCv.fraga1', 'Har du hjälpt någon i din närhet med något, till exempel barn, äldre, en granne eller en kompis? Vad gjorde du?'),
    t('vardagCv.fraga2', 'Har du gjort något ideellt eller utan lön, till exempel i en förening, kyrka, skola eller på ett evenemang?'),
    t('vardagCv.fraga3', 'Har du skött något hemma eller i vardagen som kräver att man kan saker, till exempel ekonomi, renovering, matlagning eller att tolka åt någon?'),
    t('vardagCv.fraga4', 'Har du gjort något i ett annat land som du tror inte räknas här?'),
  ]
  const [svar, setSvar] = useState<string[]>(() => fragor.map(() => ''))
  const [lage, setLage] = useState<Lage>({ typ: 'vilar' })
  const [tillagda, setTillagda] = useState<Set<number>>(new Set())

  if (orgSparr) return null

  const harSvar = svar.some((s) => s.trim().length >= 10)
  const upptagen = lage.typ === 'laddar'

  const hitta = async () => {
    setLage({ typ: 'laddar' })
    setTillagda(new Set())
    try {
      const res = await foreslaFranVardag(fragor.map((fraga, i) => ({ fraga, text: svar[i] ?? '' })))
      if (res.typ === 'halsa') setLage({ typ: 'halsa' })
      else setLage(res.forslag.length === 0 ? { typ: 'inga' } : { typ: 'forslag', lista: res.forslag })
    } catch (err) {
      console.error('Kunde inte ta fram förslag:', err)
      const kod = (err as { code?: string })?.code
      setLage({
        typ: 'fel',
        text: kod === 'AI_CONSENT_REQUIRED'
          ? t('vardagCv.felAv', 'AI-funktionerna är avstängda just nu. Du kan lägga till erfarenheter för hand nedan.')
          : t('vardagCv.fel', 'Det gick inte att ta fram förslag just nu. Det du skrivit finns kvar. Försök igen om en stund.'),
      })
    }
  }

  const laggTill = (f: VardagForslag, i: number) => {
    onAdd({
      id: crypto.randomUUID(),
      title: f.titel,
      company: f.organisation,
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: f.beskrivning,
    })
    setTillagda((prev) => new Set(prev).add(i))
  }

  const ruta = 'rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700/50 dark:bg-stone-800/50'
  const faltKlass = 'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100'

  return (
    <section aria-labelledby={rubrikId} className="mb-6">
      <details className={ruta}>
        <summary id={rubrikId} className="cursor-pointer text-sm font-semibold text-stone-800 dark:text-stone-200">
          {t('vardagCv.rubrik', 'Vad har jag med mig? Få hjälp att hitta det som räknas')}
        </summary>
        <div className="mt-3 space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('vardagCv.intro', 'Sådant du gjort utan lön eller utanför jobbet kan stå på ditt CV. Svara på det du vill. Du behöver inte svara på allt. AI:n föreslår rader, och inget läggs till förrän du klickar på just den raden.')}
          </p>

          {fragor.map((fraga, i) => {
            const id = `${rubrikId}-f${i}`
            return (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-stone-800 dark:text-stone-200">{fraga}</label>
                <textarea
                  id={id}
                  value={svar[i] ?? ''}
                  maxLength={VARDAG_SVAR_MAX_TECKEN}
                  rows={3}
                  onChange={(e) => setSvar((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))}
                  className={faltKlass}
                />
              </div>
            )
          })}

          <button
            type="button"
            onClick={hitta}
            disabled={!harSvar || upptagen}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--c-solid)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
          >
            {upptagen
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {t('vardagCv.knapp', 'Hitta förslag till mitt CV')}
          </button>

          <div role="status" aria-live="polite">
            {upptagen && (
              <p className="text-sm text-stone-700 dark:text-stone-300">{t('vardagCv.laddar', 'Läser det du skrivit …')}</p>
            )}
            {lage.typ === 'inga' && (
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {t('vardagCv.inga', 'Vi hittade inga rader att föreslå ur det du skrivit. Beskriv gärna lite mer om vad du faktiskt gjorde, så försöker vi igen.')}
              </p>
            )}
            {lage.typ === 'halsa' && (
              <p className="flex items-start gap-2 text-sm text-stone-800 dark:text-stone-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{t('vardagCv.halsa', 'Det du skrivit verkar handla om hälsa. Uppgifter om hälsa skickar vi inte till AI. Skriv om utan den delen och försök igen, eller lägg till erfarenheten för hand nedan. Det du skrivit finns kvar.')}</span>
              </p>
            )}
          </div>
          {lage.typ === 'fel' && (
            <p role="alert" className="flex items-start gap-2 text-sm text-stone-800 dark:text-stone-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{lage.text}</span>
            </p>
          )}

          {lage.typ === 'forslag' && (
            <div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                {t('vardagCv.forslagRubrik', 'Förslag från AI. Du bestämmer vad som tas med.')}
              </p>
              <ul className="mt-3 space-y-3">
                {lage.lista.map((f, i) => (
                  <li key={`${i}-${f.citat}`} className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
                    <p className="font-medium text-stone-900 dark:text-stone-100">{f.titel}</p>
                    {f.organisation && <p className="text-sm text-stone-700 dark:text-stone-300">{f.organisation}</p>}
                    <p className="mt-1 text-sm text-stone-800 dark:text-stone-200">{f.beskrivning}</p>
                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                      {t('vardagCv.duSkrev', 'Du skrev:')} <q>{f.citat}</q>
                    </p>
                    {tillagda.has(i) ? (
                      <p className="mt-2 inline-flex items-center gap-1 text-sm text-stone-800 dark:text-stone-200">
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        {t('vardagCv.tillagd', 'Tillagd under Arbetslivserfarenhet. Fyll i datum där.')}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => laggTill(f, i)}
                        className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800"
                      >
                        {t('vardagCv.laggTill', 'Lägg till i mitt CV')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </section>
  )
}
