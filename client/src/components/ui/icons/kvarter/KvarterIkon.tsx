/**
 * Ikonsetet "Kvarter" (omtaget 2026-10-11) — 32 ikoner på 24-rutnät,
 * 1,75 px linje, rundade ändar, och en fylld detalj som bär betydelsen.
 *
 * API:t följer lucide-react (som `@/components/ui/icons` exporterar), så ett
 * byte är en import:
 *
 *   import { IkonNarvaro } from '@/components/ui/icons/kvarter'
 *   <IkonNarvaro className="w-5 h-5" ton="narvarande" />
 *
 * - `size` (24), `strokeWidth` (1,75), `className` och alla SVG-attribut går igenom.
 * - Dekorativ som standard: `aria-hidden="true"`, precis som lucide.
 * - Meningsbärande: ge `title` (eller `aria-label`) — då blir den role="img".
 * - `ton` färgar BARA den fyllda detaljen; linjen ärver currentColor (bläck).
 */
import { forwardRef } from 'react'
import type { SVGProps } from 'react'
import { RITNINGAR, type KvarterNamn } from './ritningar'
import type { Status } from '../../kvarterStatus'

export type KvarterTon = Status | 'gran' | 'glod'

export interface KvarterIkonProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string
  strokeWidth?: number
  /** Färgar den fyllda detaljen. Utan ton får detaljen samma färg som linjen. */
  ton?: KvarterTon
  /** Gör ikonen meningsbärande (role="img" + <title>). */
  title?: string
}

const TON_VAR: Record<KvarterTon, string> = {
  narvarande: 'var(--s-narvarande-ikon)',
  giltig: 'var(--s-giltig-ikon)',
  ogiltig: 'var(--s-ogiltig-ikon)',
  sjuk: 'var(--s-sjuk-ikon)',
  vantar: 'var(--s-vantar-ikon)',
  planerat: 'var(--s-planerat-ikon)',
  gran: 'var(--j-gran)',
  glod: 'var(--j-glod)',
}

export const KvarterIkon = forwardRef<SVGSVGElement, KvarterIkonProps & { namn: KvarterNamn }>(
  function KvarterIkon(
    { namn, size = 24, strokeWidth = 1.75, ton, title, className, ...rest },
    ref,
  ) {
    const detalj = ton ? TON_VAR[ton] : 'currentColor'
    // Ytan som stansas ur detaljen. Kort-färgen läses från tokens så att
    // bocken i närvaro syns i båda lägena.
    const yta = 'var(--j-kort, #fff)'
    const meningsbarande = Boolean(title || rest['aria-label'] || rest['aria-labelledby'])
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        data-kvarter={namn}
        data-kvarter-ton={ton}
        aria-hidden={meningsbarande ? undefined : true}
        role={meningsbarande ? 'img' : undefined}
        focusable="false"
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {RITNINGAR[namn](detalj, yta)}
      </svg>
    )
  },
)
