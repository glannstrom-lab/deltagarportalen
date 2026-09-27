/**
 * minPraktikApi — deltagarens egen praktik- eller arbetsträningsplats (RD25,
 * rollspelet 2026-09-27).
 *
 * Sara visste inte att Demobageriet var hennes praktikplats, vem hon skulle
 * fråga där eller vad hon skulle göra om hon blev sjuk. Platsen finns i
 * `consultant_work_placements`; RLS-policyn "Deltagaren ser sina platser"
 * (participant_id = auth.uid(), 20260924_rls_initplan.sql:430) släpper igenom
 * hennes egna rader.
 *
 * **Uttrycklig kolumnlista med flit.** Raden bär också konsulentens interna
 * underlag — `internal_adaptation_notes` (VARFÖR, art. 9-närliggande),
 * `employer_future_needs`, `supervision_notes` m.fl. De hör inte hemma i
 * deltagarens vy av sin plan, så de hämtas aldrig hit. Lägg inte till `*`.
 */

import { supabase } from '@/lib/supabase'

export type PraktikTyp = 'praktik' | 'arbetstraning' | 'arbetsprovning' | 'subventionerad_anstallning'

export interface MinPraktik {
  id: string
  placement_type: PraktikTyp
  status: 'planerad' | 'pagaende'
  company_name: string
  occupation: string | null
  address: string | null
  contact_name: string | null
  contact_phone: string | null
  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  schedule_days: string | null
  sick_call_phone: string | null
  sick_call_instructions: string | null
}

/** Kolumnerna deltagaren får se. Vaktas av minPraktikApi.test.ts. */
export const PRAKTIK_KOLUMNER =
  'id, placement_type, status, company_name, occupation, address, contact_name, contact_phone, start_date, end_date, hours_per_week, schedule_days, sick_call_phone, sick_call_instructions'

/** Platsen som gäller nu: pågående före planerad, sedan tidigast start. Null = ingen. Ren funktion. */
export function valjAktuellPlats(rader: readonly MinPraktik[]): MinPraktik | null {
  const ordning = (s: MinPraktik['status']) => (s === 'pagaende' ? 0 : 1)
  const sorterade = [...rader].sort(
    (a, b) => ordning(a.status) - ordning(b.status) || (a.start_date ?? '9999').localeCompare(b.start_date ?? '9999'),
  )
  return sorterade[0] ?? null
}

export const minPraktikApi = {
  /** Deltagarens aktuella plats, eller null. Kastar vid läsfel — ett fel är inte "ingen plats". */
  async hamtaAktuell(): Promise<MinPraktik | null> {
    const { data: { user }, error: authFel } = await supabase.auth.getUser()
    if (authFel) throw authFel
    if (!user) throw new Error('Inte inloggad')
    const { data, error } = await supabase
      .from('consultant_work_placements')
      .select(PRAKTIK_KOLUMNER)
      .eq('participant_id', user.id)
      .in('status', ['planerad', 'pagaende'])
    if (error) throw error
    return valjAktuellPlats((data ?? []) as unknown as MinPraktik[])
  },
}
