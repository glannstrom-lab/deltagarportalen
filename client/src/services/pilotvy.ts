/**
 * Pilotvy (FN8) — per organisation: hur används piloten? Aggregerat, inga
 * deltagaruppgifter. Superadmins vy i OrganisationerTab.
 *
 * Premissen (mätt mot prod 2026-10-30): superadmin läser organizations,
 * organization_members, consultant_participants och audit_logs, men INTE
 * activity_plans, activity_sessions eller activity_plan_handovers — de tre
 * har bara policyer för deltagaren, konsulenten och organisationens
 * chef/admin (aal2). En fråga från superadmin mot dem ger 0 rader, inte fel,
 * och skulle rendera "0 pass" — felklassen "tomt fält är inte en nolla".
 * Därför läses de INTE här; de tre måtten är `null` ("—") tills en aggregerad
 * funktion finns (rapporten beskriver pilot_oversikt, väntar på ja om RLS).
 *
 * "Aktiv konsulent" = personal i organisationen som öppnat en deltagares
 * uppgifter de senaste 14 dagarna (audit_logs, action VIEWED_PARTICIPANT_DATA,
 * skrivs av konsulentvyn vid varje öppnad deltagare). Inte profiles.updated_at.
 */

import { supabase } from '@/lib/supabase'
import type { OrgKind, OrgRole } from '@/services/orgApi'

export const AKTIV_DAGAR = 14
export const AKTIVITETSHANDELSE = 'VIEWED_PARTICIPANT_DATA'
/** Roller som räknas som personal (inte företagskontots arbetsgivarroll). */
const PERSONALROLLER: readonly OrgRole[] = ['konsulent', 'handlaggare', 'chef', 'admin']

export interface PilotOrg {
  id: string
  name: string
  kind: OrgKind
}
export interface PilotMedlem {
  org_id: string
  user_id: string
  role: OrgRole
}
export interface PilotKoppling {
  consultant_id: string
  participant_id: string
}
export interface PilotHandelse {
  user_id: string
  created_at: string
}

/** Bara tal och organisationens namn — aldrig ett id eller namn på en person. */
export interface PilotRad {
  orgId: string
  orgNamn: string
  personal: number
  /** null = kan inte mätas (inget underlag), visas som "—". */
  aktivaKonsulenter: number | null
  kopplade: number | null
  deltagareMedPlan: number | null
  loggadePass: number | null
  namndunderlag: boolean | null
}

export function beraknaPilotvy(
  orgs: readonly PilotOrg[],
  medlemmar: readonly PilotMedlem[],
  kopplingar: readonly PilotKoppling[],
  handelser: readonly PilotHandelse[],
  nu: Date = new Date(),
): PilotRad[] {
  const grans = nu.getTime() - AKTIV_DAGAR * 24 * 3600 * 1000
  const aktivaIds = new Set(
    handelser.filter((h) => new Date(h.created_at).getTime() >= grans).map((h) => h.user_id),
  )
  return orgs.map((o) => {
    const personal = new Set(
      medlemmar.filter((m) => m.org_id === o.id && PERSONALROLLER.includes(m.role)).map((m) => m.user_id),
    )
    const harPersonal = personal.size > 0
    const kopplade = new Set(kopplingar.filter((k) => personal.has(k.consultant_id)).map((k) => k.participant_id))
    return {
      orgId: o.id,
      orgNamn: o.name,
      personal: personal.size,
      // Utan personal finns inget att räkna: "—", inte 0 av 0.
      aktivaKonsulenter: harPersonal ? [...personal].filter((id) => aktivaIds.has(id)).length : null,
      kopplade: harPersonal ? kopplade.size : null,
      deltagareMedPlan: null,
      loggadePass: null,
      namndunderlag: null,
    }
  })
}

const SIDSTORLEK = 1000
const MAX_SIDOR = 20

async function allaSidor<T>(
  hamta: (fran: number, till: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const ut: T[] = []
  for (let s = 0; s < MAX_SIDOR; s++) {
    const { data, error } = await hamta(s * SIDSTORLEK, (s + 1) * SIDSTORLEK - 1)
    if (error) throw new Error(error.message)
    ut.push(...(data ?? []))
    if ((data ?? []).length < SIDSTORLEK) return ut
  }
  return ut
}

export const pilotvyApi = {
  async hamta(orgs: readonly PilotOrg[], medlemmar: readonly PilotMedlem[], nu: Date = new Date()): Promise<PilotRad[]> {
    const personalIds = [
      ...new Set(medlemmar.filter((m) => PERSONALROLLER.includes(m.role)).map((m) => m.user_id)),
    ]
    if (personalIds.length === 0) return beraknaPilotvy(orgs, medlemmar, [], [], nu)
    const sedan = new Date(nu.getTime() - AKTIV_DAGAR * 24 * 3600 * 1000).toISOString()
    const [kopplingar, handelser] = await Promise.all([
      allaSidor<PilotKoppling>((a, b) =>
        supabase.from('consultant_participants').select('consultant_id, participant_id').in('consultant_id', personalIds).order('id').range(a, b),
      ),
      allaSidor<PilotHandelse>((a, b) =>
        supabase
          .from('audit_logs')
          .select('user_id, created_at')
          .eq('action', AKTIVITETSHANDELSE)
          .gte('created_at', sedan)
          .in('user_id', personalIds)
          .order('id')
          .range(a, b),
      ),
    ])
    return beraknaPilotvy(orgs, medlemmar, kopplingar, handelser, nu)
  },
}
