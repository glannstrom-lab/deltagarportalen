/**
 * delningsforslagApi — förslagsraden ÄR samtycket (AG5/AG8, migration
 * 20260902100000 + 20260913100000, körda 2026-09-13).
 *
 * Tre parter, tre vägar:
 *   KONSULENTEN skapar ett förslag (plats + deltagare + vilka fält + text) och
 *     kan redigera/radera det så länge det är pending. Efter beslut kan hon
 *     inte ändra det (trigger guard_share_proposal_after_decision).
 *   DELTAGAREN svarar genom RPC:n respond_to_share_proposal — hennes ENDA
 *     skrivväg (ingen UPDATE-policy). pending → accepted|declined,
 *     accepted → withdrawn. Ett ja loggas i consent_history, ett nej inte.
 *   FÖRETAGET läser aldrig den här tabellen. Det läser vyn employer_proposals
 *     (bara accepted, bara egna, fält per show_*) — se foretagApi.ts.
 *
 * Meddelanden företag ↔ konsulent bor i employer_messages, en tråd per
 * förslag, aldrig till deltagaren (beslut 2, 2026-09-13). Båda sidorna
 * använder `foretagsTradApi` nedan.
 *
 * Mönster: kastar vid fel, sväljer aldrig till []. Notiser skapas av
 * databasens triggers (share_proposal_notify, employer_messages_notify) —
 * klienten skickar inga.
 */

import { supabase } from '@/lib/supabase'

export type DelningsforslagStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired'
export type ForetagsSvar = 'pending' | 'interested' | 'declined'

/** Fälten deltagaren kan godkänna. show_documents finns i tabellen men delas inte i etapp 1 (ingen filväg i vyn). */
export interface DelningsFalt {
  show_contact: boolean
  show_summary: boolean
  show_skills: boolean
  show_experience: boolean
  show_education: boolean
}

export const DELNINGSFALT: ReadonlyArray<keyof DelningsFalt> = [
  'show_contact', 'show_summary', 'show_skills', 'show_experience', 'show_education',
] as const

export interface Delningsforslag extends DelningsFalt {
  id: string
  placement_id: string
  participant_id: string
  consultant_id: string
  company_account_id: string | null
  show_documents: boolean
  presentation_text: string | null
  status: DelningsforslagStatus
  participant_message: string | null
  decided_at: string | null
  expires_at: string | null
  max_views: number | null
  view_count: number
  last_viewed_at: string | null
  employer_response: ForetagsSvar
  employer_message: string | null
  employer_responded_at: string | null
  created_at: string
  updated_at: string
}

/** Platsens grunddata, inbäddad för deltagaren (hon har SELECT på sina egna platser). */
export interface DelningsforslagMedPlats extends Delningsforslag {
  consultant_work_placements: {
    company_name: string
    occupation: string | null
    placement_type: string
    start_date: string | null
    end_date: string | null
    hours_per_week: number | null
    schedule_days: string | null
  } | null
}

export type NyttDelningsforslag = Partial<DelningsFalt> & {
  placement_id: string
  participant_id: string
  presentation_text?: string | null
  expires_at?: string | null
  max_views?: number | null
}

const PLATS_EMBED = 'consultant_work_placements(company_name, occupation, placement_type, start_date, end_date, hours_per_week, schedule_days)'

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Inte inloggad')
  return data.user.id
}

