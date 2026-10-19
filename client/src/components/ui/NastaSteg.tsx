/**
 * NastaSteg — den enda sak som är viktigast just nu (omtaget "Kvarter", 2026-10-11).
 *
 * Förslagets första princip: "Nästa steg står överst, och det är ett."
 * Rubrik, EN mening och EN primärknapp. Komponenten tar därför bara en
 * `handling` — den kan inte få två primärknappar. Ett andra, vardagligt val
 * får stå som ramad sekundärknapp; allt annat hör hemma i MerMeny.
 *
 *   <NastaSteg
 *     tid="13:00"
 *     rubrik="Markera närvaro för Gruppträff: jobbsökning"
 *     text="Fyra har checkat in själva. Du behöver bara bekräfta."
 *     handling={{ etikett: 'Markera närvaro', onClick: oppna }}
 *   />
 *
 * Skugga (--j-skugga) — det enda i en lista som lyfter. Ärlighet: visa inte
 * komponenten medan datan laddar; den påstår något om användarens dag.
 */
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { KvarterIkon } from './icons/kvarter/KvarterIkon'

export interface NastaStegHandling {
  etikett: string
  onClick: () => void
  disabled?: boolean
  /** Fokusnyckel för pulsen (`data-nasta-steg`, se components/nastasteg/NastaSteg.tsx). */
  fokus?: string
}

export interface NastaStegProps {
  rubrik: string
  /** En mening. Fler meningar = flytta texten bakom en "Så räknas det"-länk. */
  text?: string
  /** Huvudhandlingen — den enda primärknappen. */
  handling: NastaStegHandling
  /** Valfri sekundär (ramad) handling, t.ex. "Jag kan inte komma". */
  sekundar?: NastaStegHandling
  /** Etikett överst. Standard: "Nästa steg". */
  etikett?: string
  /** Tid eller kort tillägg efter etiketten: "Nästa steg · 13:00". */
  tid?: string
  /** Rubriknivå i sidans hierarki. Standard 2. */
  niva?: 2 | 3
  /** Plats för t.ex. initialer eller en kort lista under texten. */
  children?: ReactNode
  className?: string
}

export function NastaSteg({
  rubrik,
  text,
  handling,
  sekundar,
  etikett,
  tid,
  niva = 2,
  children,
  className,
}: NastaStegProps) {
  const { t } = useTranslation()
  const rubrikId = useId()
  const Rubrik = niva === 3 ? 'h3' : 'h2'
  const overst = etikett ?? t('kvarter.nastaSteg', 'Nästa steg')
  return (
    <section
      aria-labelledby={rubrikId}
      className={cn(
        'grid gap-3.5 p-5 sm:p-[22px]',
        'bg-[var(--j-kort)] text-[var(--j-blak)] border border-[var(--j-linje)]',
        'rounded-[var(--j-r-m)] shadow-[var(--j-skugga)]',
        className,
      )}
    >
      <p className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-[var(--j-glod)]">
        <KvarterIkon namn="nasta" size={18} ton="glod" />
        <span>
          {overst}
          {tid ? ` · ${tid}` : ''}
        </span>
      </p>
      <Rubrik
        id={rubrikId}
        className="m-0 font-rubrik text-[1.375rem] sm:text-[1.45rem] leading-[1.15] font-bold text-[var(--j-blak)]"
      >
        {rubrik}
      </Rubrik>
      {text ? <p className="m-0 text-[0.9375rem] leading-[1.45] text-[var(--j-blak-2)]">{text}</p> : null}
      {children}
      <div className="flex flex-wrap gap-2.5">
        <Button
          ton="kvarter"
          variant="primary"
          onClick={handling.onClick}
          disabled={handling.disabled}
          data-nasta-steg={handling.fokus}
          className="w-full sm:w-auto"
        >
          {handling.etikett}
        </Button>
        {sekundar ? (
          <Button
            ton="kvarter"
            variant="secondary"
            onClick={sekundar.onClick}
            disabled={sekundar.disabled}
            className="w-full sm:w-auto"
          >
            {sekundar.etikett}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export default NastaSteg
