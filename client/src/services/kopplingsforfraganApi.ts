/**
 * kopplingsforfraganApi — deltagarens sida av kopplingsförfrågan (beslut Mikael 2026-10-11).
 *
 * En konsulent bjuder in en e-postadress som redan har ett konto. Hon gör exakt
 * samma sak som för en ny person (en rad i `invitations`); triggern
 * `invitations_kopplingsforfragan` avgör på serversidan att kontot finns och
 * skapar en väntande rad i `consultant_requests` + en notis. Konsulenten kan
 * inte läsa raden — svaret i dialogen är detsamma oavsett om kontot finns
 * (ingen användaruppräkning). Inget delas förrän deltagaren sagt ja.
 *
 * Svaret går BARA via RPC:n `besvara_kopplingsforfragan` (definer). Ett ja skriver
 * kopplingen, raden i consultant_participants och samtycket (consultant_consents,
 * granted_via 'consultant_request', med texten hon läste) i samma transaktion —
 * det var de två saker CR1-spåret saknade (avskrivet 2026-09-29: ingen deltagarvy,
 * och ett svar som aldrig kunde sparas).
 *
 * ── PENDING_20261011b_kopplingsforfragan ─────────────────────────────────────
 * Kolumnerna konsulent_namn/organisation_namn, triggern och RPC:n skapas av
 * `supabase/migrations/20261011b_kopplingsforfragan.sql`. Med flaggan `false` (nu)
 * läser ingen vy tabellen och dialogen beter sig som förut. Efter körning:
 * schema:refresh + grants:refresh, höj AUTH_TAK 26 → 27 i lint-grants.cjs, sätt
 * flaggan till true. RPC-namnet står i en konstant så att lint:grants regel 3
 * inte fäller innan funktionen finns i snapshoten — byt till en literal i
 * rpc-anropet (namnet inom citattecken direkt i anropet) samtidigt som flaggan sätts, så att
 * grinden vaktar anropet därefter.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/lib/supabase'

/** PENDING_20261011b — sätts till true när migrationen körts och snapshotarna uppdaterats. */
export const KOPPLINGSFORFRAGAN_FINNS = true


export interface Kopplingsforfragan {
  id: string
  consultant_id: string | null
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  message: string | null
  created_at: string
  konsulent_namn: string | null
  organisation_namn: string | null
}

export const kopplingsforfraganApi = {
  /**
   * Väntande förfrågningar till den inloggade. RLS ("Participants can view requests
   * to them") släpper bara igenom egna rader. Kastar vid fel — ett läsfel är inte
   * "inga förfrågningar".
   */
  async listaVantande(): Promise<Kopplingsforfragan[]> {
    const { data, error } = await supabase
      .from('consultant_requests')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Kopplingsforfragan[]
  },

  /** Ja (med samtyckestexten hon läste) eller nej. Kastar med databasens meddelande. */
  async besvara(id: string, ja: boolean, samtyckestext?: string): Promise<'ACCEPTED' | 'DECLINED'> {
    const { data, error } = await supabase.rpc('besvara_kopplingsforfragan', {
      p_id: id,
      p_ja: ja,
      p_samtyckestext: ja ? samtyckestext ?? null : null,
    })
    if (error) throw error
    const status = (data as { status?: string } | null)?.status
    if (status !== 'ACCEPTED' && status !== 'DECLINED') throw new Error('Oväntat svar från servern')
    return status
  },
}
