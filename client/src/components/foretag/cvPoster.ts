/**
 * cvPoster — läser CV-byggarens jsonb (cvs.work_experience / cvs.education)
 * utan att lita på formen. Formen ägs av CV-byggaren och kan ändras; den här
 * läsaren tar de vanliga fältnamnen och faller tillbaka på en enkel lista —
 * aldrig en krasch i företagsvyn.
 */

export interface CvPost {
  rubrik: string
  under: string | null
  period: string | null
  beskrivning: string | null
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/** null = inte en lista (okänd form). Tom lista = inget inlagt. */
export function cvPoster(v: unknown): CvPost[] | null {
  if (!Array.isArray(v)) return null
  const poster: CvPost[] = []
  for (const rad of v) {
    if (typeof rad === 'string') {
      if (rad.trim()) poster.push({ rubrik: rad.trim(), under: null, period: null, beskrivning: null })
      continue
    }
    if (!rad || typeof rad !== 'object') continue
    const o = rad as Record<string, unknown>
    const rubrik = str(o.title) ?? str(o.position) ?? str(o.role) ?? str(o.degree) ?? str(o.name) ?? str(o.program)
    const under = str(o.company) ?? str(o.employer) ?? str(o.school) ?? str(o.institution) ?? str(o.organization)
    const start = str(o.start_date) ?? str(o.startDate) ?? str(o.from) ?? str(o.start)
    const slut = str(o.end_date) ?? str(o.endDate) ?? str(o.to) ?? str(o.end)
    const pagar = o.current === true || o.ongoing === true
    const period = start || slut ? `${start ?? ''}–${pagar ? 'pågår' : (slut ?? '')}` : null
    const beskrivning = str(o.description) ?? str(o.summary)
    if (!rubrik && !under && !beskrivning) continue
    poster.push({ rubrik: rubrik ?? under ?? '', under: rubrik ? under : null, period, beskrivning })
  }
  return poster
}
