/**
 * Ett föremål ur staden — ett fotograferat ting på en varm platta (spår JS).
 * Alltid dekor: det som föremålet står för sägs av texten bredvid.
 */
import { cn } from '@/lib/utils'
import { foremalSrc } from '@/data/varld'

const STORLEK = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-10 h-10 rounded-xl',
  md: 'w-14 h-14 rounded-2xl',
  lg: 'w-16 h-16 rounded-2xl',
} as const

export function Foremal({
  namn,
  storlek = 'md',
  className,
}: {
  namn: string
  storlek?: keyof typeof STORLEK
  className?: string
}) {
  return (
    <img
      src={foremalSrc(namn)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={cn('shrink-0 object-cover bg-[#F4F1EA] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]', STORLEK[storlek], className)}
    />
  )
}
