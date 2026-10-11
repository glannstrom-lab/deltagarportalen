/**
 * SpaltYta — en yta på deltagarsidan (omtaget "Kvarter", steg 5, 2026-10-11):
 * kort-färg, en linje, stor rundning, rubrik med Kvarter-ikon. Platt — inga
 * kort i kort; det som ligger i ytan skiljs med linjer, inte med nya ramar.
 */
import type { ReactNode } from 'react'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import type { KvarterNamn } from '@/components/ui/icons/kvarter/ritningar'
import { cn } from '@/lib/utils'

export function SpaltYta({ ikon, rubrik, children, testId, className, atgard, rubrikNiva = 3 }: {
  ikon: KvarterNamn
  rubrik: string
  children: ReactNode
  testId?: string
  className?: string
  /** En handling till höger om rubriken, t.ex. "Boka nytt möte". */
  atgard?: ReactNode
  rubrikNiva?: 2 | 3
}) {
  const Rubrik = rubrikNiva === 2 ? 'h2' : 'h3'
  return (
    <section
      className={cn('grid gap-3 p-5 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-l)] text-[var(--j-blak)]', className)}
      data-testid={testId}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Rubrik className="m-0 flex items-center gap-2 font-rubrik text-[1.0625rem] font-bold">
          <KvarterIkon namn={ikon} size={20} ton="gran" />
          {rubrik}
        </Rubrik>
        {atgard}
      </div>
      {children}
    </section>
  )
}
