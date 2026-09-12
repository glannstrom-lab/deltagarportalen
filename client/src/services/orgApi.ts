/**
 * orgApi — organisationer (kommun/leverantör) och medlemskap, KM2.
 *
 * Tabeller: organizations, organization_members (migration 20260911120000),
 * vyer: organization_colleagues, organization_caseload (20260911160000).
 *
 * Vem får göra vad (RLS, verifierat som authenticated 2026-09-11):
 *   - Medlem: läser sina egna medlemsrader, sin organisation och kollegorna
 *     (vyn organization_colleagues).
 *   - Chef/admin i organisationen: läser caseload per konsulent (vyn
 *     organization_caseload) — bara tal, inga deltagaruppgifter.
 *   - Superadmin (is_admin_or_superadmin): skapar organisationer och lägger
 *     till/tar bort medlemmar direkt i organization_members.
 *   - Chef/admin i organisationen (självbetjäning, migration 20260911230000):
 *     lägger till kollega på e-post, byter roll och tar bort — genom INSERT/
 *     UPDATE/DELETE på vyn organization_colleagues. En INSTEAD OF-trigger (definer,
 *     inte anropbar direkt) kontrollerar allt: bara chef/admin i org; bara admin
 *     ger admin; e-posten måste redan ha ett konto (P0002); dubblett 23505; egen
 *     roll/eget medlemskap 42501; sista chef/admin kan inte tas bort (23514).
 *     Databasens felmeddelanden är på svenska och visas rakt av i UI:t.
 *     Varför inte en policy: en policy på organization_members som refererar
 *     organization_members ger RLS-rekursion (42P17); och en anropbar
 *     definer-RPC hade spräckt grants-taket.
 *
 * Mönster som övriga services: kastar vid fel, sväljer aldrig till [].
 */

import { supabase } from '@/lib/supabase'

export type OrgKind = 'kommun' | 'leverantor' | 'annan' | 'arbetsgivare'
export type OrgRole = 'handlaggare' | 'konsulent' | 'chef' | 'admin' | 'arbetsgivare'

export interface Organization {
  id: string
  name: string
  kind: OrgKind
  org_number: string | null
  /** false = AI-funktionerna nekas alla deltagare kopplade till organisationens konsulenter (båda AI-grindarna). */
  ai_enabled: boolean
  /** Demoorganisation (migration 20260912190000) — allt återställs varje natt, mejl skickas aldrig. */
  is_demo?: boolean
  created_at: string
  updated_at: string
}

export interface OrgMembership {
  id: string
  org_id: string
  user_id: string
  role: OrgRole
  created_at: string
}

export interface Colleague {
  id: string
  org_id: string
  org_name: string
  org_kind: OrgKind
  user_id: string
  role: OrgRole
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface CaseloadRow {
  org_id: string
  org_name: string
  consultant_id: string
  role: OrgRole
  first_name: string | null
  last_name: string | null
  antal_deltagare: number
  antal_aktiva_planer: number
  ogiltig_franvaro_30d: number
}

/**
 * AG6 (2026-09-13): `arbetsgivare` är företagskontots enda roll, och den finns
 * bara i organisationer av slaget `arbetsgivare` — triggern
 * organization_members_kind_guard nekar allt annat (23514). Företagets personer
 * är USER på profilnivå; rollen ger dem bara de nya employer_*-vyerna.
 */
export const ORG_ROLLER: readonly OrgRole[] = ['handlaggare', 'konsulent', 'chef', 'admin', 'arbetsgivare'] as const
export const ORG_ROLL_ETIKETT: Record<OrgRole, string> = {
  handlaggare: 'Handläggare (ekonomiskt bistånd)',
  konsulent: 'Arbetskonsulent',
  chef: 'Chef',
  admin: 'Administratör',
  arbetsgivare: 'Kontaktperson (företag)',
}
export const ORG_KIND_ETIKETT: Record<OrgKind, string> = {
  kommun: 'Kommun',
  leverantor: 'Leverantör',
  annan: 'Annan',
  arbetsgivare: 'Företag',
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Inte inloggad')
  return user
}

export const orgApi = {
  /** Mina medlemskap med organisationen ifylld. Tom lista = tillhör ingen organisation. */
  async myMemberships(): Promise<Array<OrgMembership & { organization: Organization }>> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
    if (error) throw error
    return (data ?? []).map((r) => {
      const { organizations, ...rest } = r as OrgMembership & { organizations: Organization }
      return { ...rest, organization: organizations }
    })
  },

