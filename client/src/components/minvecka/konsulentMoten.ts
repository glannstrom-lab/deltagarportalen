/**
 * konsulentMoten — deltagarens möten med konsulenten i Min vecka (RD4,
 * rollspelet 2026-09-27).
 *
 * Anna sjukanmälde sig till morgonpasset och ingenting sa något om mötet med
 * konsulenten kl 12 samma dag — Min vecka läste bara `activity_sessions`.
 * Mötena ligger i `consultant_meetings`; deltagaren har SELECT på sina egna
 * rader ("Participants can view their meetings", participant_id = auth.uid())
 * men ingen skrivrätt. Att hon inte kan komma meddelas därför konsulenten som
 * ett vanligt meddelande (konsulentMeddelandeApi), inte som en markering.
 *
 * Bara bokade möten (`status = 'scheduled'`); ett inställt möte ska inte stå
 * i veckan som något hon väntas på.
 */

import { supabase } from '@/lib/supabase'
import { formatLocalDate } from '@/services/aktivitetSchema'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
export interface KonsulentMote {
  id: string
  scheduled_at: string
  duration_minutes: number | null
  meeting_type: string | null
  location: string | null
  meeting_link: string | null
  status: string | null
}

/** Mötets datum i lokal tid, `YYYY-MM-DD`. */
export function motesDatum(m: Pick<KonsulentMote, 'scheduled_at'>): string {
  return formatLocalDate(new Date(m.scheduled_at))
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** Start i lokal tid, `HH:MM`. */
export function motesStart(m: Pick<KonsulentMote, 'scheduled_at'>): string {
  return hhmm(new Date(m.scheduled_at))
}

/** Slut i lokal tid, `HH:MM` — eller null när längden inte är känd (hellre ingen tid än en påhittad). */
export function motesSlut(m: Pick<KonsulentMote, 'scheduled_at' | 'duration_minutes'>): string | null {
  if (!m.duration_minutes || m.duration_minutes <= 0) return null
  return hhmm(new Date(new Date(m.scheduled_at).getTime() + m.duration_minutes * 60_000))
}

/** Möten en viss dag, i tidsordning. */
export function motenPaDag(moten: readonly KonsulentMote[], datum: string): KonsulentMote[] {
  return moten.filter((m) => motesDatum(m) === datum).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
}

/** Veckans bokade möten, måndag–söndag i lokal tid. Kastar vid läsfel — ett fel är inte "inga möten". */
export async function hamtaMoten(fran: string, till: string): Promise<KonsulentMote[]> {
  const { data: auth, error: authFel } = await anvandareFranSession()
  if (authFel || !auth.user) throw new Error('Inte inloggad')
  const start = new Date(`${fran}T00:00:00`).toISOString()
  const slut = new Date(`${till}T23:59:59`).toISOString()
  const { data, error } = await supabase
    .from('consultant_meetings')
    .select('id, scheduled_at, duration_minutes, meeting_type, location, meeting_link, status')
    .eq('participant_id', auth.user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', start)
    .lte('scheduled_at', slut)
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as KonsulentMote[]
}
