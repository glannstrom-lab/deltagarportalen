/**
 * Marknadsdata — löneläget per yrkesområde och region.
 *
 * Vad som ändrades 2026-08-20, och varför:
 *
 * · Sidan sa "Data baseras på branschrapporter, SCB-statistik och
 *   löneundersökningar. Senast uppdaterad: Q1 2026". Ingenting hämtades:
 *   alla tal var literaler i den här filen, oförändrade sedan 2026-03-18.
 *   Nu står det vad de är, och var riktig statistik finns.
 * · Sju av tretton branscher visade NEDÅTPIL bredvid en positiv löneökning,
 *   eftersom pilen valdes av `change >= 3` i stället för av tecknet. Vård,
 *   bygg, utbildning och handel såg alltså ut att ha sjunkande löner.
 *   Löneökningstalen hade ingen källa alls och är borttagna — en prognos med
 *   en decimal är ett påstående, inte en dekoration.
 * · Regionerna visade "+15 %" bredvid "48 000 kr" där talen kom från två
 *   oberoende literaler som inte stämde överens (48 000/40 000 = +20 %).
 *   Båda härleds nu ur samma tabell.
 * · Min/max räknades som median × 0,8 respektive × 1,3 i renderingen, vilket
 *   gav IT-taket 67 600 kr medan kalkylatorfliken sa 85 000 för samma
 *   bransch. Båda läser nu `data/lonedata.ts`.
 */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Building2, MapPin, ChevronDown, Info, ExternalLink } from '@/components/ui/icons'
import { Card } from '@/components/ui'
import { EmptySearch } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  YRKESOMRADEN, LONEREGIONER, EXTERNA_LONEKALLOR,
  riksmedian, regionmedian,
} from '@/data/lonedata'

type Vy = 'bransch' | 'region'
type Sortering = 'median' | 'namn'

