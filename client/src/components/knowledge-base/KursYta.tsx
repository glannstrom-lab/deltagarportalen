/**
 * KursYta (KC15) — korta kurser överst-under sökrutan i Kunskapsbanken.
 * En kurs är en ordnad lista av befintliga artiklar; "läst" kommer ur
 * article_reading_progress (se data/kurser.ts). Inga poäng eller nivåer:
 * en kurs är genomförd när alla delar är lästa, och det är allt.
 * Tre lägen: laddar (inget påstås om användaren), fel, klart.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronDown, Check } from '@/components/ui/icons'
import { KURSER, kursMinuter, kursStatus, type Kurs } from '@/data/kurser'
import { useKursframsteg } from '@/hooks/useKursframsteg'

interface Props {
  articles: { id: string; title: string }[]
  /** Tester kan skicka in läst-läget direkt. */
  kurser?: readonly Kurs[]
}

export function KursYta({ articles, kurser = KURSER }: Props) {
  const { t } = useTranslation()
  const titlar = new Map(articles.map((a) => [a.id, a.title]))
  // Bara delar som finns som aktiva artiklar visas och räknas.
  const synliga = kurser
    .map((k) => ({ ...k, delar: k.delar.filter((d) => titlar.has(d.slug)) }))
    .filter((k) => k.delar.length > 0)
  const alla = synliga.flatMap((k) => k.delar.map((d) => d.slug))
  const { data: lasta, isLoading, isError } = useKursframsteg(alla)
  const [oppen, setOppen] = useState<string | null>(null)

  if (synliga.length === 0) return null

  return (
    <section aria-labelledby="kurser-rubrik" data-testid="kurser">
      <h2 id="kurser-rubrik" className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-1">
        {t('kurser.rubrik', 'Korta kurser')}
      </h2>
      <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
        {t('kurser.ingress', 'Några artiklar i en bestämd ordning. Läs i din takt, och ta en paus när du vill.')}
      </p>
      {isError && (
        <p role="status" className="text-sm text-stone-700 dark:text-stone-300 mb-3">
          {t('kurser.lasfel', 'Vi kunde inte hämta vad du har läst. Kurserna går ändå att öppna.')}
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {synliga.map((kurs) => {
          const status = lasta && !isError ? kursStatus(kurs.delar, lasta) : null
          const minuter = kursMinuter(kurs.delar)
          const panelId = `kurs-${kurs.id}`
          const ar = oppen === kurs.id
          const namn = t(`kurser.${kurs.id}.namn`, kurs.namn)
          return (
            <div key={kurs.id} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl">
              <button
                type="button"
                aria-expanded={ar}
                aria-controls={panelId}
                onClick={() => setOppen(ar ? null : kurs.id)}
                className="w-full min-h-[44px] flex items-start gap-3 text-left p-3.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-stone-900 dark:text-stone-50">{namn}</span>
                  <span className="block text-sm text-stone-700 dark:text-stone-300">
                    {t(`kurser.${kurs.id}.beskrivning`, kurs.beskrivning)}
                  </span>
                  <span className="block mt-1 text-xs text-stone-700 dark:text-stone-300">
                    {t('kurser.delarOchTid', {
                      antal: kurs.delar.length,
                      minuter,
                      defaultValue: '{{antal}} delar, ungefär {{minuter}} minuter',
                    })}
                    {status && (
                      <>
                        {' · '}
                        {status.genomford ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            {t('kurser.genomford', 'Genomförd')}
                          </span>
                        ) : status.paborjad ? (
                          t('kurser.lasta', {
                            klara: status.klara,
                            totalt: status.totalt,
                            defaultValue: '{{klara}} av {{totalt}} lästa',
                          })
                        ) : (
                          t('kurser.intePaborjad', 'Börja med första delen när du vill')
                        )}
                      </>
                    )}
                  </span>
                </span>
                <ChevronDown size={18} aria-hidden="true" className={`mt-1 shrink-0 transition-transform ${ar ? 'rotate-180' : ''}`} />
              </button>
              {ar && (
                <ol id={panelId} className="m-0 px-3.5 pb-3.5 pl-9 list-decimal space-y-1.5 text-sm">
                  {kurs.delar.map((d) => {
                    const last = !!lasta && !isError && lasta.has(d.slug)
                    return (
                      <li key={d.slug}>
                        <Link
                          to={`/knowledge-base/article/${d.slug}`}
                          className="inline-flex items-center min-h-[44px] gap-1.5 text-[var(--c-text)] underline-offset-2 hover:underline"
                        >
                          {titlar.get(d.slug)}
                          {last && (
                            <>
                              <Check size={14} aria-hidden="true" />
                              <span className="sr-only">{t('kurser.delLast', 'Läst')}</span>
                            </>
                          )}
                        </Link>
                        <span className="ml-1 text-xs text-stone-700 dark:text-stone-300">
                          {t('kurser.delMinuter', { minuter: d.minuter, defaultValue: '{{minuter}} min' })}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          )
        })}
      </div>
      {isLoading && <span className="sr-only" role="status">{t('kurser.laddar', 'Hämtar vad du har läst')}</span>}
    </section>
  )
}

export default KursYta
