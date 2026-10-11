/**
 * MerRad — en rad som fälls ut (omtaget steg 6, 2026-10-11).
 *
 * Förslagets princip "allt ska finnas, men ett klick bort": närvarointyget,
 * planen och jobbsökandet i Min vecka, och delningen, läsloggen och
 * uppsägningen på Min konsulent, står som en rad var. Raden är en riktig
 * <details>/<summary> — tangentbord, skärmläsare och "utfälld/hopfälld"
 * kommer från webbläsaren, inte från egen kod.
 *
 * Rubriken är en h3 i summary, så sidans rubrikhierarki håller och raden går
 * att hoppa till med rubrikgenvägen. Hela summary är tryckytan (minst 56 px).
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import type { KvarterNamn } from '@/components/ui/icons/kvarter/ritningar'

interface Props {
  ikon: KvarterNamn
  rubrik: string
  /** En kort rad under rubriken — vad som finns bakom. */
  text?: string
  /** Öppen från början (t.ex. när en notis länkar hit). */
  oppen?: boolean
  children: ReactNode
  className?: string
  'data-testid'?: string
}

export function MerRad({ ikon, rubrik, text, oppen, children, className, ...rest }: Props) {
  return (
    <details
      open={oppen}
      data-testid={rest['data-testid']}
      className={cn('group border-b border-j-linje last:border-b-0', className)}
    >
      <summary
        className={cn(
          'flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5',
          '[&::-webkit-details-marker]:hidden',
          'hover:bg-j-sankt focus:outline-none focus-visible:outline focus-visible:outline-[3px]',
          'focus-visible:-outline-offset-[3px] focus-visible:outline-[var(--j-fokus)]',
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-j-s bg-j-gran-mjuk text-j-blak">
          <KvarterIkon namn={ikon} size={22} ton="gran" />
        </span>
        <span className="min-w-0 flex-1">
          <h3 className="m-0 text-base font-semibold leading-6 text-j-blak">{rubrik}</h3>
          {text ? <span className="block text-[0.9375rem] leading-5 text-j-blak-2">{text}</span> : null}
        </span>
        <KvarterIkon
          namn="pil"
          size={20}
          className="shrink-0 text-j-blak-3 transition-transform group-open:rotate-90 motion-reduce:transition-none"
        />
      </summary>
      <div className="px-4 pb-5 pt-1 sm:px-5">{children}</div>
    </details>
  )
}

/** Listan som raderna står i — en yta, inga kort i kort. */
export function MerLista({ rubrik, rubrikId, children }: { rubrik: string; rubrikId: string; children: ReactNode }) {
  return (
    <section aria-labelledby={rubrikId} className="space-y-2">
      <h2 id={rubrikId} className="m-0 px-1 font-rubrik text-lg font-bold text-j-blak">
        {rubrik}
      </h2>
      <div className="overflow-hidden rounded-j-m border border-j-linje bg-j-kort">{children}</div>
    </section>
  )
}
