/**
 * veckodagar — en vecka i planen som fem dagar med EN status var (omtaget
 * "Kvarter", steg 5, 2026-10-11). Matar Veckoremsan på deltagarsidan.
 *
 * Regeln för en dag med flera pass: det som kräver något av konsulenten vinner.
 *   ogiltig frånvaro  >  passerat pass som inte är markerat ("Väntar på dig")
 *   >  sjuk  >  giltig frånvaro  >  närvarande  >  planerat
 * En dag utan pass är `null` — "Inget pass", aldrig en färgruta utan ord.
 *
 * Datumen är lokala kalenderdagar (YYYY-MM-DD); inget här går via
 * `new Date('YYYY-MM-DD')`, som är midnatt UTC (lärdomen "Idag i UTC").
 */
import { addDays, veckansMandag, type Ampel, type Attendance } from '@/services/aktivitetSchema'
import { franNarvarovarde, type Status } from '@/components/ui/kvarterStatus'
import type { VeckoremsaDag } from '@/components/ui/Veckoremsa'

export interface DagPass {
  date: string
  title: string
  attendance: Attendance | null
}

const RANG: Record<Status, number> = { ogiltig: 6, vantar: 5, sjuk: 4, giltig: 3, narvarande: 2, planerat: 1 }

/** Status för ETT pass. Omarkerat och passerat (före eller lika med idag) väntar på konsulenten. */
export function passStatus(p: DagPass, idag: string): Status {
  const s = franNarvarovarde(p.attendance)
  if (s) return s
  return p.date <= idag ? 'vantar' : 'planerat'
}

/** Status för en dag — det mest brådskande passet. `null` = inget pass. */
export function dagStatus(pass: readonly DagPass[], datum: string, idag: string): Status | null {
  let basta: Status | null = null
  for (const p of pass) {
    if (p.date !== datum) continue
    const s = passStatus(p, idag)
    if (basta === null || RANG[s] > RANG[basta]) basta = s
  }
  return basta
}

/** Måndag–fredag i veckan som innehåller `datumIVeckan`, klara för Veckoremsa. */
export function veckansDagar(pass: readonly DagPass[], datumIVeckan: string, idag: string): VeckoremsaDag[] {
  const mandag = veckansMandag(datumIVeckan)
  return [0, 1, 2, 3, 4].map((i) => {
    const datum = addDays(mandag, i)
    const titlar = Array.from(new Set(pass.filter((p) => p.date === datum).map((p) => p.title)))
    return {
      datum,
      status: dagStatus(pass, datum, idag),
      detalj: titlar.length > 0 ? titlar.join(', ') : undefined,
    }
  })
}

/** Pass på lördag eller söndag syns inte i remsan — anroparen säger det med en rad. */
export function helgpass(pass: readonly DagPass[], datumIVeckan: string): number {
  const lordag = addDays(veckansMandag(datumIVeckan), 5)
  const sondag = addDays(lordag, 1)
  return pass.filter((p) => p.date === lordag || p.date === sondag).length
}

/** Veckoampeln som ett ord och en status (StatusChip) — aldrig bara färg. */
export const AMPEL_TEXT: Record<Ampel, { text: string; status: Status }> = {
  inga_pass: { text: 'Inga pass den här veckan', status: 'planerat' },
  under_mal: { text: 'Under veckomålet', status: 'vantar' },
  pa_mal: { text: 'På veckomålet', status: 'narvarande' },
  ogiltig_franvaro: { text: 'Ogiltig frånvaro i veckan', status: 'ogiltig' },
  // GG3: veckan kan fortfarande nå målet, men inget är bekräftat än. Neutral ton.
  ej_markerad: { text: 'Närvaron inte markerad än', status: 'planerat' },
}
