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
 *     till/tar bort medlemmar. Det finns MEDVETET ingen självbetjäning för
 *     org-admin ännu: en policy som refererar organization_members inifrån
 *     organization_members ger RLS-rekursion (42P17), och en definer-funktion
 *     skulle spräcka grants-taket. Pilotkommunerna sätts upp av Mikael.
 *
 * Mönster som övriga services: kastar vid fel, sväljer aldrig till [].
 */

import { supabase } from '@/lib/supabase'

export type OrgKind = 'kommun' | 'leverantor' | 'annan'
export type OrgRole = 'handlaggare' | 'konsulent' | 'chef' | 'admin'

export interface Organization {
  id: string
  name: string
  kind: OrgKind
  org_number: string | null
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

export const ORG_ROLLER: readonly OrgRole[] = ['handlaggare', 'konsulent', 'chef', 'admin'] as const
export const ORG_ROLL_ETIKETT: Record<OrgRole, string> = {
  handlaggare: 'Handläggare (ekonomiskt bistånd)',
  konsulent: 'Arbetskonsulent',
  chef: 'Chef',
  admin: 'Administratör',
}
export const ORG_KIND_ETIKETT: Record<OrgKind, string> = {
  kommun: 'Kommun',
  leverantor: 'Leverantör',
  annan: 'Annan',
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

  async updateOrganization(id: string, patch: Partial<Pick<Organization, 'name' | 'kind' | 'org_number'>>): Promise<Organization> {
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
