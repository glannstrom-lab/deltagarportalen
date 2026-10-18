/**
 * O13 (spår O / KF fas 2, 2026-10-18): deltagaren föreslår en mötestid.
 *
 * Ett förslag är en rad i consultant_meetings med status 'proposed'. RLS
 * (migration 20261018150000, provad mot prod): bara till den egna konsulenten,
 * bara framåt i tiden, bara som förslag; deltagaren kan dra tillbaka sitt eget
 * förslag men aldrig bekräfta det. Konsulenten bekräftar eller tackar nej i
 * möteskortet på deltagarsidan (moteskadens.bekraftaMote).
 */
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'

export type ForslagTyp = 'video' | 'phone' | 'physical'

export interface MittForslag {
  id: string
  scheduled_at: string
  meeting_type: ForslagTyp
  proposed_note: string | null
}

/** Datum + klockslag i svensk tid → ISO. Kastar om tiden inte ligger i framtiden. */
export function forslagTidpunkt(datum: string, klockslag: string, nu: Date = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(klockslag)) throw new Error('ogiltig')
  const d = new Date(`${datum}T${klockslag}:00`)
  if (Number.isNaN(d.getTime())) throw new Error('ogiltig')
  if (d.getTime() <= nu.getTime()) throw new Error('passerad')
  return d.toISOString()
}

export const motesforslagApi = {
  async foresla(input: { consultantId: string; tidpunkt: string; typ: ForslagTyp; meddelande: string }): Promise<void> {
    const { data: { user } } = await anvandareFranSession()
    if (!user) throw new Error('Inte inloggad')
    const note = input.meddelande.trim().slice(0, 500) || null
    const { error } = await supabase.from('consultant_meetings').insert({
      participant_id: user.id,
      consultant_id: input.consultantId,
      scheduled_at: input.tidpunkt,
      duration_minutes: 30,
      meeting_type: input.typ,
      status: 'proposed',
      proposed_by: user.id,
      proposed_note: note,
    })
    if (error) throw error
  },

  async minaForslag(): Promise<MittForslag[]> {
    const { data: { user } } = await anvandareFranSession()
    if (!user) return []
    const { data, error } = await supabase
      .from('consultant_meetings')
      .select('id, scheduled_at, meeting_type, proposed_note')
      .eq('participant_id', user.id)
      .eq('status', 'proposed')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
    if (error) throw error
    return (data ?? []) as MittForslag[]
  },

  async dragTillbaka(id: string): Promise<void> {
    const { data, error } = await supabase.from('consultant_meetings').delete().eq('id', id).eq('status', 'proposed').select('id')
    if (error) throw error
    if (!data?.length) throw new Error('Förslaget finns inte längre — konsulenten kan redan ha svarat.')
  },
}
