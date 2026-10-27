/**
 * AIX5 — efter avslag eller tystnad.
 *
 * Avslag är det som oftast får långtidsarbetslösa att tappa fart. Panelen
 * erbjuder ett kort mejl som frågar om återkoppling — och bär en rad som säger
 * rakt ut att AI:n inte vet varför, så att ingen läser in en orsak i texten.
 * Erbjudandet utlöses av `uppfoljningsOrsak` (avslag, eller 14 dagar utan svar).
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Loader2 } from '@/components/ui/icons'
import { skapaUppfoljningsmejl } from '@/services/ansokanAiApi'
import type { Application } from '@/types/application.types'
import { foretagOchRoll } from './ansokanFalt'
import { UtkastRuta } from './UtkastRuta'
import { dagarSedan, uppfoljningsOrsak } from './uppfoljning'

interface Props {
  ansokan: Application
  /** Primär kontakt om en finns — annars blir namnet en lucka. */
  kontaktnamn?: string
}

export function UppfoljningsmejlPanel({ ansokan, kontaktnamn }: Props) {
  const { t } = useTranslation()
  const panelId = useId()
  const [nu] = useState(() => new Date())
  const orsak = uppfoljningsOrsak(ansokan, nu)
  const [oppen, setOppen] = useState(false)
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [mejl, setMejl] = useState<string | null>(null)

  if (!orsak) return null

  const skriv = async () => {
    setLaddar(true)
    setFel(null)
    try {
      const { foretag, roll } = foretagOchRoll(ansokan)
      const dagar = dagarSedan(ansokan.applicationDate, nu)
      setMejl(await skapaUppfoljningsmejl({
        orsak,
        foretag,
        roll,
        kontaktnamn,
        // Datum och antal dagar räknas här, inte av modellen.
        ansoktDatum: ansokan.applicationDate ? ansokan.applicationDate.slice(0, 10) : undefined,
        dagarSedan: dagar ?? undefined,
      }))
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('uppfoljningsmejl.fel', 'Det gick inte att skriva mejlet just nu. Försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50" aria-label={t('uppfoljningsmejl.region', 'Uppföljning')}>
      <p className="text-sm text-stone-800 dark:text-stone-200">
        {orsak === 'avslag'
          ? t('uppfoljningsmejl.introAvslag', 'Ett avslag är tungt, och det är inte ett omdöme om dig. Om du vill kan du fråga om du får någon återkoppling.')
          : t('uppfoljningsmejl.introTystnad', 'Det har gått minst två veckor sedan du sökte. Det är vanligt att svaret dröjer. Om du vill kan du höra av dig och fråga hur det går.')}
      </p>
      <button
        type="button"
        onClick={() => {
          const nasta = !oppen
          setOppen(nasta)
          if (nasta && !mejl && !laddar) void skriv()
        }}
        aria-expanded={oppen}
        aria-controls={panelId}
        className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[var(--c-bg)] px-3 py-1.5 text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-accent)]/40"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        {t('uppfoljningsmejl.knapp', 'Skriv ett kort mejl')}
      </button>

      {oppen && (
        <div id={panelId} className="mt-3 space-y-3" aria-live="polite">
          {laddar && (
            <p role="status" className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('uppfoljningsmejl.laddar', 'Skriver …')}
            </p>
          )}
          {fel && !laddar && (
            <div role="alert" className="text-sm text-stone-800 dark:text-stone-200">
              <p>{fel}</p>
              <button type="button" onClick={() => void skriv()} className="mt-1 font-medium underline">
                {t('uppfoljningsmejl.proviIgen', 'Försök igen')}
              </button>
            </div>
          )}
          {mejl && !laddar && (
            <>
              <UtkastRuta text={mejl} />
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('uppfoljningsmejl.arInteOrsak', 'AI:n har inget underlag för varför det blev som det blev, och mejlet säger ingenting om det.')}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  )
}
