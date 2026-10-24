/**
 * FN20 (2026-10-24): konsulentens sida av O13 — deltagarnas förslag på mötestid.
 *
 * Förslagen är rader i consultant_meetings med status 'proposed' (se
 * motesforslagApi.ts för deltagarens sida). Konsulenten läser dem för sina
 * egna deltagare; RLS "KS2b: konsulent läser aktiva deltagares möten" släpper
 * igenom dem, och filtret på consultant_id begränsar till de egna.
 * Kastar vid fel — anroparen visar felet, aldrig "inga förslag".
 */
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import type { MoteTyp } from './moteskadens'

export interface MotesForslag {
  id: string
  participant_id: string
  scheduled_at: string
  meeting_type: MoteTyp | null
  proposed_note: string | null
}

/** Förslag som väntar på svar: status 'proposed' och tiden ligger framåt. */
export function vantandeForslag(rader: readonly (MotesForslag & { status?: string })[], nu: Date): MotesForslag[] {
  return rader
    .filter((r) => (r.status === undefined || r.status === 'proposed') && new Date(r.scheduled_at).getTime() > nu.getTime())
    .map(({ id, participant_id, scheduled_at, meeting_type, proposed_note }) => ({ id, participant_id, scheduled_at, meeting_type, proposed_note }))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
}

export async function hamtaForslagForKonsulent(nu: Date = new Date()): Promise<MotesForslag[]> {
  const { data: { user }, error: authError } = await anvandareFranSession()
  if (authError) throw authError
  if (!user) throw new Error('Inte inloggad')
  const { data, error } = await supabase
    .from('consultant_meetings')
    .select('id, participant_id, scheduled_at, meeting_type, status, proposed_note')
    .eq('consultant_id', user.id)
    .eq('status', 'proposed')
    .gte('scheduled_at', nu.toISOString())
    .order('scheduled_at')
  if (error) throw error
  // Filtreras också här: ett förslag vars tid hunnit passera är inaktuellt (samma regel som möteskortet).
  return vantandeForslag((data ?? []) as (MotesForslag & { status?: string })[], nu)
}
