/**
 * Filnamn för CV-PDF. Ett saknat namn får aldrig bli "okänd" eller ge dubbla
 * understreck (`CV_okänd_.pdf`) — SV7, rollspel 2026-09-28.
 */
interface NamnKalla {
  firstName?: string | null
  lastName?: string | null
  title?: string | null
}

function rensa(s: string | null | undefined): string {
  return (s ?? '')
    .trim()
    .replace(/[\\:*?"<>|/]+/g, '')
    .replace(/\s+/g, '_')
}

export function cvFilnamn(data?: NamnKalla | null): string {
  const namn = [rensa(data?.firstName), rensa(data?.lastName)].filter(Boolean)
  if (namn.length > 0) return `CV_${namn.join('_')}.pdf`
  const titel = rensa(data?.title).slice(0, 40)
  if (titel) return `CV_${titel}.pdf`
  return 'CV.pdf'
}
