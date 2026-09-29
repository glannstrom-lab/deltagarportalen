/** Hjälpare till FelSammanfattning (egen fil: react-refresh kräver att komponentfilen bara exporterar komponenter). */

export interface FormularFel {
  /** id på fältet (input/select/textarea) som felet gäller. */
  faltId: string
  text: string
}

/** Scrolla till fältet och ge det fokus. Returnerar false om det inte finns. */
export function gaTillFalt(faltId: string): boolean {
  const el = document.getElementById(faltId)
  if (!el) return false
  el.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  ;(el as HTMLElement).focus?.({ preventScroll: true })
  return true
}
