/**
 * MerMeny — sekundära och oåterkalleliga handlingar (omtaget "Kvarter", 2026-10-11).
 *
 * Förslagets knappregel: en fylld primärknapp, en ramad, resten här.
 * "Avsluta plan" och "Registrera placering" ska aldrig stå bredvid de
 * vardagliga knapparna. Val med `farlig: true` hamnar sist, efter en
 * avdelare, i Ogiltig-färgen.
 *
 * Bygger på DropdownMenu (menu button-mönstret: aria-haspopup, piltangenter,
 * Esc tillbaka till knappen) med utseende="kvarter".
 *
 *   <MerMeny val={[
 *     { etikett: 'Plan som PDF', ikon: 'dokument', onClick: pdf },
 *     { etikett: 'Avsluta plan', farlig: true, onClick: avsluta },
 *   ]} />
 */
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'
import { KvarterIkon } from './icons/kvarter/KvarterIkon'
import type { KvarterNamn } from './icons/kvarter/ritningar'

export interface MerMenyVal {
  etikett: string
  onClick: () => void
  ikon?: KvarterNamn
  /** Oåterkallelig handling — läggs sist, avskild, i varningsfärg. */
  farlig?: boolean
  disabled?: boolean
}

export interface MerMenyProps {
  val: readonly MerMenyVal[]
  /** Knappens text. Standard: "Mer". */
  etikett?: string
  /** Bara ikonen synlig (etiketten blir aria-label). Standard: text syns. */
  baraIkon?: boolean
  align?: 'start' | 'end'
  className?: string
}

export function MerMeny({ val, etikett, baraIkon = false, align = 'end', className }: MerMenyProps) {
  const { t } = useTranslation()
  const text = etikett ?? t('kvarter.mer', 'Mer')
  const vanliga = val.filter((v) => !v.farlig)
  const farliga = val.filter((v) => v.farlig)

  if (val.length === 0) return null

  const rad = (v: MerMenyVal) => (
    <DropdownMenuItem key={v.etikett} utseende="kvarter" onClick={v.onClick} disabled={v.disabled}>
      {v.ikon ? (
        <KvarterIkon namn={v.ikon} size={20} ton={v.farlig ? 'ogiltig' : undefined} />
      ) : (
        <span aria-hidden="true" className="w-5" />
      )}
      <span className={v.farlig ? 'text-[var(--s-ogiltig-text)] font-semibold' : undefined}>{v.etikett}</span>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ton="kvarter"
          variant="tertiary"
          size="sm"
          className={className}
          aria-label={baraIkon ? text : undefined}
          leftIcon={<KvarterIkon namn="mer" size={20} />}
        >
          {baraIkon ? null : text}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent utseende="kvarter" align={align}>
        {vanliga.map(rad)}
        {vanliga.length > 0 && farliga.length > 0 ? <DropdownMenuSeparator utseende="kvarter" /> : null}
        {farliga.map(rad)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MerMeny
