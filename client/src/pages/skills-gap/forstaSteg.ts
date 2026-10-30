/**
 * AIX7 — "Första steget i dag" i kompetensgapets handlingsplan.
 *
 * Texten kommer från modellen (och är genomsökt på servern, se
 * `client/api/_prompts/_forstasteg.js`). Länken gör den inte: stegtypen är en av
 * fyra fasta värden och artikeln slås upp här ur en karta vi själva skrivit.
 * Kunskapsbanken är redaktionellt innehåll — modellen får aldrig peka dit.
 *
 * "Lägg i kalendern" skriver till `calendar_events` med typ `task`, samma tabell
 * och form som AI-teamets "skapa uppgift" (AgentChat). Min vecka läser inte
 * den tabellen: den visar konsulentens aktivitetsplan (`activity_sessions`), som
 * deltagaren inte kan skriva i. Kalendern är det enda ställe deltagarens egna
 * uppgifter bor, och det är dit steget går.
 */
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import { formatLocalDate } from '@/services/aktivitetSchema'

export type ForstaStegTyp = 'kartlagga' | 'natverka' | 'utveckla' | 'cv'

/** Typ -> artikel i kunskapsbanken. Slugarna vaktas mot artikelkorpusen i testet. */
export const FORSTA_STEG_ARTIKEL: Record<ForstaStegTyp, string> = {
  kartlagga: 'kompetensinventering-guide',
  natverka: 'natverka-for-jobb',
  utveckla: 'kompetensutveckling-plan',
  cv: 'cv-grunder',
}

/** Okänd eller saknad typ -> ingen länk. Aldrig en gissad. */
export function artikelForForstaSteg(typ: string | undefined): string | null {
  return typ && Object.prototype.hasOwnProperty.call(FORSTA_STEG_ARTIKEL, typ)
    ? FORSTA_STEG_ARTIKEL[typ as ForstaStegTyp]
    : null
}

/** Lägger steget som en uppgift i dag i personens kalender. Kastar vid fel. */
export async function laggForstaStegIKalendern(steg: string, rubrik: string): Promise<void> {
  const { data: { user } } = await anvandareFranSession()
  if (!user) throw new Error('Inte inloggad')
  const { error } = await supabase.from('calendar_events').insert({
    user_id: user.id,
    title: rubrik.slice(0, 80),
    description: steg,
    date: formatLocalDate(new Date()),
    type: 'task',
  })
  if (error) throw error
}
