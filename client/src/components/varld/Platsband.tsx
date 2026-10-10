/**
 * Platsbandet — överst på varje verktygssida (spår JS, 2026-10-09).
 *
 * Säger var i staden man är: platsens scen (samma tid och grafikstil som
 * Översikt), en skylt tillbaka till platsen och sidans rubrik. Rådgivarens
 * dialogruta står precis under, halvvägs ut över kanten.
 *
 * Höjden är ett golv, inte ett tak, och bandet håller luft i nederkant där
 * rutan lägger sig: med större text eller en lång rubrik på mobil gled
 * underrubriken annars in under rutan (mobilgenomgången 2026-10-10).
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { scenSrc, scenFokus, type Plats } from '@/data/varld'
import { useVarld } from '@/hooks/useVarld'
import { Foremal } from './Foremal'

/**
 * Skrim över scenen så att den vita rubriken alltid går att läsa. Inline med
 * flit: lint-regeln mot gradienter tillåter dem på dekorativa scenbilder.
 */
const SKRIM = {
  backgroundImage:
    'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 75%), linear-gradient(0deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%)',
}

export function Platsskylt({ plats, className }: { plats: Plats; className?: string }) {
  const { t } = useTranslation()
  const namn = t(plats.namnNyckel, plats.namnSv)
  return (
    <Link
      to={plats.till}
      aria-label={t('varld.tillbakaTill', 'Tillbaka till {{plats}}', { plats: namn })}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-stone-900/85 backdrop-blur pl-1 pr-3 py-1 text-[0.8125rem] font-semibold text-stone-800 dark:text-stone-100 no-underline shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
        className
      )}
    >
      <Foremal namn={plats.foremal} storlek="xs" className="rounded-full" />
      <ChevronLeft className="w-3.5 h-3.5 -mx-0.5" aria-hidden="true" />
      {namn}
    </Link>
  )
}

export function Platsband({
  plats,
  titel,
  underrubrik,
}: {
  plats: Plats
  titel?: string
  underrubrik?: string
}) {
  const { tid, stil, lugnt } = useVarld()
  return (
    <div className="relative overflow-hidden rounded-[24px] min-h-[170px] sm:min-h-[200px] lg:min-h-[230px] bg-stone-300 dark:bg-stone-800 shadow-[0_18px_40px_-24px_rgba(28,25,23,0.6)]">
      <img
        src={scenSrc(plats.id, tid, stil)}
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{ objectPosition: scenFokus(plats.id, tid, stil) }}
        className={cn('absolute inset-0 h-full w-full object-cover', !lugnt && 'varld-scen')}
      />
      {/* Läsbarheten får inte bero på vad bildgeneratorn råkade lägga där. */}
      <div aria-hidden="true" className="absolute inset-0" style={SKRIM} />
      <div className="relative flex flex-col items-start gap-2 sm:gap-3 p-4 pb-9 sm:p-5 sm:pb-10 lg:p-6 lg:pb-10">
        <Platsskylt plats={plats} />
        {titel && (
          <div className="max-w-[60ch]">
            <h1 className="m-0 text-[1.5rem] sm:text-[1.875rem] lg:text-[2.125rem] font-bold tracking-tight leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
              {titel}
            </h1>
            {underrubrik && (
              <p className="m-0 mt-1 text-[0.9375rem] sm:text-[1rem] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)] line-clamp-1">
                {underrubrik}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
