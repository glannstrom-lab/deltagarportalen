/** "Arbetsgivare · Titel · start 2026-11-01" av det som finns; null när ingenting går att belägga. */
export function placeringsRad(p: unknown): string | null {
  if (!p || typeof p !== 'object') return null
  const o = p as Record<string, unknown>
  const del = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const delar = [del(o.employer_name), del(o.job_title)]
  const start = del(o.start_date)
  const rad = [...delar, start ? `start ${start}` : null].filter(Boolean).join(' · ')
  return rad || null
}
