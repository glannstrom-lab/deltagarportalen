/**
 * AIX9 — Varför passar annonsen mig?
 *
 * En knapp och en utfällbar panel som lägger ditt CV bredvid annonsen, rad för
 * rad: det som stämmer (med citat ur både annonsen och CV:t) och det vi inte
 * hittar i CV:t (med citat ur annonsen). Inget procenttal och ingen "bra/dålig
 * match": en rad är ett skäl, inte ett betyg.
 *
 * Ärlighetsreglerna bor på servern (`RESPONSE_VALIDATORS['annons-matchning']`):
 * en rad vars citat inte står ordagrant i annonsen respektive CV:t kommer aldrig
 * hit. "Saknas" betyder att vi inte hittar det i CV:t, inte att du saknar det —
 * panelen säger det och pekar på CV-byggaren.
 */

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Target, Loader2, AlertCircle, Check, Minus } from '@/components/ui/icons'
import { hamtaMatchskal, type MatchSkal, type Matchskal } from '@/services/matchskalApi'
import type { AnnonsUnderlag } from '@/services/ansokanAiApi'
import { cn } from '@/lib/utils'

/** Under det här finns inget att jämföra (tom eller bara en rubrik). */
const MIN_TECKEN = 40

interface Props {
  annons: AnnonsUnderlag
  storlek?: 'kort' | 'stor'
  className?: string
}

export function AnnonsMatchning({ annons, storlek = 'stor', className }: Props) {
  const { t } = useTranslation()
  const panelId = useId()
  const [oppen, setOppen] = useState(false)
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [data, setData] = useState<Matchskal | null>(null)

  if (annons.text.trim().length < MIN_TECKEN) return null

  const hamta = async () => {
    setLaddar(true)
    setFel(null)
    try {
      setData(await hamtaMatchskal(annons))
    } catch (e) {
      setFel(e instanceof Error && e.message ? e.message : t('annonsMatchning.fel', 'Det gick inte att jämföra just nu. Försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  const vaxla = () => {
    const nasta = !oppen
    setOppen(nasta)
    if (nasta && !data && !laddar) void hamta()
  }

  const skal = data && 'skal' in data ? data.skal : null
  const traffar = skal?.filter((s) => s.typ === 'traffar') ?? []
  const saknas = skal?.filter((s) => s.typ === 'saknas') ?? []

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
        <Target size={storlek === 'kort' ? 16 : 18} aria-hidden="true" />
        {t('annonsMatchning.knapp', 'Varför passar annonsen mig?')}
      </button>

      {oppen && (
        <div
          id={panelId}
          role="region"
          aria-label={t('annonsMatchning.region', 'Ditt CV mot annonsen')}
          onClick={(e) => e.stopPropagation()}
          className="col-span-full w-full basis-full cursor-default rounded-xl border border-stone-200 bg-white p-4 text-left text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        >
          {laddar && (
            <p role="status" className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('annonsMatchning.laddar', 'Läser annonsen och ditt CV …')}
            </p>
          )}

          {fel && !laddar && (
            <div role="alert" className="flex items-start gap-2 text-stone-800 dark:text-stone-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p>{fel}</p>
                <button type="button" onClick={() => void hamta()} className="mt-1 font-medium underline">
                  {t('annonsMatchning.proviIgen', 'Försök igen')}
                </button>
              </div>
            </div>
          )}

          {data && 'inteCv' in data && !laddar && (
            <p>
              {t('annonsMatchning.inteCv', 'Vi har inget CV att jämföra med än. När du skrivit några rader i ditt CV kan vi visa vad som stämmer med annonsen.')}{' '}
              <Link to="/cv" className="font-medium underline">
                {t('annonsMatchning.tillCv', 'Gå till ditt CV')}
              </Link>
            </p>
          )}

          {skal && !laddar && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('annonsMatchning.ansvar', 'En AI har jämfört, originalet gäller. Det är inget betyg på dig.')}
              </p>

              {skal.length === 0 && (
                <p>
                  {t('annonsMatchning.tomt', 'Vi hittade inget vi kunde peka ut säkert. Läs annonsen själv och jämför med ditt CV.')}
                </p>
              )}

              {traffar.length > 0 && (
                <section>
                  <h4 className="mb-1.5 font-semibold">{t('annonsMatchning.traffar', 'Det här stämmer med ditt CV')}</h4>
                  <ul className="space-y-2.5">
                    {traffar.map((s, i) => (
                      <SkalRad key={`t${i}`} skal={s} />
                    ))}
                  </ul>
                </section>
              )}

              {saknas.length > 0 && (
                <section>
                  <h4 className="mb-1.5 font-semibold">{t('annonsMatchning.saknas', 'Det här hittar vi inte i ditt CV')}</h4>
                  <ul className="space-y-2.5">
                    {saknas.map((s, i) => (
                      <SkalRad key={`s${i}`} skal={s} />
                    ))}
                  </ul>
                  <p className="mt-2 text-stone-700 dark:text-stone-300">
                    {t('annonsMatchning.saknasTips', 'Har du det ändå? Lägg till det i ditt CV. Du behöver inte uppfylla allt för att söka.')}
                  </p>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SkalRad({ skal }: { skal: MatchSkal }) {
  const { t } = useTranslation()
  const Ikon = skal.typ === 'traffar' ? Check : Minus
  return (
    <li>
      <p className="flex items-start gap-2">
        <Ikon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{skal.punkt}</span>
      </p>
      <Citat etikett={t('annonsMatchning.iAnnonsen', 'Så står det i annonsen:')} text={skal.annons} />
      {skal.typ === 'traffar' && skal.cv && (
        <Citat etikett={t('annonsMatchning.iCv', 'Så står det i ditt CV:')} text={skal.cv} />
      )}
    </li>
  )
}

function Citat({ etikett, text }: { etikett: string; text: string }) {
  return (
    <p className="ml-6 mt-0.5 border-l-2 border-stone-300 pl-2 text-xs italic text-stone-600 dark:border-stone-600 dark:text-stone-400">
      <span className="not-italic font-medium">{etikett} </span>
      “{text}”
    </p>
  )
}

export default AnnonsMatchning
