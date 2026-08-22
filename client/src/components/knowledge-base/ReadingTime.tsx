/**
 * Lästid.
 *
 * FÄRGKODNINGEN ÄR BORTA (2026-08-22). Varianten `detailed` delade in
 * artiklar i "Snabb" (grön), "Medel" (blå) och "Djup" (lila) — tre
 * palettfamiljer som inte finns i tokens, på en sida som redan bar fem andra.
 * Varianten hade dessutom noll anropare. Kvar står det som faktiskt används:
 * en klocka och ett tal.
 *
 * `dark:`-varianterna saknades helt. `text-stone-700` på ett mörkt kort mätte
 * 1,70:1 mot kravet 4,5:1, på 49 noder i kategorivyn.
 *
 * OBS om talet självt: `reading_time` är handskrivet per artikel i databasen
 * och förutsätter i snitt 232 ord/minut (mätt över alla 163 artiklar
 * 2026-08-22) — i överkant redan för en van läsare. Se ROADMAP KB-B.
 */

import { Clock } from '@/components/ui/icons'

interface ReadingTimeProps {
  minutes: number
  showLabel?: boolean
  variant?: 'default' | 'compact'
}

export default function ReadingTime({
  minutes,
  showLabel = true,
  variant = 'default',
}: ReadingTimeProps) {
  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300">
        <Clock size={14} aria-hidden="true" />
        <span>{minutes} min</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
      <Clock size={16} aria-hidden="true" />
      <span className="text-sm">
        {showLabel ? `${minutes} min läsning` : `${minutes} min`}
      </span>
    </span>
  )
}
