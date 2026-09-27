/**
 * planensRegelverk — vilket regelverk deltagarens plan hör till (RD3,
 * rollspelet 2026-09-27).
 *
 * Min vecka och närvarointyget sa "kommunens krav enligt socialtjänstlagen" och
 * "din handläggare på försörjningsstöd" även till en deltagare hos en Rusta och
 * matcha-leverantör. Fel myndighet i en kravtext är både oroande och osant.
 *
 * Deltagaren kan inte läsa `organizations.kind` (RLS: bara medlemmar). Vägen är
 * vyn `my_ai_policy`, som får kolumnen `org_kind` i
 * `supabase/migrations/PENDING_20260927_my_ai_policy_org_kind.sql`. Före
 * migrationen saknas kolumnen — då blir svaret `null` och texterna neutrala.
 * **Utan belägg visas aldrig kommunens juridik.**
 *
 * `select('*')` med flit (via laslogg.minAiPolicy): en uttrycklig kolumnlista
 * med `org_kind` svarar 42703 före migrationen, och schemagrinden känner inte
 * kolumnen förrän snapshoten uppdaterats.
 */

import { laslogg } from '@/services/laslogg'

export type PlanensRegelverk = 'kommun' | 'leverantor'

export interface PolicyRadMedTyp {
  org_id: string
  org_kind?: string | null
}

/**
 * Planens organisation avgör när den finns bland raderna. Annars: bara om alla
 * rader med känd typ är samma (kommun eller leverantör). Allt annat — ingen
 * rad, ingen kolumn, `annan`, en blandning — är `null` = neutral text.
 */
export function valjRegelverk(rader: readonly PolicyRadMedTyp[], planOrgId: string | null | undefined): PlanensRegelverk | null {
  const tolka = (k: string | null | undefined): PlanensRegelverk | null =>
    k === 'kommun' || k === 'leverantor' ? k : null
  if (planOrgId) {
    const planens = rader.find((r) => r.org_id === planOrgId)
    if (planens) return tolka(planens.org_kind)
  }
  const typer = new Set(rader.map((r) => r.org_kind).filter((k) => k !== 'arbetsgivare'))
  if (typer.size !== 1) return null
  return tolka([...typer][0])
}

/** Hämtar och väljer. Ett läsfel ger `null` (neutral text), aldrig kommunens. */
export async function hamtaPlanensRegelverk(planOrgId: string | null | undefined): Promise<PlanensRegelverk | null> {
  try {
    const rader = (await laslogg.minAiPolicy()) as unknown as PolicyRadMedTyp[]
    return valjRegelverk(rader, planOrgId)
  } catch {
    return null
  }
}

/**
 * i18n-nycklarna per regelverk. Hela nycklar som literaler, inte ett suffix i en
 * mall — då ser grinden för döda nycklar (i18n/doda-nycklar.test.ts) att de läses.
 */
export function regelverkNycklar(r: PlanensRegelverk | null): { mal: string; intyg: string } {
  if (r === 'kommun') return { mal: 'minVecka.forklaring.mal', intyg: 'minVecka.intyg.text' }
  if (r === 'leverantor') return { mal: 'minVecka.forklaring.malLeverantor', intyg: 'minVecka.intyg.textLeverantor' }
  return { mal: 'minVecka.forklaring.malNeutral', intyg: 'minVecka.intyg.textNeutral' }
}
