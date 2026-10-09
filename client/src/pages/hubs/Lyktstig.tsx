/**
 * Din väg hittills — det du har gjort som tända lyktor (spår JS, 2026-10-09).
 *
 * Varje lykta är något som FINNS i datan: ett CV, en ansökan, ett brev, en
 * intervjuövning, ett karriärmål, en kompetensanalys, ett AI-samtal, en
 * färdigläst guide, en dagboksanteckning, en måendelogg. Ingen lykta tänds av
 * att man varit inloggad, och ingen räknas: det står aldrig "3 av 10" — den
 * släckta lyktan är ett förslag, inte en skuld ("när du orkar").
 *
 * Medan datan hämtas ritas ingenting (laddning är inte tomhet).
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { datumSprak } from '@/lib/datumsprak'
import { useSettingsStore } from '@/stores/settingsStore'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { Foremal } from '@/components/varld/Foremal'
import { byggLyktor, type Slackt } from './lyktor'
import type { PanelTillstand } from './OversiktPanel'

function Lampa({ tand }: { tand: boolean }) {
  const lugnt = useSettingsStore((s) => s.calmMode)
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-10 grid place-items-center w-9 h-9 rounded-full shrink-0',
        tand
          ? cn('bg-[#FCE6B8] text-[#8B5418] dark:bg-[#5a3d12] dark:text-[#FCE6B8]', !lugnt && 'varld-lykta-tand')
          : 'bg-stone-100 text-stone-400 border-2 border-dashed border-stone-300 dark:bg-stone-800 dark:border-stone-600'
      )}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v2M14 3v2" />
        <rect x="7" y="5" width="10" height="14" rx="2" />
        <path d="M12 10c1.2 1.3 1.2 3 0 4-1.2-1-1.2-2.7 0-4z" fill={tand ? 'currentColor' : 'none'} />
        <path d="M9 21h6" />
      </svg>
    </span>
  )
}

export default function Lyktstig({
  summary,
  tillstand,
}: {
  summary: OversiktSummary | undefined
  tillstand: PanelTillstand
}) {
  const { t, i18n } = useTranslation()
  if (tillstand !== 'klart' || !summary) return null
  const { tanda, nasta } = byggLyktor(summary, t, datumSprak(i18n.language))
  const rader = [...tanda.map((l) => ({ ...l, tand: true as const })), ...(nasta ? [{ ...nasta, tand: false as const }] : [])]

  return (
    <section
      aria-labelledby="lyktstig-rubrik"
      data-testid="lyktstig"
      className="rounded-[22px] bg-white dark:bg-stone-900 ring-1 ring-stone-200/80 dark:ring-stone-700 p-5 sm:p-6 shadow-[0_16px_36px_-24px_rgba(28,25,23,0.35)]"
    >
      <div className="flex items-center gap-3.5 mb-4">
        <Foremal namn="lykta" storlek="md" />
        <div>
          <h2 id="lyktstig-rubrik" className="m-0 text-[1.25rem] font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {t('varld.lykta.rubrik', 'Din väg hittills')}
          </h2>
          <p className="m-0 text-[0.875rem] text-stone-500 dark:text-stone-400">
            {tanda.length > 0
              ? t('varld.lykta.under', 'Varje sak du har gjort tänder en lykta')
              : t('varld.lykta.underTom', 'Din första lykta väntar på dig')}
          </p>
        </div>
      </div>
      <ol className="m-0 p-0 list-none">
        {rader.map((r, i) => (
          <li key={r.id} className="relative flex gap-3.5 pb-4 last:pb-0">
            {i < rader.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[17px] top-9 bottom-0 w-0.5',
                  rader[i + 1].tand ? 'bg-[#E9C27A]' : 'bg-stone-200 dark:bg-stone-700'
                )}
              />
            )}
            <Lampa tand={r.tand} />
            <div className="min-w-0 pt-1.5">
              {r.tand ? (
                <>
                  <p className="m-0 text-[0.9375rem] font-semibold text-stone-900 dark:text-stone-100">{r.titel}</p>
                  {'nar' in r && r.nar && <p className="m-0 text-[0.8125rem] text-stone-500 dark:text-stone-400">{r.nar}</p>}
                </>
              ) : (
                <>
                  <Link
                    to={(r as Slackt).till}
                    className="text-[0.9375rem] font-semibold text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:underline underline-offset-2"
                  >
                    {r.titel}
                  </Link>
                  <p className="m-0 text-[0.8125rem] text-stone-500 dark:text-stone-400">
                    {t('varld.lykta.narDuOrkar', 'Nästa lykta att tända — när du orkar')}
                  </p>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
      <Link
        to="/oversikt/historik"
        className="mt-4 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:underline underline-offset-2"
      >
        {t('hubOverview.seeHistory', 'Se allt du har gjort')} <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}
