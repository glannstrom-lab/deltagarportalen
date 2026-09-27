/**
 * flikTangenter — WAI-ARIA tabs-mönstret för en horisontell flikrad (RK5,
 * rollspelet 2026-09-27). Pil vänster/höger går runt, Home/End till första och
 * sista. Returnerar nästa fliks id, eller null när tangenten inte är flikradens.
 */
export function flikEfterTangent(ids: readonly string[], aktuell: string, tangent: string): string | null {
  const i = ids.indexOf(aktuell)
  if (i === -1 || ids.length === 0) return null
  switch (tangent) {
    case 'ArrowRight':
      return ids[(i + 1) % ids.length]
    case 'ArrowLeft':
      return ids[(i - 1 + ids.length) % ids.length]
    case 'Home':
      return ids[0]
    case 'End':
      return ids[ids.length - 1]
    default:
      return null
  }
}
