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

import { anvandareFranSession } from '@/lib/anvandareFranSession'
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
 * Utfallet av en kolleginbjudan. Inbjudan FINNS i alla tre fallen:
 *   skickat     — raden lästes tillbaka med email_sent = true
 *   obekraftat  — edge-funktionen svarade OK men raden är inte markerad skickad
 *   ej_skickat  — utskicket misslyckades (detalj säger varför)
 */
export interface KollegaInbjudanUtfall {
  id: string
  email: string
  mejl: 'skickat' | 'obekraftat' | 'ej_skickat'
  detalj?: string
}

/** En obesvarad kolleginbjudan. email_sent är false tills utskicket bekräftats. */
export interface KollegaInbjudan {
  id: string
  email: string
  email_sent: boolean
  expires_at: string | null
  created_at: string
  org_role: OrgRole | null
}

/** Känner igen triggerns "Ingen användare med e-posten …" (P0002) — då kan en inbjudan erbjudas. */
export function saknarKonto(felmeddelande: string): boolean {
  return /^Ingen användare med e-posten/.test(felmeddelande.trim())
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
  const { data: { user }, error } = await anvandareFranSession()
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

  // --- Självbetjäning för chef/admin (INSTEAD OF-trigger på vyn) ---

  /** Lägger till en kollega som redan har ett konto. Databasens svenska felmeddelande skickas vidare. */
  async addColleagueByEmail(orgId: string, email: string, role: OrgRole): Promise<void> {
    await requireUser()
    const { error } = await supabase
      .from('organization_colleagues')
      .insert({ org_id: orgId, email: email.trim(), role })
    if (error) throw new Error(felText(error))
  },

  /**
   * Bjuder in en kollega som SAKNAR konto (2026-09-27, migration
   * 20260927_kollega_inbjudan.sql). Skriver en rad i `invitations` med
   * metadata { kind: 'kollega', kollega_org_id, org_role } — triggern
   * invitations_kollega_guard (definer) prövar allt och skriver om raden:
   * bara chef/admin i organisationen, bara admin ger admin, inga demokonton,
   * e-posten får inte ha ett konto, role blir CONSULTANT och consultant_id NULL.
   * Databasens svenska fel kastas rakt av — då finns ingen inbjudan.
   *
   * Därefter mejlet via send-invite-email. Ett mejlfel KASTAS INTE: inbjudan
   * finns då i databasen, och chefen ska få veta exakt det — inte ett fel som
   * ser ut som att ingenting hände. Status "skickad" ges BARA när raden
   * läses tillbaka med email_sent = true; ett 200-svar räcker inte, eftersom
   * edge-funktionen kan ha skickat men misslyckats med att markera raden.
   */
  async inviteColleagueByEmail(orgId: string, email: string, role: OrgRole): Promise<KollegaInbjudanUtfall> {
    const user = await requireUser()
    const adress = email.trim().toLowerCase()
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email: adress,
        role: 'USER', // triggern sätter CONSULTANT; policyn prövar resultatet
        invited_by: user.id,
        metadata: { kind: 'kollega', kollega_org_id: orgId, org_role: role },
      })
      .select('id, email')
      .single()
    if (error) throw new Error(felText(error))
    const inbjudan = data as { id: string; email: string }

    const ejSkickad = (detalj: string): KollegaInbjudanUtfall => ({
      id: inbjudan.id,
      email: inbjudan.email,
      mejl: 'ej_skickat',
      detalj,
    })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return ejSkickad('sessionen saknas — logga in igen')

    let svar: Response
    try {
      svar = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId: inbjudan.id }),
      })
    } catch (e) {
      return ejSkickad(e instanceof Error ? e.message : 'nätverksfel')
    }
    if (!svar.ok) {
      let detalj = `HTTP ${svar.status}`
      try {
        const body = (await svar.json()) as { error?: string; details?: string }
        detalj = [body.error, body.details].filter(Boolean).join(' — ') || detalj
      } catch {
        // svaret var inte JSON — HTTP-koden får räcka
      }
      return ejSkickad(detalj)
    }

    // Bekräfta mot databasen, inte mot svaret.
    const { data: kontroll, error: kontrollFel } = await supabase
      .from('invitations')
      .select('email_sent')
      .eq('id', inbjudan.id)
      .maybeSingle()
    if (kontrollFel || (kontroll as { email_sent: boolean | null } | null)?.email_sent !== true) {
      return {
        id: inbjudan.id,
        email: inbjudan.email,
        mejl: 'obekraftat',
        detalj: kontrollFel ? felText(kontrollFel) : 'utskicket är inte markerat som skickat',
      }
    }
    return { id: inbjudan.id, email: inbjudan.email, mejl: 'skickat' }
  },

  /** Obesvarade kolleginbjudningar till organisationen som JAG skickat (RLS: invited_by = jag). */
  async pendingColleagueInvites(orgId: string): Promise<KollegaInbjudan[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, email_sent, expires_at, created_at, metadata')
      .eq('metadata->>kind', 'kollega')
      .eq('metadata->>kollega_org_id', orgId)
      .is('used_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as Array<{
      id: string
      email: string
      email_sent: boolean | null
      expires_at: string | null
      created_at: string
      metadata: { org_role?: OrgRole } | null
    }>).map((r) => ({
      id: r.id,
      email: r.email,
      email_sent: r.email_sent === true,
      expires_at: r.expires_at,
      created_at: r.created_at,
      org_role: r.metadata?.org_role ?? null,
    }))
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

  /**
   * CH6/CH13: namn på en konsulents deltagare, så chefen kan peka ut EN att
   * lämna över. Bygger på RPC:n overlamningsdeltagare (PENDING-migration
   * 20260929). Finns den inte än ger anropet ett ärligt fel, inte en tom lista.
   */
  async overlamningsdeltagare(orgId: string, fromConsultantId: string): Promise<OverlamningsDeltagare[]> {
    await requireUser()
    const { data, error } = await supabase.rpc('overlamningsdeltagare', {
      p_org_id: orgId,
      p_from_consultant_id: fromConsultantId,
    })
    if (error) throw new Error(rpcFelText(error))
    return ((data ?? []) as { participant_id: string; namn: string }[]).map((r) => ({
      participant_id: r.participant_id,
      namn: r.namn,
    }))
  },

  /** CH6/CH13: flyttar EN deltagare (RPC overlamna_deltagare, samma regler som handover). */
  async handoverParticipant(
    orgId: string,
    participantId: string,
    fromConsultantId: string,
    toConsultantId: string,
  ): Promise<void> {
    await requireUser()
    const { error } = await supabase.rpc('overlamna_deltagare', {
      p_org_id: orgId,
      p_participant_id: participantId,
      p_from_consultant_id: fromConsultantId,
      p_to_consultant_id: toConsultantId,
    })
    if (error) throw new Error(rpcFelText(error))
  },
}

export interface OverlamningsDeltagare {
  participant_id: string
  namn: string
}

/** Saknad RPC (42883 / PGRST202) är inget databasfel deltagaren ska tolka. */
export function rpcFelText(e: unknown): string {
  const kod = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : ''
  if (kod === '42883' || kod === 'PGRST202') {
    return 'Att lämna över en enskild deltagare är inte påslaget än. Lämna över hela caseloaden, eller vänta på uppdateringen.'
  }
  return felText(e)
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
