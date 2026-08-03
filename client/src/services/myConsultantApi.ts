/**
 * myConsultantApi — deltagarens uppslag av SIN EGEN konsulent (UX12).
 *
 * `profiles` har med flit ingen SELECT-policy som låter en deltagare läsa sin
 * konsulents rad — en policy hade lämnat ut hela profilen (samtyckestidsstämplar,
 * hälsoflaggor, roller). I stället finns `get_my_consultant()`, en SECURITY
 * DEFINER-RPC som utgår från `auth.uid()` och returnerar exakt sex
 * kontaktfält. Se `supabase/migrations/20260803100000_get_my_consultant.sql`.
 *
 * Alla deltagarvända ytor som behöver konsulentens namn ska gå via den här
 * funktionen. En direkt `.from('profiles').eq('id', consultant_id)` ger 0 rader
 * — den vägen såg ut som "ingen konsulent tilldelad" i UI:t i månader.
 */

import { supabase } from '@/lib/supabase'
import { apiLogger } from '@/lib/logger'

export interface MyConsultant {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}

/**
 * Hämtar den inloggade deltagarens tilldelade konsulent.
 *
 * @returns kontaktuppgifterna, eller `null` när ingen konsulent är tilldelad.
 * @throws vid faktiska anropsfel — den som visar upp data ska kunna skilja
 *   "du har ingen konsulent" från "vi kunde inte hämta just nu". Att svälja
 *   felet och returnera null var precis det som dolde UX12.
 */
export async function getMyConsultant(): Promise<MyConsultant | null> {
  const { data, error } = await supabase.rpc('get_my_consultant')

  if (error) {
    apiLogger.error('[myConsultantApi] get_my_consultant misslyckades', { message: error.message, code: error.code })
    throw new Error(error.message)
  }

  return (data as MyConsultant | null) ?? null
}

/** Namnet som en sträng, eller null. Bekvämlighet för ytor som bara vill visa namnet. */
export async function getMyConsultantName(): Promise<string | null> {
  const consultant = await getMyConsultant()
  if (!consultant) return null
  const name = [consultant.first_name, consultant.last_name].filter(Boolean).join(' ')
  return name || null
}
