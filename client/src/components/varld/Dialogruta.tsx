/**
 * Dialogrutan — rådgivaren som en karaktär i staden (spår JS, 2026-10-09).
 *
 * Samma ruta på varje sida: porträtt, namn, en replik, en knapp, och — på
 * Översikt — "Visa något annat" som bläddrar mellan förslagen. Rösten är
 * förinspelade klipp (`rost.ts`); beteendet är oförändrat från hälsningskortet:
 *
 *   · spelar upp av sig själv en gång per replik och session, aldrig i lugnare
 *     läge och aldrig när rösten är avstängd
 *   · synlig paus medan klippet spelar (WCAG 1.4.2)
 *   · andra besöket står rutan hopfälld till en rad, med knappen kvar
 *
 * Ingen aria-live med flit: en skärmläsare som läser texten samtidigt som
 * rösten talar ger två röster i munnen på varandra.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Pause, Volume2, X, RefreshCw } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { COACHES, type CoachId } from '@/data/coaches'
import { ljudFor } from '@/data/radgivarHalsningar'
import { useInnehall } from '@/data/oversattningar'
import { useSettingsStore } from '@/stores/settingsStore'
import { lasHorda, markeraHord, useRost } from './rost'

export interface Replik {
  /** Klippets nyckel (public/radgivare/ljud/<nyckel>-<sv|en>.mp3) — också "hörd"-nyckeln. */
  nyckel: string
  text: string
  /** Det personliga (t.ex. "Det har gått nio dagar") — står under repliken men läses inte upp,
   *  eftersom klippen aldrig får innehålla personuppgifter. */
  detalj?: string
  knapp: { text: string; till: string } | null
}

interface Props {
  coachId: CoachId
  repliker: Replik[]
  /**
   * 'flytande' ligger ovanpå en scen (skugga, frostat vitt).
   * 'kort' står i flödet, t.ex. under platsbandet.
   */
  variant?: 'flytande' | 'kort'
  /** Meddelar vilken replik som visas — staden flyttar sin "!" efter den. */
  vidByte?: (index: number) => void
  className?: string
}

