/**
 * NarvaroVal — en riktig radiogrupp för närvaro (omtaget "Kvarter", 2026-10-11).
 *
 * WAI-ARIA APG, radio group:
 *   - role="radiogroup" med namn, role="radio" + aria-checked per val
 *   - EN tabbstopp: det valda alternativet, eller det första om inget är valt
 *   - Pil höger/ned → nästa, pil vänster/upp → föregående (runt), Home/End;
 *     piltangenten flyttar fokus OCH väljer, som en vanlig radioknapp
 *   - Mellanslag väljer det fokuserade alternativet
 *
 * Valen kommer från props, så kundtypen styr orden. Statusen styr färg och
 * ikon, och det valda alternativet bär alltid ordet — aldrig bara färg.
 *
 *   <NarvaroVal
 *     etikett="Närvaro för Leila Haddad"
 *     alternativ={NARVARO_STANDARDVAL}
 *     varde={rad.attendance}
 *     onChange={(v) => spara(rad.id, v)}
 *   />
 */
import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { KvarterIkon } from './icons/kvarter/KvarterIkon'
import { KVARTER_FOKUS, STATUS_IKON, statusFarg, type NarvaroAlternativ } from './kvarterStatus'

export interface NarvaroValProps {
  /** Gruppens namn för skärmläsare, t.ex. "Närvaro för Leila Haddad". */
  etikett: string
  alternativ: readonly NarvaroAlternativ[]
  /** Valt värde, eller null om inget är markerat än. */
  varde: string | null
  onChange: (varde: string) => void
  disabled?: boolean
  className?: string
}

export function NarvaroVal({ etikett, alternativ, varde, onChange, disabled, className }: NarvaroValProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const valtIndex = alternativ.findIndex((a) => a.varde === varde)
  const tabbIndex = valtIndex >= 0 ? valtIndex : 0

  const valj = (index: number) => {
    const alt = alternativ[index]
    if (!alt || disabled) return
    refs.current[index]?.focus()
    if (alt.varde !== varde) onChange(alt.varde)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = alternativ.length
    let mal: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        mal = (index + 1) % n
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        mal = (index - 1 + n) % n
        break
      case 'Home':
        mal = 0
        break
      case 'End':
        mal = n - 1
        break
      case ' ':
        mal = index
        break
      default:
        return
    }
    e.preventDefault()
    valj(mal)
  }

  return (
    <div
      role="radiogroup"
      aria-label={etikett}
      aria-disabled={disabled || undefined}
      className={cn(
        'inline-flex flex-wrap overflow-hidden rounded-[var(--j-r-m)]',
        'border border-[var(--j-linje-2)] bg-[var(--j-kort)]',
        className,
      )}
    >
      {alternativ.map((alt, i) => {
        const valt = i === valtIndex
        const farg = statusFarg(alt.status)
        return (
          <button
            key={alt.varde}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={valt}
            tabIndex={i === tabbIndex ? 0 : -1}
            disabled={disabled}
            data-status={alt.status}
            onClick={() => valj(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-[40px]',
              'text-[0.875rem] font-semibold whitespace-nowrap',
              'border-r border-[var(--j-linje-2)] last:border-r-0',
              'disabled:cursor-not-allowed disabled:opacity-60',
              valt ? '' : 'text-[var(--j-blak-2)] hover:bg-[var(--j-sankt)]',
              KVARTER_FOKUS,
              'focus-visible:z-10 focus-visible:outline-offset-[-3px]',
            )}
            style={valt ? { backgroundColor: farg.bg, color: farg.text } : undefined}
          >
            <KvarterIkon namn={STATUS_IKON[alt.status]} size={16} ton={valt ? alt.status : undefined} />
            {alt.etikett}
          </button>
        )
      })}
    </div>
  )
}

export default NarvaroVal
