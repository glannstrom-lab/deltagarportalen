/**
 * rapportOmfang — vilka deltagare en del av Rapporter räknar (CH1, rollspelet 2026-09-28).
 *
 * Rapporter blandar två omfång, och sidan sa inte vilket som gällde var:
 *  - Nyckeltalen, målen, placeringarna och konsultrapporten hämtas med
 *    `consultant_id = jag` — alltid mina egna deltagare.
 *  - IVO-underlaget, nämndrapporten, månadsunderlagen och aktivitetsloggen läser
 *    `activity_plans`/`activity_sessions` utan filter. RLS ger en konsulent sina
 *    egna planer, men en chef/admin ALLA planer i organisationen
 *    ("Organisationens chef läser planer").
 * En enhetschef såg därför "Totalt deltagare 5" (sina egna) bredvid ett IVO-underlag
 * för hela enheten, utan att kunna veta det. Nu står omfånget på varje del.
 *
 * Kollegornas deltagare ingår i chefens planer men inte i namnlistan (den bygger på
 * mina egna kopplingar). De visades som "Deltagare 1a2b3c4d". Chefen läser inte
 * deras profiler, så etiketten blir handläggande konsulent i stället för namn.
 */
import type { Colleague } from '@/services/orgApi'

export type Omfang = 'egna' | 'enheten'

/** Chef eller admin i någon organisation → planbaserade rapporter omfattar hela enheten. */
export function planOmfang(roller: readonly string[]): Omfang {
  return roller.some((r) => r === 'chef' || r === 'admin') ? 'enheten' : 'egna'
}

/** Visningsnamn för deltagaren bakom en plan. */
export function deltagarEtikett(
  plan: { participant_id: string; consultant_id?: string | null },
  egnaNamn: ReadonlyMap<string, string>,
  kollegor: readonly Pick<Colleague, 'user_id' | 'first_name' | 'last_name'>[],
): string {
  const eget = egnaNamn.get(plan.participant_id)
  if (eget) return eget
  const kollega = plan.consultant_id ? kollegor.find((k) => k.user_id === plan.consultant_id) : undefined
  const kollegaNamn = kollega ? [kollega.first_name, kollega.last_name].filter(Boolean).join(' ') : ''
  const kort = plan.participant_id.slice(0, 4)
  return kollegaNamn ? `Deltagare hos ${kollegaNamn} (${kort})` : `Deltagare ${plan.participant_id.slice(0, 8)}`
}