  /**
   * PG19 (2026-09-13): chef/admin i organisationen slår av eller på AI för alla
   * deltagare kopplade till organisationens konsulenter. Går mot `organizations`
   * direkt — policyn "Chef ändrar sin organisations AI-brytare" + triggern
   * `organizations_chef_guard` (migration 20260913001000) släpper igenom exakt
   * den kolumnen. Innan migrationen körts svarar prod med 0 rader → fel här,
   * aldrig ett tyst "sparat".
   */
  async setOrgAiEnabled(orgId: string, enabled: boolean): Promise<Organization> {
    await requireUser()
    const { data, error } = await supabase
      .from('organizations')
      .update({ ai_enabled: enabled })
      .eq('id', orgId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Ändringen sparades inte — du behöver vara chef eller administratör i organisationen.')
    return data as Organization
  },

  /** Kollegor i mina organisationer (inklusive jag själv). */
  async colleagues(): Promise<Colleague[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('organization_colleagues')
      .select('*')
      .order('org_name')
      .order('last_name')
    if (error) throw error
    return (data ?? []) as Colleague[]
  },

  /** Caseload per konsulent — tom lista om jag inte är chef/admin någonstans. */
  async caseload(): Promise<CaseloadRow[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('organization_caseload')
      .select('*')
      .order('org_name')
      .order('last_name')
    if (error) throw error
    return (data ?? []) as CaseloadRow[]
  },

  /** Är jag chef eller admin i någon organisation? */
  async isChef(): Promise<boolean> {
    const m = await orgApi.myMemberships()
    return m.some((x) => x.role === 'chef' || x.role === 'admin')
  },

  // --- Självbetjäning för chef/admin (INSTEAD OF-trigger på vyn) ---

  /** Lägger till en kollega som redan har ett konto. Databasens svenska felmeddelande skickas vidare. */
  async addColleagueByEmail(orgId: string, email: string, role: OrgRole): Promise<void> {
    await requireUser()
    const { error } = await supabase
      .from('organization_colleagues')
      .insert({ org_id: orgId, email: email.trim(), role })
    if (error) throw new Error(felText(error))
  },

  async setColleagueRole(membershipId: string, role: OrgRole): Promise<void> {
    await requireUser()
    const { error } = await supabase
      .from('organization_colleagues')
      .update({ role })
      .eq('id', membershipId)
    if (error) throw new Error(felText(error))
  },

  async removeColleague(membershipId: string): Promise<void> {
    await requireUser()
    const { error } = await supabase
      .from('organization_colleagues')
      .delete()
      .eq('id', membershipId)
    if (error) throw new Error(felText(error))
  },

  /**
   * Överlämning (KM2 steg 4, migration 20260912000000): flyttar ALLA deltagare
   * från en konsulent till en annan i samma organisation, som chef/admin, via
   * INSTEAD OF-triggern på vyn organization_handover. Flyttar
   * consultant_participants, profiles.consultant_id och aktiva planer; journal,
   * mål och möten stannar hos den tidigare konsulenten (produktbeslut väntar).
   * Deltagarna får en notis och samtyckesfrågan ställs om. Returnerar antalet
   * flyttade deltagare. Databasens svenska felmeddelande skickas vidare.
   */
  async handover(orgId: string, fromConsultantId: string, toConsultantId: string): Promise<number> {
    await requireUser()
    const { data, error } = await supabase
      .from('organization_handover')
      .insert({ org_id: orgId, from_consultant_id: fromConsultantId, to_consultant_id: toConsultantId })
      .select('antal_deltagare')
      .single()
    if (error) throw new Error(felText(error))
    return (data as { antal_deltagare: number } | null)?.antal_deltagare ?? 0
  },
}

/**
 * Databasens meddelande föredras — triggern skriver dem på svenska för att visas
 * rakt av ("Ingen användare med e-posten …", "Personen är redan medlem …").
 */
export function felText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    const m = (e as { message: string }).message.trim()
    if (m) return m
  }
  if (e instanceof Error && e.message.trim()) return e.message
  return 'Kunde inte spara'
}

/** Superadmin-delen. RLS släpper bara igenom is_admin_or_superadmin(). */
export const orgAdminApi = {
  async listOrganizations(): Promise<Organization[]> {
    await requireUser()
    const { data, error } = await supabase.from('organizations').select('*').order('name')
    if (error) throw error
    return (data ?? []) as Organization[]
  },

  async createOrganization(input: { name: string; kind: OrgKind; org_number?: string | null }): Promise<Organization> {
    await requireUser()
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: input.name.trim(), kind: input.kind, org_number: input.org_number?.trim() || null })
      .select('*')
      .single()
    if (error) throw error
    return data as Organization
  },

  async updateOrganization(id: string, patch: Partial<Pick<Organization, 'name' | 'kind' | 'org_number' | 'ai_enabled'>>): Promise<Organization> {
    await requireUser()
    const { data, error } = await supabase.from('organizations').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    return data as Organization
  },

  async deleteOrganization(id: string): Promise<void> {
    await requireUser()
    const { error } = await supabase.from('organizations').delete().eq('id', id)
    if (error) throw error
  },

  /** Alla medlemskap (superadmin ser allt via sin policy). */
  async listMembers(orgId: string): Promise<OrgMembership[]> {
    await requireUser()
    const { data, error } = await supabase.from('organization_members').select('*').eq('org_id', orgId).order('created_at')
    if (error) throw error
    return (data ?? []) as OrgMembership[]
  },

  async addMember(orgId: string, userId: string, role: OrgRole): Promise<OrgMembership> {
    await requireUser()
    const { data, error } = await supabase
      .from('organization_members')
      .insert({ org_id: orgId, user_id: userId, role })
      .select('*')
      .single()
    if (error) throw error
    return data as OrgMembership
  },

  async setMemberRole(membershipId: string, role: OrgRole): Promise<OrgMembership> {
    await requireUser()
    const { data, error } = await supabase.from('organization_members').update({ role }).eq('id', membershipId).select('*').single()
    if (error) throw error
    return data as OrgMembership
  },

  async removeMember(membershipId: string): Promise<void> {
    await requireUser()
    const { error } = await supabase.from('organization_members').delete().eq('id', membershipId)
    if (error) throw error
  },
}
