/**
 * AIX24 — Förklara myndighetsbrevet.
 *
 * Deltagaren klistrar in texten från ett beslut eller en kallelse och får fyra
 * svar: vad det är, vad hen ska göra, senast när och vem hen kontaktar. Servern
 * (`_prompts/_sprakvalidering.js`) kastar varje rad som inte har ett ordagrant
 * citat ur brevet, och varje siffra som inte står i brevet. Här visas citatet
 * under varje punkt så att personen kan se var i brevet det står.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, AlertCircle } from '@/components/ui/icons'
import {
  forklaraBrev,
  BrevAvvisatError,
  BREV_MAX_TECKEN,
  type BrevForklaring,
} from '@/services/sprakStodApi'

export function ForklaraBrev() {
  const { t } = useTranslation()
  const faltId = useId()
  const hintId = useId()
  const [brev, setBrev] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [data, setData] = useState<BrevForklaring | null>(null)

  const kor = async () => {
    setLaddar(true)
    setFel(null)
    setData(null)
    try {
      setData(await forklaraBrev(brev))
    } catch (e) {
      if (e instanceof BrevAvvisatError) {
        setFel(t('sprakStod.brev.avvisat', 'Det här ser ut som ett läkarintyg eller en journaltext. Den sortens text läser vi inte här. Fråga i stället din läkare, din handläggare eller Försäkringskassan.'))
      } else {
        setFel(e instanceof Error && e.message ? e.message : t('sprakStod.brev.fel', 'Det gick inte att förklara brevet just nu. Försök igen om en stund.'))
      }
    } finally {
      setLaddar(false)
    }
  }

  return (
    <div className="space-y-3">
      <p id={hintId} className="text-sm text-stone-700 dark:text-stone-300">
        {t('sprakStod.brev.hint', 'Klistra in texten från brevet. Personnummer tas bort innan texten skickas. Klistra inte in läkarintyg eller journaltext.')}
      </p>
      <label htmlFor={faltId} className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t('sprakStod.brev.etikett', 'Texten från brevet')}
      </label>
      <textarea
        id={faltId}
        aria-describedby={hintId}
        value={brev}
        onChange={(e) => setBrev(e.target.value)}
        maxLength={BREV_MAX_TECKEN}
        rows={7}
        className="w-full rounded-lg border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      />
      <button
        type="button"
        onClick={() => void kor()}
        disabled={laddar || brev.trim().length < 20}
        className="flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--c-solid)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {laddar ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
        {t('sprakStod.brev.knapp', 'Förklara brevet')}
      </button>

      <div aria-live="polite">
        {laddar && <p role="status" className="text-sm text-stone-700 dark:text-stone-300">{t('sprakStod.brev.laddar', 'Läser brevet …')}</p>}
        {fel && !laddar && (
          <div role="alert" className="flex items-start gap-2 text-sm text-stone-800 dark:text-stone-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{fel}</p>
          </div>
        )}
        {data && !laddar && <Svar f={data} />}
      </div>
    </div>
  )
}

function Svar({ f }: { f: BrevForklaring }) {
  const { t } = useTranslation()
  return (
    <div className="mt-2 space-y-4 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
      <p className="text-xs text-stone-600 dark:text-stone-400">
        {t('sprakStod.brev.ansvar', 'Förenklat av AI, brevet gäller. Om något är oklart: fråga den som skickat brevet.')}
      </p>

      <section>
        <h3 className="mb-1 font-semibold">{t('sprakStod.brev.vad', 'Vad är det här?')}</h3>
        {f.avsandare && <p className="text-stone-700 dark:text-stone-300">{t('sprakStod.brev.fran', 'Från:')} {f.avsandare}</p>}
        <p>{f.vad}</p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold">{t('sprakStod.brev.gor', 'Vad ska jag göra?')}</h3>
        {f.gor.length === 0 ? (
          <p>{t('sprakStod.brev.gorTomt', 'Vi hittade inget i brevet som vi kunde peka ut säkert. Fråga den som skickat brevet vad du behöver göra.')}</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5">
            {f.gor.map((g, i) => (
              <li key={`g${i}`}>
                <p>{g.steg}</p>
                <Citat text={g.citat} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="mb-1 font-semibold">{t('sprakStod.brev.senast', 'Senast när?')}</h3>
        {f.senast.length === 0 ? (
          <p>{t('sprakStod.brev.senastTomt', 'Brevet nämner inget datum som vi kunde peka ut säkert. Läs brevet en gång till eller fråga avsändaren.')}</p>
        ) : (
          <ul className="space-y-2">
            {f.senast.map((s, i) => (
              <li key={`s${i}`}>
                <p><span className="font-medium">{s.datum}</span> — {s.sak}</p>
                <Citat text={s.citat} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-1 font-semibold">{t('sprakStod.brev.vem', 'Vem kontaktar jag?')}</h3>
        {f.vem.length === 0 ? (
          <p>{t('sprakStod.brev.vemTomt', 'Brevet anger ingen kontakt som vi kunde peka ut säkert. Titta efter ett telefonnummer längst ner i brevet.')}</p>
        ) : (
          <ul className="space-y-2">
            {f.vem.map((v, i) => (
              <li key={`v${i}`}>
                <p>{v.namn}{v.kontakt ? ` — ${v.kontakt}` : ''}</p>
                <Citat text={v.citat} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Citat({ text }: { text: string }) {
  const { t } = useTranslation()
  return (
    <p className="mt-0.5 border-l-2 border-stone-300 pl-2 text-xs italic text-stone-600 dark:border-stone-600 dark:text-stone-400">
      <span className="not-italic font-medium">{t('sprakStod.brev.iBrevet', 'Så står det i brevet:')} </span>
      “{text}”
    </p>
  )
}

export default ForklaraBrev