export const delningsforslagApi = {
  // ---------------------------------------------------------------- konsulent

  /** Konsulenten skapar ett förslag. company_account_id ärvs från platsen i databasen. */
  async skapa(input: NyttDelningsforslag): Promise<Delningsforslag> {
    const consultantId = await requireUserId()
    const { data, error } = await supabase
      .from('employer_share_proposals')
      .insert({ ...input, consultant_id: consultantId })
      .select('*')
      .single()
    if (error) throw error
    return data as Delningsforslag
  },

  /** Konsulentens förslag för en plats, nyaste först. */
  async listaForPlacering(placementId: string): Promise<Delningsforslag[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_share_proposals')
      .select('*')
      .eq('placement_id', placementId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Delningsforslag[]
  },

  /** Alla konsulentens förslag (för platsfliken), nyaste först. */
  async listaMinaSomKonsulent(): Promise<Delningsforslag[]> {
    const consultantId = await requireUserId()
    const { data, error } = await supabase
      .from('employer_share_proposals')
      .select('*')
      .eq('consultant_id', consultantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Delningsforslag[]
  },

  /** Bara medan förslaget är pending — annars nekar triggern (check_violation). */
  async uppdateraUtkast(id: string, patch: Partial<DelningsFalt> & { presentation_text?: string | null; expires_at?: string | null; max_views?: number | null }): Promise<Delningsforslag> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_share_proposals')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Delningsforslag
  },

  /** Konsulenten tar bort ett pending-förslag hon ångrat. UI:t ska inte erbjuda det efter beslut. */
  async raderaUtkast(id: string): Promise<void> {
    await requireUserId()
    const { error } = await supabase.from('employer_share_proposals').delete().eq('id', id).eq('status', 'pending')
    if (error) throw error
  },

  // ---------------------------------------------------------------- deltagare

  /** Deltagarens förslag med platsens grunddata, nyaste först. RLS: bara hennes egna. */
  async listaMina(): Promise<DelningsforslagMedPlats[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_share_proposals')
      .select(`*, ${PLATS_EMBED}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as DelningsforslagMedPlats[]
  },

  /**
   * Deltagarens svar — den enda skrivvägen. Kastar databasens svenska fel
   * ("Förslaget har gått ut", "Förslaget är redan besvarat") rakt av.
   */
  async svara(id: string, beslut: 'accepted' | 'declined' | 'withdrawn', meddelande?: string | null): Promise<void> {
    await requireUserId()
    const { error } = await supabase.rpc('respond_to_share_proposal', {
      p_proposal_id: id,
      p_decision: beslut,
      p_message: meddelande?.trim() || null,
    })
    if (error) throw new Error(error.message || 'Kunde inte spara svaret')
  },
}

// ============================================================================
// Tråden företag ↔ konsulent (employer_messages)
// ============================================================================

export type TradAvsandare = 'foretag' | 'konsulent'

export interface TradMeddelande {
  id: string
  proposal_id: string
  sender_id: string
  sender_kind: TradAvsandare
  content: string
  is_read: boolean
  created_at: string
}

export const foretagsTradApi = {
  async lista(proposalId: string): Promise<TradMeddelande[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_messages')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as TradMeddelande[]
  },

  /** RLS kräver att avsändaren är rätt part för förslaget; annars 42501 och det ska synas. */
  async skicka(proposalId: string, somAvsandare: TradAvsandare, innehall: string): Promise<TradMeddelande> {
    const text = innehall.trim()
    if (!text) throw new Error('Tomt meddelande')
    const senderId = await requireUserId()
    const { data, error } = await supabase
      .from('employer_messages')
      .insert({ proposal_id: proposalId, sender_id: senderId, sender_kind: somAvsandare, content: text.slice(0, 4000) })
      .select('*')
      .single()
    if (error) throw error
    return data as TradMeddelande
  },

  /** Markerar motpartens meddelanden i tråden som lästa. Egna rader nekas av policyn och hoppas därför över. */
  async markeraLasta(proposalId: string): Promise<void> {
    const me = await requireUserId()
    const { error } = await supabase
      .from('employer_messages')
      .update({ is_read: true })
      .eq('proposal_id', proposalId)
      .eq('is_read', false)
      .neq('sender_id', me)
    if (error) throw error
  },

  /** Olästa meddelanden från motparten, över alla trådar jag ser. */
  async antalOlasta(): Promise<number> {
    const me = await requireUserId()
    const { count, error } = await supabase
      .from('employer_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', me)
    if (error) throw error
    return count ?? 0
  },
}
