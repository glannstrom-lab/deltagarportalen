import { cn } from '@/lib/utils'
import { PART_COLORS } from '../enrollmentDisplay'

export function PartChip({ part, size = 'sm' }: { part: 1 | 2 | 3 | 4; size?: 'xs' | 'sm' }) {
  const c = PART_COLORS[part]
  const isXs = size === 'xs'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border flex-shrink-0 whitespace-nowrap',
        isXs ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        c.bgSolid, c.text, c.border,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold',
          isXs ? 'w-3.5 h-3.5 text-[9px]' : 'w-4 h-4 text-[10px]',
          'bg-white/80',
        )}
      >
        {part}
      </span>
      {c.name}
    </span>
  )
}


