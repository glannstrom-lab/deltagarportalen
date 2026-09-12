/**
 * konsulentMeddelandeApi — deltagarens meddelande till sin konsulent (F8).
 *
 * Min konsulent (pages/MyConsultant.tsx) skriver i dag rakt in i
 * `consultant_messages` från komponenten. Det här är samma insert som en
 * servicefunktion, så Min vecka kan skicka "Fråga om passet" utan att kopiera
 * SQL:en. RLS ("Users can send messages to an active counterpart") kräver att
 * avsändaren är auth.uid() och att en aktiv rad i consultant_participants
 * binder ihop deltagare och konsulent — går kopplingen sönder nekas insertet
 * (42501), och det ska synas för deltagaren, inte sväljas.
 *
 * Konsulentens id kommer ur profilens `consultant_id`; namnet ur RPC:n
 * `get_my_consultant` (profiles har med flit ingen SELECT-policy som låter en
 * deltagare läsa konsulentens rad, UX12).
 */

import { supabase } from '@/lib/supabase'

export interface MinKonsulent {
  id: string
  namn: string
}

export interface SkickatMeddelande {
  id: string
  content: string
  created_at: string
  receiver_id: string
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Inte inloggad')
  return data.user.id
}

export const konsulentMeddelandeApi = {
  /** Vem är min konsulent? null om ingen är kopplad. */
  async minKonsulent(): Promise<MinKonsulent | null> {
    const { data, error } = await supabase.rpc('get_my_consultant')
    if (error) throw error
    const rad = data as { id?: string | null; first_name?: string | null; last_name?: string | null } | null
    if (!rad?.id) return null
    const namn = [rad.first_name, rad.last_name].filter(Boolean).join(' ').trim()
    return { id: rad.id, namn: namn || 'din konsulent' }
  },

  /** Skickar ett meddelande till den kopplade konsulenten. Kastar om ingen är kopplad eller RLS nekar. */
  async skickaTillMinKonsulent(innehall: string): Promise<SkickatMeddelande> {
    const text = innehall.trim()
    if (!text) throw new Error('Tomt meddelande')
    const userId = await requireUserId()
    const konsulent = await this.minKonsulent()
    if (!konsulent) throw new Error('Ingen konsulent är kopplad')
    const { data, error } = await supabase
      .from('consultant_messages')
      .insert({ sender_id: userId, receiver_id: konsulent.id, content: text.slice(0, 4000), is_read: false })
      .select('id, content, created_at, receiver_id')
      .single()
    if (error) throw error
    return data as SkickatMeddelande
  },
}
