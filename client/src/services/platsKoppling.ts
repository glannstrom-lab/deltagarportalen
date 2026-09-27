/**
 * platsKoppling — stämmer av aktivitetsplanens arbetsplatspass mot deltagarens
 * registrerade Platser (RR10/RK16, rollspelet 2026-09-27).
 *
 * Saras plan hade pass på "Demobageriet" två gånger i veckan, men Platser sa
 * "Inga platser registrerade" — praktiken fanns bara som fritext i passets
 * platsfält. Omvänt fanns Omars praktik (Nordfrakt, från 7 okt, 30 h/v) under
 * Platser men inte i planen. Ingenting kopplade ihop dem.
 *
 * Det här är i första hand en avstämning på namn (skiftlägesokänsligt, det ena
 * innehåller det andra), och den säger det öppet. RK37: pass som lagts in från
 * Platser bär dessutom `work_placement_id` (PENDING_20260927d) — de matchar
 * platsen på id oavsett vad platsfältet säger.
 * Ren logik.
 */

export interface PlatsRad {
  id: string
  company_name: string
  status: string
  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  placement_type: string
}

export interface PassRad {
  activity_type: string
  location: string | null
  date: string
  /** RK37: satt när passet lades in från Platser (efter migrationen). */
  work_placement_id?: string | null
}

const norm = (s: string) => s.toLocaleLowerCase('sv').replace(/\s+/g, ' ').trim()

function matchar(plats: string, fritext: string): boolean {
  const a = norm(plats)
  const b = norm(fritext)
  return a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a))
}

export interface PlatsAvstamning {
  /** Pågående/planerade platser som inte har något arbetsplatspass i planen. */
  platserUtanPass: PlatsRad[]
  /** Arbetsplatspassens platsfält som inte motsvarar någon registrerad plats. */
  fritextUtanPlats: string[]
}

export function platsAvstamning(platser: readonly PlatsRad[], sessions: readonly PassRad[]): PlatsAvstamning {
  const arbetsplatser = new Map<string, string>()
  const kopplade = new Set<string>()
  for (const s of sessions) {
    if (s.work_placement_id) {
      kopplade.add(s.work_placement_id)
      continue
    }
    if (s.activity_type !== 'workplace' || !s.location?.trim()) continue
    const nyckel = norm(s.location)
    if (!arbetsplatser.has(nyckel)) arbetsplatser.set(nyckel, s.location.trim())
  }
  const aktuella = platser.filter((p) => p.status === 'planerad' || p.status === 'pagaende')
  const platserUtanPass = aktuella.filter((p) => !kopplade.has(p.id) && ![...arbetsplatser.values()].some((loc) => matchar(p.company_name, loc)))
  const fritextUtanPlats = [...arbetsplatser.values()].filter((loc) => !platser.some((p) => matchar(p.company_name, loc)))
  return { platserUtanPass, fritextUtanPlats }
}
