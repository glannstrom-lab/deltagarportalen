/**
 * Rutinflikens lagring (2026-10-09). Listan sparas i webbläsaren per konto;
 * bockarna gäller ett datum och nollas en ny dag. Egen fil för att
 * RoutinesTab.tsx bara ska exportera komponenter (react-refresh).
 */
export const IKON_IDN = ['sun', 'briefcase', 'coffee', 'moon', 'calendar'] as const
export type IkonId = typeof IKON_IDN[number]

export interface SparadRutin {
  id: string
  /** Standardrutinerna bär sin nyckel, så de följer språkbytet. */
  titleKey?: string
  title?: string
  time: string
  ikon: IkonId
  days: string[]
}

export interface Sparat {
  rutiner: SparadRutin[]
  /** Bockarna gäller ett datum — en ny dag börjar oavbockad. */
  klara: { datum: string; ids: string[] }
}

export const VARDAGAR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
export const ALLA_DAGAR = [...VARDAGAR, 'Sat', 'Sun']

export const STANDARD: SparadRutin[] = [
  { id: '1', titleKey: 'wellness.routines.defaultRoutines.morningWalk', time: '08:00', ikon: 'sun', days: VARDAGAR },
  { id: '2', titleKey: 'wellness.routines.defaultRoutines.jobSearch', time: '09:00', ikon: 'briefcase', days: VARDAGAR },
  { id: '3', titleKey: 'wellness.routines.defaultRoutines.coffeeBreak', time: '10:30', ikon: 'coffee', days: VARDAGAR },
  { id: '4', titleKey: 'wellness.routines.defaultRoutines.reflectDay', time: '19:00', ikon: 'moon', days: ALLA_DAGAR },
]

export const rutinNyckel = (uid: string | undefined) => `jobin-rutiner-${uid ?? 'anon'}`

export function lasRutiner(nyckel: string, idag: string): Sparat {
  try {
    const raa = localStorage.getItem(nyckel)
    if (raa) {
      const o = JSON.parse(raa) as Sparat
      if (Array.isArray(o.rutiner)) {
        const klara = o.klara?.datum === idag ? o.klara : { datum: idag, ids: [] }
        return { rutiner: o.rutiner.filter((r) => (IKON_IDN as readonly string[]).includes(r.ikon)), klara }
      }
    }
  } catch { /* privat läge eller trasig rad — börja om med standardlistan */ }
  return { rutiner: STANDARD, klara: { datum: idag, ids: [] } }
}

export function sparaRutiner(nyckel: string, sparat: Sparat): void {
  try { localStorage.setItem(nyckel, JSON.stringify(sparat)) } catch { /* lagringen är full eller avstängd */ }
}
