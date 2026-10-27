/**
 * AIX1 — Förklara annonsen.
 *
 * En knapp och en utfällbar panel som sammanfattar vad jobbet består av, vad
 * annonsen ber om (krav, önskemål, oklart) och förklarar svåra ord. Många i
 * målgruppen sållar bort sig själva på ett "meriterande" de missförstått.
 *
 * Ärlighetsreglerna bor på servern (`RESPONSE_VALIDATORS['annons-forklaring']`):
 * en rad utan ordagrant citat ur annonsen kommer aldrig hit. Här visas citatet
 * under varje punkt, och hela panelen bär raden "Förenklat av AI, originalet
 * gäller." Panelen läggs bredvid knapparna med `display: contents`, så den
 * ligger i samma flexrad som kortets övriga knappar och bryter till egen rad.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, AlertCircle } from '@/components/ui/icons'
import {
  forklaraAnnons,
  lasCachadForklaring,
  type AnnonsForklaring as Forklaring,
  type AnnonsUnderlag,
  type KravTyp,
} from '@/services/ansokanAiApi'
import { cn } from '@/lib/utils'

/** Under det här finns inget att förklara (tom eller bara en rubrik). */
const MIN_TECKEN = 40

interface Props {
  annons: AnnonsUnderlag
  /** Knappens utseende — "kort" ryms i en rad av små knappar. */
  storlek?: 'kort' | 'stor'
  className?: string
}

const TYPETIKETT: Record<KravTyp, { nyckel: string; standard: string; stil: string }> = {
  hart: {
    nyckel: 'annonsForklaring.typ.hart',
    standard: 'Krav',
    stil: 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900',
  },
  onskemal: {
    nyckel: 'annonsForklaring.typ.onskemal',
    standard: 'Önskemål',
    stil: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] border border-[var(--c-accent)]',
  },
  oklart: {
    nyckel: 'annonsForklaring.typ.oklart',
    standard: 'Annonsen säger inte om det är ett krav',
    stil: 'bg-stone-100 text-stone-700 border border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600',
  },
}

export function AnnonsForklaring({ annons, storlek = 'kort', className }: Props) {
  const { t } = useTranslation()
  const panelId = useId()
  const [oppen, setOppen] = useState(false)
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [data, setData] = useState<Forklaring | null>(() => lasCachadForklaring(annons))

  if (annons.text.trim().length < MIN_TECKEN) return null

  const hamta = async () => {
    setLaddar(true)
    setFel(null)
    try {
      setData(await forklaraAnnons(annons))
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('annonsForklaring.fel', 'Det gick inte att förklara annonsen just nu. Försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  const vaxla = () => {
    const nasta = !oppen
    setOppen(nasta)
    if (nasta && !data && !laddar) void hamta()
  }

  const tomt = data && data.uppgifter.length === 0 && data.krav.length === 0 && data.ord.length === 0

  return (
    <div className="contents">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          vaxla()
        }}
        aria-expanded={oppen}
        aria-controls={panelId}
        className={cn(
          'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors',
          'bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40',
          storlek === 'kort' ? 'px-3 py-1.5 text-sm' : 'min-h-[48px] py-3 rounded-xl border border-[var(--c-accent)]/60',
          className,
        )}
      >
        <Sparkles size={storlek === 'kort' ? 16 : 18} aria-hidden="true" />
        {t('annonsForklaring.knapp', 'Förklara annonsen')}
      </button>

      {oppen && (
        <div
          id={panelId}
          role="region"
          aria-label={t('annonsForklaring.region', 'Annonsen förklarad')}
          onClick={(e) => e.stopPropagation()}
          className="col-span-full w-full basis-full cursor-default rounded-xl border border-stone-200 bg-white p-4 text-left text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        >
          {laddar && (
            <p role="status" className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('annonsForklaring.laddar', 'Läser annonsen …')}
            </p>
          )}

          {fel && !laddar && (
            <div role="alert" className="flex items-start gap-2 text-stone-800 dark:text-stone-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p>{fel}</p>
                <button type="button" onClick={() => void hamta()} className="mt-1 font-medium underline">
                  {t('annonsForklaring.proviIgen', 'Försök igen')}
                </button>
              </div>
            </div>
          )}

          {data && !laddar && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('annonsForklaring.ansvar', 'Förenklat av AI, originalet gäller.')}
              </p>

              {tomt && (
                <p>
                  {t('annonsForklaring.tomt', 'Vi hittade inget i texten som vi kunde peka ut säkert. Läs annonsen själv — du kan alltid fråga arbetsgivaren.')}
                </p>
              )}

              {data.uppgifter.length > 0 && (
                <section>
                  <h4 className="mb-1.5 font-semibold">{t('annonsForklaring.uppgifter', 'Det här gör du på jobbet')}</h4>
                  <ul className="space-y-2">
                    {data.uppgifter.map((u, i) => (
                      <li key={`u${i}`}>
                        <p>{u.punkt}</p>
                        <Citat text={u.citat} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.krav.length > 0 && (
                <section>
                  <h4 className="mb-1.5 font-semibold">{t('annonsForklaring.krav', 'Det här ber annonsen om')}</h4>
                  <ul className="space-y-2.5">
                    {data.krav.map((k, i) => {
                      const typ = TYPETIKETT[k.typ] ?? TYPETIKETT.oklart
                      return (
                        <li key={`k${i}`}>
                          <p>
                            <span className={cn('mr-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium', typ.stil)}>
                              {t(typ.nyckel, typ.standard)}
                            </span>
                            {k.punkt}
                          </p>
                          <Citat text={k.citat} />
                        </li>
                      )
                    })}
                  </ul>
                  {data.krav.some((k) => k.typ === 'onskemal') && (
                    <p className="mt-2 text-stone-700 dark:text-stone-300">
                      {t('annonsForklaring.onskemalTips', 'Ett önskemål behöver du inte ha för att söka.')}
                    </p>
                  )}
                </section>
              )}

              {data.ord.length > 0 && (
                <section>
                  <h4 className="mb-1.5 font-semibold">{t('annonsForklaring.ord', 'Ord som kan vara svåra')}</h4>
                  <dl className="space-y-1">
                    {data.ord.map((o, i) => (
                      <div key={`o${i}`}>
                        <dt className="inline font-medium">{o.ord}</dt>
                        <dd className="inline"> — {o.betydelse}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Citat({ text }: { text: string }) {
  const { t } = useTranslation()
  return (
    <p className="mt-0.5 border-l-2 border-stone-300 pl-2 text-xs italic text-stone-600 dark:border-stone-600 dark:text-stone-400">
      <span className="not-italic font-medium">{t('annonsForklaring.iAnnonsen', 'Så står det i annonsen:')} </span>
      “{text}”
    </p>
  )
}

export default AnnonsForklaring
