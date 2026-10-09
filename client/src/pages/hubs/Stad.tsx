/**
 * Staden — Översiktens startbild (spår JS, beslut Mikael 2026-10-09).
 *
 * En liten svensk stad där varje hubb är en plats: Stationen (Söka jobb),
 * Utsikten (Karriär), Biblioteket (Resurser) och Hemma (Din vardag). Andreas
 * står i staden och säger vad som är ett bra nästa steg; platsen där steget
 * finns får en "!" som pulserar. Klick på en plats öppnar en ruta med vad som
 * finns där.
 *
 * Tiden följer klockan (morgon/kväll) och bilden följer grafikstilen. Inga
 * siffror som inte finns i datan: markörernas statusrad kommer ur samma
 * kategorier som korten nedanför (byggKategorier), och saknas den står bara
 * platsens namn. Medan datan hämtas står staden tyst — ingen "!", ingen
 * replik (laddning är inte tomhet).
 *
 * På mobil är scenen ett band utan markörer; platserna står som kort under
 * (OversiktPanel), och dialogrutan lägger sig halvvägs över bandets kant.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, X } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { datumSprak } from '@/lib/datumsprak'
import { getDomainForPath } from '@/lib/domains'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { navHubs } from '@/components/layout/navigation'
import { useVarld } from '@/hooks/useVarld'
import {
  HUBBPLATSER,
  MARKORER,
  PLATSER,
  platsForDomain,
  scenSrc,
  type HubbPlatsId,
} from '@/data/varld'
import { Foremal } from '@/components/varld/Foremal'
import { useEgenHalsning } from '@/components/varld/halsningPlats'
import RadgivarHalsning from '@/components/radgivare/RadgivarHalsning'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { valjNastaSteg } from './nastaStegRegler'
import { byggKategorier, type PanelTillstand } from './oversiktKategorier'

function halsningFor(now: Date, t: (k: string, d: string) => string) {
  const h = now.getHours()
  if (h >= 5 && h < 10) return t('hubOverview.goodMorning', 'God morgon')
  if (h >= 17 && h < 24) return t('hubOverview.goodEvening', 'God kväll')
  return t('hubOverview.hello', 'Hej')
}

export default function Stad({
  summary,
  tillstand,
  fornamn,
}: {
  summary: OversiktSummary | undefined
  tillstand: PanelTillstand
  fornamn: string | null
}) {
  const { t, i18n } = useTranslation()
  const { tid, stil, lugnt } = useVarld()
  const setGrafikstil = useSettingsStore((s) => s.setGrafikstil)
  const radgivarePa = useSettingsStore((s) => s.showCoachWidget)
  const [vald, setVald] = useState<HubbPlatsId | null>(null)
  const klart = tillstand === 'klart' && !!summary
  // EN dialogruta i DOM:en — två hade gett två röster samtidigt.
  const dator = useMediaQuery('(min-width: 1024px)')
  const sprak = datumSprak(i18n.language)

  // Rådgivaren står i staden — Layout ska inte rita en hälsning till.
  useEgenHalsning()

  const forsta = useMemo(() => (klart ? valjNastaSteg(summary)?.primar.till ?? null : null), [klart, summary])
  const [uppdragTill, setUppdragTill] = useState<string | null>(null)
  const aktivtTill = uppdragTill ?? forsta
  const uppdrag: HubbPlatsId | null = useMemo(() => {
    if (!aktivtTill) return null
    const p = platsForDomain(getDomainForPath(aktivtTill)).id
    return p === 'stad' ? null : (p as HubbPlatsId)
  }, [aktivtTill])

  const kategorier = useMemo(
    () => (klart ? byggKategorier(summary, t, tillstand, sprak) : []),
    [klart, summary, t, tillstand, sprak]
  )
  const kategoriFor = (id: HubbPlatsId) => kategorier.find((k) => platsForDomain(k.domain).id === id)

  // Escape stänger platsrutan.
  useEffect(() => {
    if (!vald) return
    const vidTangent = (e: KeyboardEvent) => e.key === 'Escape' && setVald(null)
    window.addEventListener('keydown', vidTangent)
    return () => window.removeEventListener('keydown', vidTangent)
  }, [vald])

  const markorer = MARKORER[`${tid}-${stil}`]
  const idag = new Date()
  const valdPlats = vald ? PLATSER[vald] : null
  const valdKat = vald ? kategoriFor(vald) : undefined

  return (
    <section aria-labelledby="stad-halsning" className="relative">
      <div
        className={cn(
          'relative overflow-hidden rounded-[22px] lg:rounded-[28px] bg-stone-300 dark:bg-stone-800',
          'h-[300px] sm:h-[380px] lg:h-auto lg:aspect-[16/9]',
          'shadow-[0_30px_60px_-30px_rgba(28,25,23,0.65)]'
        )}
      >
        {/* Scenen och markörerna andas tillsammans, så att markörerna står kvar på sina hus. */}
        <div className={cn('absolute inset-0', !lugnt && 'varld-scen')}>
          <img
            src={scenSrc('stad', tid, stil)}
            alt={t('varld.stad.alt', 'En liten svensk stad med station, utsiktstorn, bibliotek och ett gult hus med trädgård')}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[58%_50%] lg:object-center"
          />

          <ul className="hidden lg:block m-0 p-0 list-none" aria-label={t('varld.stad.platser', 'Platser i staden')}>
            {HUBBPLATSER.map((id) => {
              const p = PLATSER[id]
              const [x, y] = markorer[id]
              const arUppdrag = uppdrag === id
              const arVald = vald === id
              const namn = t(p.namnNyckel, p.namnSv)
              const nav = navHubs.find((h) => h.path === p.till)
              const hubb = nav ? t(nav.labelKey, nav.fallbackLabel) : ''
              return (
                <li
                  key={id}
                  data-domain={p.domain}
                  className={cn('absolute', !lugnt && 'varld-markor')}
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}
                >
                  <button
                    type="button"
                    onClick={() => setVald(arVald ? null : id)}
                    aria-pressed={arVald}
                    aria-label={
                      arUppdrag
                        ? t('varld.stad.markorUppdrag', '{{plats}}, {{hubb}} — här finns ditt nästa steg', { plats: namn, hubb })
                        : t('varld.stad.markor', '{{plats}}, {{hubb}}', { plats: namn, hubb })
                    }
                    className="group flex flex-col items-center focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        'flex items-center gap-2.5 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur pl-1.5 pr-4 py-1.5 whitespace-nowrap',
                        'shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] ring-2 transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:-translate-y-1',
                        arVald ? 'ring-[var(--c-solid)]' : 'ring-white/0 group-focus-visible:ring-[var(--c-solid)]'
                      )}
                    >
                      {arUppdrag ? (
                        <span
                          aria-hidden="true"
                          className={cn('grid place-items-center w-9 h-9 rounded-full bg-[var(--c-solid)] text-[var(--c-on-solid)] text-[1.0625rem] font-bold', !lugnt && 'varld-uppdrag')}
                        >
                          !
                        </span>
                      ) : (
                        <Foremal namn={p.foremal} storlek="sm" className="!w-9 !h-9 rounded-full" />
                      )}
                      <span className="flex flex-col items-start leading-tight text-left">
                        <span className="text-[0.75rem] font-medium text-stone-500 dark:text-stone-400">{namn}</span>
                        <span className="text-[0.9375rem] font-bold text-stone-900 dark:text-stone-100">{hubb}</span>
                      </span>
                    </span>
                    <span aria-hidden="true" className="w-0.5 h-5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.4)]" />
                    <span aria-hidden="true" className="w-3 h-3 rounded-full bg-white ring-[3px] ring-[var(--c-solid)] shadow" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Hälsningen. */}
        <div className="absolute left-3 top-3 sm:left-5 sm:top-5 rounded-2xl bg-white/90 dark:bg-stone-900/85 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.4)]">
          <h1 id="stad-halsning" className="m-0 text-[1.5rem] sm:text-[2rem] lg:text-[2.25rem] font-bold tracking-tight leading-tight text-stone-900 dark:text-stone-50">
            {halsningFor(idag, t)}
            {fornamn ? `, ${fornamn}` : ''}
          </h1>
          <p className="m-0 mt-0.5 text-[0.875rem] sm:text-[0.9375rem] text-stone-600 dark:text-stone-300">
            {idag.toLocaleDateString(sprak, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Grafikstilen går att byta direkt i staden. */}
        <div
          role="group"
          aria-label={t('varld.stad.stil', 'Grafikstil')}
          className="hidden sm:flex absolute right-5 bottom-5 rounded-full bg-white/90 dark:bg-stone-900/85 backdrop-blur p-1 shadow-lg"
        >
          {(['mjuk', 'action'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={stil === s}
              onClick={() => setGrafikstil(s)}
              className={cn(
                'h-8 sm:h-9 px-3 sm:px-3.5 rounded-full text-[0.8125rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
                stil === s ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              {s === 'mjuk' ? t('varld.stad.mjuk', 'Mjuk') : t('varld.stad.action', 'Action')}
            </button>
          ))}
        </div>

        {/* Dialogrutan i scenen på dator. */}
        {radgivarePa && dator && (
          <div className="absolute left-5 bottom-5 w-[min(600px,calc(100%-280px))] empty:hidden" data-focus-chrome="radgivare">
            <RadgivarHalsning pathname="/oversikt" variant="flytande" vidByte={setUppdragTill} />
          </div>
        )}

        {/* Platsrutan. */}
        {valdPlats && vald && (
          <div
            role="dialog"
            aria-labelledby="platsruta-rubrik"
            data-domain={valdPlats.domain}
            className="hidden lg:flex absolute right-5 top-5 w-[340px] flex-col gap-3 rounded-[22px] bg-white dark:bg-stone-900/95 backdrop-blur-md p-5 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5)] varld-replik"
          >
            <div className="flex items-start gap-3">
              <Foremal namn={valdPlats.foremal} storlek="md" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[0.8125rem] font-medium text-stone-500 dark:text-stone-400">{t(valdPlats.namnNyckel, valdPlats.namnSv)}</p>
                <h2 id="platsruta-rubrik" className="m-0 text-[1.25rem] font-bold text-stone-900 dark:text-stone-50">
                  {(() => { const nav = navHubs.find((h) => h.path === valdPlats.till); return nav ? t(nav.labelKey, nav.fallbackLabel) : '' })()}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVald(null)}
                aria-label={t('common.close', 'Stäng')}
                className="shrink-0 grid place-items-center w-9 h-9 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            {valdKat && (
              <ul className="m-0 p-0 list-none divide-y divide-stone-100 dark:divide-stone-800">
                {valdKat.rader.map((r) => (
                  <li key={r.till}>
                    <Link to={r.till} className="flex items-center gap-3 py-2.5 no-underline group/rad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-semibold text-stone-900 dark:text-stone-100">{r.titel}</span>
                        <span className="block truncate text-[0.8125rem] text-stone-500 dark:text-stone-400">{r.under}</span>
                      </span>
                      {r.varde && /^\d+$/.test(r.varde) && (
                        <span className="shrink-0 text-[0.9375rem] font-bold text-[var(--c-text)] dark:text-[var(--c-solid)] tabular-nums">{r.varde}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to={valdPlats.till}
              className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-[var(--c-solid)] text-[var(--c-on-solid)] font-semibold no-underline hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
            >
              {t('varld.stad.gaTill', 'Gå till {{plats}}', { plats: t(valdPlats.namnNyckel, valdPlats.namnSv) })}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {/* Mobil och surfplatta: dialogrutan halvvägs över bandets kant. */}
      {radgivarePa && !dator && (
        <div className="relative z-10 -mt-10 px-2 sm:px-6 empty:hidden" data-focus-chrome="radgivare">
          <RadgivarHalsning pathname="/oversikt" variant="flytande" vidByte={setUppdragTill} />
        </div>
      )}
    </section>
  )
}