export default function MarketDataTab() {
  const { t, i18n } = useTranslation()
  const [vy, setVy] = useState<Vy>('bransch')
  const [sok, setSok] = useState('')
  const [sortering, setSortering] = useState<Sortering>('median')
  const [oppen, setOppen] = useState<string | null>(null)

  const sprak = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'
  const kr = (n: number) => n.toLocaleString(sprak)

  const namnFor = (nyckel: string, fallback: string, typ: 'occupations' | 'regions') =>
    t(`salary.data.${typ}.${nyckel}`, fallback)

  const branscher = useMemo(() => {
    const sokord = sok.trim().toLowerCase()
    const lista = YRKESOMRADEN.filter(y =>
      !sokord || namnFor(y.nyckel, y.namn, 'occupations').toLowerCase().includes(sokord),
    )
    return [...lista].sort((a, b) =>
      sortering === 'median'
        ? b.median - a.median
        : namnFor(a.nyckel, a.namn, 'occupations').localeCompare(namnFor(b.nyckel, b.namn, 'occupations'), sprak),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sok, sortering, i18n.language])

  const regioner = useMemo(() => {
    const sokord = sok.trim().toLowerCase()
    const lista = LONEREGIONER.filter(r =>
      !sokord || namnFor(r.nyckel, r.namn, 'regions').toLowerCase().includes(sokord),
    )
    return [...lista].sort((a, b) => b.justeringProcent - a.justeringProcent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sok, i18n.language])

  const hogstaMedian = Math.max(...YRKESOMRADEN.map(y => y.median))
  const riks = riksmedian()

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {t('salary.marketData.description')}
      </p>

      {/* Vyväxlare */}
      <div className="flex gap-2" role="group" aria-label={t('salary.marketData.viewSwitchLabel')}>
        {(['bransch', 'region'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setVy(v); setOppen(null) }}
            aria-pressed={vy === v}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
              vy === v
                ? 'bg-[var(--c-solid)] text-white'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700',
            )}
          >
            {v === 'bransch'
              ? <Building2 className="w-4 h-4" aria-hidden="true" />
              : <MapPin className="w-4 h-4" aria-hidden="true" />}
            {t(`salary.marketData.view.${v}`)}
          </button>
        ))}
      </div>

      {/* Sök */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" aria-hidden="true" />
        <input
          type="search"
          value={sok}
          onChange={(e) => setSok(e.target.value)}
          aria-label={t(vy === 'bransch' ? 'salary.marketData.searchIndustry' : 'salary.marketData.searchRegion')}
          placeholder={t(vy === 'bransch' ? 'salary.marketData.searchIndustry' : 'salary.marketData.searchRegion')}
          className="w-full pl-9 pr-3 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-[var(--c-solid)] focus:border-[var(--c-solid)]"
        />
      </div>

      {vy === 'bransch' ? (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('salary.marketData.medianByIndustry')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
              {t('salary.marketData.resultCount', { count: branscher.length })}
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            {(['median', 'namn'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortering(s)}
                aria-pressed={sortering === s}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm min-h-[44px]',
                  sortering === s
                    ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-text)] font-medium'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700',
                )}
              >
                {t(`salary.marketData.sortBy.${s}`)}
              </button>
            ))}
          </div>

          {branscher.length === 0 ? (
            <EmptySearch query={sok} onClear={() => setSok('')} />
          ) : (
            <ul className="space-y-3">
              {branscher.map((y) => {
                const isOppen = oppen === y.nyckel
                const namn = namnFor(y.nyckel, y.namn, 'occupations')
                return (
                  <li key={y.nyckel}>
                    <button
                      onClick={() => setOppen(isOppen ? null : y.nyckel)}
                      aria-expanded={isOppen}
                      aria-controls={`bransch-${y.nyckel}`}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="flex items-center gap-2 font-medium text-stone-800 dark:text-stone-100">
                          <ChevronDown
                            className={cn('w-4 h-4 transition-transform', isOppen && 'rotate-180')}
                            aria-hidden="true"
                          />
                          {namn}
                        </span>
                        <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                          {kr(y.median)} kr
                        </span>
                      </div>
                      <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--c-solid)]"
                          style={{ width: `${(y.median / hogstaMedian) * 100}%` }}
                        />
                      </div>
                    </button>

                    <div
                      id={`bransch-${y.nyckel}`}
                      hidden={!isOppen}
                      className="mt-3 p-3 rounded-lg bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/40"
                    >
                      <dl className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="text-stone-600 dark:text-stone-300">{t('salary.marketData.low')}</dt>
                          <dd className="font-semibold text-stone-900 dark:text-stone-100">{kr(y.min)} kr</dd>
                        </div>
                        <div>
                          <dt className="text-stone-600 dark:text-stone-300">{t('salary.marketData.median')}</dt>
                          <dd className="font-semibold text-stone-900 dark:text-stone-100">{kr(y.median)} kr</dd>
                        </div>
                        <div>
                          <dt className="text-stone-600 dark:text-stone-300">{t('salary.marketData.high')}</dt>
                          <dd className="font-semibold text-stone-900 dark:text-stone-100">{kr(y.max)} kr</dd>
                        </div>
                      </dl>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                        {t('salary.marketData.rangeNote')}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      ) : (
        <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('salary.marketData.byRegion')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
              {t('salary.marketData.resultCount', { count: regioner.length })}
            </p>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300 mb-4">
            {t('salary.marketData.regionBasis', { median: kr(riks) })}
          </p>

          {regioner.length === 0 ? (
            <EmptySearch query={sok} onClear={() => setSok('')} />
          ) : (
            <ul className="space-y-3">
              {regioner.map((r) => {
                const isOppen = oppen === r.nyckel
                const namn = namnFor(r.nyckel, r.namn, 'regions')
                const median = regionmedian(r)
                // Nollinjen ligger i mitten; stapeln växer åt det håll tecknet pekar.
                const bredd = Math.min(50, Math.abs(r.justeringProcent) * 2.5)
                return (
                  <li key={r.nyckel}>
                    <button
                      onClick={() => setOppen(isOppen ? null : r.nyckel)}
                      aria-expanded={isOppen}
                      aria-controls={`region-${r.nyckel}`}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="flex items-center gap-2 font-medium text-stone-800 dark:text-stone-100">
                          <ChevronDown
                            className={cn('w-4 h-4 transition-transform', isOppen && 'rotate-180')}
                            aria-hidden="true"
                          />
                          {namn}
                        </span>
                        <span className="text-sm text-stone-700 dark:text-stone-200 whitespace-nowrap">
                          {r.justeringProcent > 0 ? '+' : ''}{r.justeringProcent} %
                          <span className="ml-2 font-semibold text-stone-900 dark:text-stone-100">{kr(median)} kr</span>
                        </span>
                      </div>
                      {/* Divergerande stapel med synlig nollinje */}
                      <div className="relative h-2 bg-stone-100 dark:bg-stone-700 rounded-full">
                        <div className="absolute inset-y-0 left-1/2 w-px bg-stone-400 dark:bg-stone-500" aria-hidden="true" />
                        <motion.div
                          className={cn(
                            'absolute inset-y-0 rounded-full',
                            r.justeringProcent >= 0 ? 'bg-[var(--c-solid)]' : 'bg-stone-400 dark:bg-stone-500',
                          )}
                          style={
                            r.justeringProcent >= 0
                              ? { left: '50%', width: `${bredd}%` }
                              : { right: '50%', width: `${bredd}%` }
                          }
                        />
                      </div>
                    </button>

                    <div
                      id={`region-${r.nyckel}`}
                      hidden={!isOppen}
                      className="mt-3 p-3 rounded-lg bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/40 text-sm text-stone-700 dark:text-stone-200"
                    >
                      {t('salary.marketData.regionDetail', {
                        region: namn,
                        percent: `${r.justeringProcent > 0 ? '+' : ''}${r.justeringProcent}`,
                        median: kr(median),
                      })}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}

      {/* Var talen kommer ifrån */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {t('salary.marketData.aboutTitle')}
            </h3>
            <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
              {t('salary.marketData.aboutText')}
            </p>
            <ul className="space-y-2">
              {EXTERNA_LONEKALLOR.map((kalla) => (
                <li key={kalla.nyckel}>
                  <a
                    href={kalla.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline inline-flex items-center gap-1"
                  >
                    {kalla.namn}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">{t('salary.calculator.opensInNewTab')}</span>
                  </a>
                  <span className="text-sm text-stone-700 dark:text-stone-300">
                    {' — '}{t(`salary.data.sources.${kalla.nyckel}`, kalla.beskrivning)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