export function Dialogruta({ coachId, repliker, variant = 'kort', vidByte, className }: Props) {
  const { t, i18n } = useTranslation()
  const sprak = i18n.language?.startsWith('en') ? 'en' : 'sv'
  const COACHES_T = useInnehall('coaches', COACHES, 'COACHES')
  const coach = COACHES_T[coachId]
  const rostPa = useSettingsStore((s) => s.radgivarRost)
  const lugnt = useSettingsStore((s) => s.calmMode)

  const [index, setIndex] = useState(0)
  const replik = repliker[index % repliker.length]
  // Läses en gång — annars fäller rutan ihop sig när klippet tar slut.
  const [redanHord] = useState(() => lasHorda().has(repliker[0].nyckel))
  const [oppen, setOppen] = useState(!redanHord)
  // Bara första repliken startar av sig själv. Den som bläddrar har valt själv
  // och trycker på Lyssna om hen vill höra.
  const autostart = rostPa && !lugnt && !redanHord && index === 0

  const { lage, saknas, vaxla } = useRost(ljudFor(replik.nyckel, sprak), autostart, replik.nyckel)
  const spelar = lage === 'spelar'

  const byt = () => {
    if (spelar) vaxla()
    const nytt = (index + 1) % repliker.length
    setIndex(nytt)
    vidByte?.(nytt)
  }

  const ljudEtikett = spelar
    ? t('radgivare.halsning.pauseShort', 'Pausa')
    : lage === 'klar'
      ? t('radgivare.halsning.again', 'Lyssna igen')
      : t('radgivare.halsning.listenShort', 'Lyssna')

  const yta =
    variant === 'flytande'
      ? 'bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-[0_24px_48px_-16px_rgba(28,25,23,0.45)] ring-1 ring-black/5 dark:ring-white/10'
      : 'bg-white dark:bg-stone-900 shadow-[0_16px_36px_-18px_rgba(28,25,23,0.35)] ring-1 ring-stone-200/80 dark:ring-stone-700'

  if (!oppen) {
    return (
      <div
        data-domain={coach.accent}
        data-testid="radgivar-halsning"
        className={cn('flex items-center gap-3 rounded-full pl-1.5 pr-2 py-1.5', yta, className)}
      >
        <img src={coach.avatarSm} alt="" aria-hidden="true" className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--c-accent)]" />
        <button
          type="button"
          onClick={() => setOppen(true)}
          aria-expanded={false}
          className="min-w-0 flex-1 text-left text-[0.9375rem] text-stone-700 dark:text-stone-300 truncate hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded"
        >
          <span className="font-semibold text-stone-900 dark:text-stone-100">{coach.name}: </span>
          {replik.knapp ? replik.knapp.text : replik.text}
        </button>
        {!saknas && (
          <button
            type="button"
            onClick={vaxla}
            aria-pressed={spelar}
            aria-label={
              spelar
                ? t('radgivare.halsning.pause', 'Pausa {{namn}}', { namn: coach.name })
                : t('radgivare.halsning.listen', 'Lyssna på {{namn}}', { namn: coach.name })
            }
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--c-bg)] text-[var(--c-text)] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
          >
            {spelar ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    )
  }

  return (
    <section
      data-domain={coach.accent}
      data-testid="radgivar-halsning"
      aria-label={t('radgivare.halsning.label', '{{namn}} hälsar', { namn: coach.name })}
      className={cn('relative rounded-[22px] p-4 sm:p-5', yta, className)}
    >
      {/* Porträtt + namnrad överst; repliken under. På mobil tar repliken hela
          bredden — en spalt bredvid porträttet gav fyra ord per rad. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 sm:gap-x-4 gap-y-2">
        <span className="relative shrink-0 sm:row-span-2">
          <img
            src={coach.avatar}
            alt=""
            aria-hidden="true"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-[3px] ring-[var(--c-accent)] shadow-md"
          />
          {spelar && (
            <span aria-hidden="true" className="absolute -inset-1 rounded-full ring-2 ring-[var(--c-solid)]" />
          )}
        </span>

          <div className="flex items-center gap-2 min-w-0 self-center">
            <p className="m-0 min-w-0 flex-1 leading-tight">
              <span className="flex items-center gap-2 font-semibold text-[1rem] text-stone-900 dark:text-stone-100">
                {coach.name}
                {spelar && (
                  <span aria-hidden="true" className="varld-talar inline-flex items-end gap-[3px] h-3">
                    <span /><span /><span />
                  </span>
                )}
              </span>
              <span className="block truncate text-[0.8125rem] text-stone-500 dark:text-stone-400">{coach.role}</span>
            </p>
            {!saknas && (
              <button
                type="button"
                onClick={vaxla}
                aria-pressed={spelar}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[var(--c-bg)] text-[var(--c-text)] text-[0.875rem] font-medium hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
              >
                {spelar ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
                {ljudEtikett}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (spelar) vaxla()
                markeraHord(repliker[0].nyckel)
                setOppen(false)
              }}
              aria-label={t('radgivare.halsning.close', 'Fäll ihop')}
              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="col-span-2 sm:col-span-1 sm:col-start-2 min-w-0">
          <p key={replik.nyckel} className="varld-replik m-0 text-[1rem] sm:text-[1.0625rem] leading-relaxed text-stone-800 dark:text-stone-100 max-w-[62ch]">
            {replik.text}
          </p>
          {replik.detalj && (
            <p className="m-0 mt-1.5 text-[0.875rem] leading-snug text-stone-600 dark:text-stone-400 max-w-[62ch]">
              {replik.detalj}
            </p>
          )}

          {(replik.knapp || repliker.length > 1) && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              {replik.knapp && (
                <Link
                  to={replik.knapp.till}
                  className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-[var(--c-solid)] px-5 text-[0.9375rem] font-semibold text-[var(--c-on-solid)] no-underline shadow-[0_6px_16px_-6px_var(--c-solid)] transition-[filter,transform] hover:brightness-110 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                >
                  {replik.knapp.text}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
              {repliker.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={byt}
                    className="inline-flex items-center gap-2 min-h-11 rounded-xl px-4 text-[0.9375rem] font-semibold text-[var(--c-text)] ring-1 ring-[var(--c-accent)] bg-white dark:bg-stone-900 hover:bg-[var(--c-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    {t('varld.dialog.annat', 'Visa något annat')}
                  </button>
                  <span
                    className="flex gap-1.5 ml-1"
                    role="img"
                    aria-label={t('varld.dialog.forslag', 'Förslag {{nr}} av {{av}}', { nr: (index % repliker.length) + 1, av: repliker.length })}
                  >
                    {repliker.map((r, i) => (
                      <span
                        key={r.nyckel}
                        className={cn(
                          'h-2 rounded-full transition-all',
                          i === index % repliker.length ? 'w-5 bg-[var(--c-solid)]' : 'w-2 bg-[var(--c-accent)]'
                        )}
                      />
                    ))}
                  </span>
                </>
              )}
            </div>
          )}
          </div>
      </div>
    </section>
  )
}
