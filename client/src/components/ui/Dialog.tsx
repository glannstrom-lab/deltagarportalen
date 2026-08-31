/**
 * Dialog — delad primitiv för konsulentvyns modaler (KT1).
 *
 * KT1: ingen av de sju dialogerna i `components/consultant/` (GoalCreation,
 * MeetingScheduler, InviteParticipant, JobCollection, ReportDraft,
 * ReportGenerator, GroupMessage) gick att stänga med Esc. Bakgrunden var en
 * overlay-<div>, inte `inert`, så tangentbordsfokus vandrade rakt igenom
 * till sidan bakom — en riktig tangentbordsfälla (WCAG 2.1.2).
 *
 * Två dialoger byggdes SAMMA dag med rätt mönster som förebild:
 * `consultant/PlacementDialog.tsx` och `consultant/PlaceringFormModal.tsx`.
 * Båda kopierade `role="dialog"` + `aria-modal` + `useFocusTrap` (Esc,
 * fokusfälla, fokusåterställning) för hand. Den här primitiven extraherar
 * det gemensamma i stället för att låta ett åttonde och nionde ställe
 * kopiera det en gång till.
 *
 * useFocusTrap (hooks/useFocusTrap.ts) ger redan:
 *  - Esc stänger (`onEscape`)
 *  - Tab/Shift+Tab cyklar inom dialogen (ingen tangentbordsfälla ÅT ANDRA
 *    HÅLLET — man kan inte tabba ut ur den)
 *  - Klick utanför dialogen stänger
 *  - Fokus flyttas in vid öppning och ÅTERSTÄLLS till det element som
 *    öppnade dialogen vid stängning
 *
 * Vad den här primitiven lägger till utöver det:
 *  - Portalerar till `document.body` och sätter `inert` på `#root` medan en
 *    dialog är öppen. Tab-fällan i useFocusTrap stoppar bara TAB-tangenten —
 *    en skärmläsares egen (icke-Tab-baserade) navigering kan fortfarande nå
 *    bakgrunden om den inte är `inert`. `#root` ligger utanför portalen, så
 *    att göra den `inert` stänger aldrig ute dialogens eget innehåll.
 *  - En enhetlig overlay (mörk halvtransparent bakgrund, centrerat kort).
 *  - `role="dialog"`, `aria-modal="true"` och `aria-labelledby` kopplat mot
 *    anroparens rubrik-id.
 *
 * En modul-nivå räknare gör flera samtidigt öppna Dialog-instanser säkra
 * (t.ex. en bekräftelsedialog ovanpå en av de här) — den innersta stängs
 * utan att av misstag ta bort `inert` medan en yttre fortfarande är öppen.
 *
 * Lägg INTE till en egen `onClick` på overlayen för att stänga vid
 * utanförklick — `useFocusTrap` gör redan det via sin `mousedown`-lyssnare.
 */
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  /** id på elementet som bär dialogens rubrik (kopplas via aria-labelledby). */
  labelledBy: string
  children: ReactNode
  /** Klass på overlay-lagret (positionering + bakgrund). Slår ihop med default. */
  overlayClassName?: string
  /** Klass på själva dialogrutan (kortet). */
  className?: string
}

const DEFAULT_OVERLAY = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'

let inertDepth = 0
function acquireBackgroundInert() {
  const root = document.getElementById('root')
  if (root && inertDepth === 0) root.setAttribute('inert', '')
  inertDepth += 1
}
function releaseBackgroundInert() {
  inertDepth = Math.max(0, inertDepth - 1)
  if (inertDepth === 0) {
    document.getElementById('root')?.removeAttribute('inert')
  }
}

export function Dialog({
  isOpen,
  onClose,
  labelledBy,
  children,
  overlayClassName,
  className,
}: DialogProps) {
  // Deklarerad FÖRE useFocusTrap med flit: vid stängning körs cleanup i
  // deklarationsordning, så `inert` hinner tas bort från bakgrunden innan
  // useFocusTrap återställer fokus dit — annars försöker `.focus()` landa på
  // ett element som (fortfarande) sitter i ett inert-träd.
  useEffect(() => {
    if (!isOpen) return
    acquireBackgroundInert()
    return () => releaseBackgroundInert()
  }, [isOpen])

  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, { onEscape: onClose })

  if (!isOpen) return null

  return createPortal(
    <div className={cn(DEFAULT_OVERLAY, overlayClassName)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={className}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Dialog
