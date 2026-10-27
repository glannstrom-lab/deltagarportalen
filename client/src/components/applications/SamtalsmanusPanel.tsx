/**
 * AIX6 — Samtalsmanus för telefon.
 *
 * Telefonskräck är en verklig tröskel. Panelen ger ett kort manus för första
 * samtalet, med luckor för det AI:n inte kan veta. Bara företag, roll och
 * kontaktens namn och titel ur ansökan skickas — aldrig CV, telefonnummer
 * eller personuppgifter om den som söker.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, Loader2 } from '@/components/ui/icons'
import { skapaSamtalsmanus, type SamtalsSyfte } from '@/services/ansokanAiApi'
import type { Application } from '@/types/application.types'
import { foretagOchRoll } from './ansokanFalt'
import { UtkastRuta } from './UtkastRuta'

interface Props {
  kontaktnamn: string
  kontakttitel?: string | null
  /** Ansökan kontakten hör till. Saknas den blir företag och roll luckor. */
  ansokan?: Pick<Application, 'status' | 'companyName' | 'jobTitle' | 'jobData'>
}

const SYFTEN: Array<{ id: SamtalsSyfte; nyckel: string; standard: string }> = [
  { id: 'fraga', nyckel: 'samtalsmanus.syfte.fraga', standard: 'Fråga om annonsen' },
  { id: 'folj_upp', nyckel: 'samtalsmanus.syfte.foljUpp', standard: 'Följa upp min ansökan' },
  { id: 'spontan', nyckel: 'samtalsmanus.syfte.spontan', standard: 'Ringa spontant' },
]

/** Har ansökan skickats? Då är uppföljning det vanliga skälet att ringa. */
function standardSyfte(status?: Application['status']): SamtalsSyfte {
  return status === 'interested' || status === 'saved' ? 'fraga' : 'folj_upp'
}

export function SamtalsmanusPanel({ kontaktnamn, kontakttitel, ansokan }: Props) {
  const { t } = useTranslation()
  const panelId = useId()
  const [oppen, setOppen] = useState(false)
  const [syfte, setSyfte] = useState<SamtalsSyfte>(() => standardSyfte(ansokan?.status))
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [manus, setManus] = useState<string | null>(null)

  const skriv = async () => {
    setLaddar(true)
    setFel(null)
    try {
      const { foretag, roll } = ansokan ? foretagOchRoll(ansokan) : {}
      setManus(await skapaSamtalsmanus({
        syfte,
        foretag,
        roll,
        kontaktnamn,
        kontakttitel: kontakttitel ?? undefined,
      }))
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('samtalsmanus.fel', 'Det gick inte att skriva ett manus just nu. Försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOppen((v) => !v)}
        aria-expanded={oppen}
        aria-controls={panelId}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[var(--c-bg)] px-3 py-1.5 text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-accent)]/40"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {t('samtalsmanus.knapp', 'Förbered samtalet')}
      </button>

      {oppen && (
        <div id={panelId} className="mt-3 space-y-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-stone-800 dark:text-stone-200">
              {t('samtalsmanus.varforRingerDu', 'Varför ringer du?')}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {SYFTEN.map((s) => (
                <label key={s.id} className="flex min-h-[32px] cursor-pointer items-center gap-1.5 text-sm text-stone-800 dark:text-stone-200">
                  <input
                    type="radio"
                    name={`${panelId}-syfte`}
                    value={s.id}
                    checked={syfte === s.id}
                    onChange={() => setSyfte(s.id)}
                  />
                  {t(s.nyckel, s.standard)}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => void skriv()}
            disabled={laddar}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--c-solid)] px-4 py-2 text-sm font-medium text-[var(--c-on-solid)] hover:brightness-110 disabled:opacity-60"
          >
            {laddar && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {manus ? t('samtalsmanus.skrivNytt', 'Skriv ett nytt manus') : t('samtalsmanus.skriv', 'Skriv ett manus')}
          </button>

          <div aria-live="polite">
            {laddar && <p role="status" className="text-sm text-stone-700 dark:text-stone-300">{t('samtalsmanus.laddar', 'Skriver …')}</p>}
            {fel && !laddar && <p role="alert" className="text-sm text-stone-800 dark:text-stone-200">{fel}</p>}
          </div>

          {manus && !laddar && <UtkastRuta text={manus} medUpplasning />}
        </div>
      )}
    </div>
  )
}
