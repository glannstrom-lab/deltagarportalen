/**
 * veckansStatus — en dags läge i veckoremsan (omtaget steg 6, 2026-10-11).
 *
 * Ren logik. Färgen i remsan betyder alltid samma sak som i konsulentvyn
 * (kvarterStatus.ts), så den får bara visa det som är MARKERAT:
 *   - En ogiltig frånvaro, sjukdom eller giltig frånvaro syns, i den ordningen
 *     (det som kräver något av henne först).
 *   - "Närvarande" bara när ALLA dagens pass är markerade som närvaro. En
 *     dag med ett markerat och ett omarkerat pass är inte en grön dag.
 *   - Allt annat — omarkerat, incheckat men inte bekräftat, anmäld frånvaro
 *     som konsulenten inte bedömt — är "Planerat". Det är konsulenten som
 *     markerar närvaron, inte deltagarens egen incheckning.
 *   - Ingen dag utan pass får en färg: `null` = "Inget pass".
 */
import { franNarvarovarde, type Status } from '@/components/ui/kvarterStatus'
import type { ActivitySession } from '@/services/aktivitetApi'

const FORE: readonly Status[] = ['ogiltig', 'sjuk', 'giltig']

export function dagensStatus(pass: readonly Pick<ActivitySession, 'attendance'>[]): Status | null {
  if (pass.length === 0) return null
  const statusar = pass.map((p) => franNarvarovarde(p.attendance))
  for (const s of FORE) if (statusar.includes(s)) return s
  if (statusar.every((s) => s === 'narvarande')) return 'narvarande'
  return 'planerat'
}

/** ISO-veckonummer ("vecka 42") för en lokal kalenderdag YYYY-MM-DD. */
export function veckonummer(datum: string): number {
  const [a, m, d] = datum.split('-').map(Number)
  const dag = new Date(Date.UTC(a, m - 1, d))
  const veckodag = dag.getUTCDay() || 7
  dag.setUTCDate(dag.getUTCDate() + 4 - veckodag)
  const arsStart = new Date(Date.UTC(dag.getUTCFullYear(), 0, 1))
  return Math.ceil(((dag.getTime() - arsStart.getTime()) / 86_400_000 + 1) / 7)
}
