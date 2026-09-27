/**
 * Tidpunkt för en rad i "Senaste aktivitet" på Översikt.
 *
 * RK26 (rollspelet 2026-09-27): raden visade bara klockslaget ("10:30") —
 * för en anteckning från förra veckan också. Listan spänner över flera dagar,
 * så dagen måste stå med: "i dag 10:30", "i går 10:30", "24 sep 10:30", och
 * året när det inte är innevarande år. Lokal tid, inte UTC.
 */
function sammaDag(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function aktivitetstid(iso: string, nu: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const klocka = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  if (sammaDag(d, nu)) return `i dag ${klocka}`
  const igar = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - 1)
  if (sammaDag(d, igar)) return `i går ${klocka}`
  const datum = d.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== nu.getFullYear() ? { year: 'numeric' } : {}),
  }).replace('.', '')
  return `${datum} ${klocka}`
}
