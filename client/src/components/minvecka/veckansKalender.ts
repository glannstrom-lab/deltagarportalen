/**
 * Veckans kalenderfil (NF1-rest). Bara det som är inbokat och ännu inte har
 * hänt: pass utan frånvaromarkering (en anmäld frånvaro är inget man ska möta
 * upp till), och bokade möten (`hamtaMoten` läser bara status = 'scheduled')
 * med känd längd. UID:n är samma som för enskilda poster, så en ny import
 * eller en import efter "Lägg till i kalendern" uppdaterar i stället för att
 * dubblera.
 */
import type { ActivitySession } from '@/services/aktivitetApi'
import { franNarvarovarde } from '@/components/ui/kvarterStatus'
import type { IcsHandelse, IcsOgonblick } from '@/lib/ics'
import type { KonsulentMote } from './konsulentMoten'

export interface KalenderTexter {
  moteTitel: string
  /** Beskrivning per mötestyp-nyckel och passtyp sköts av anroparen */
  passBeskrivning: (p: ActivitySession) => string
  moteBeskrivning: (m: KonsulentMote) => string
}

export function veckansKalenderPoster(
  pass: readonly ActivitySession[],
  moten: readonly KonsulentMote[],
  idag: string,
  nu: Date,
  texter: KalenderTexter,
): Array<IcsHandelse | IcsOgonblick> {
  const poster: Array<IcsHandelse | IcsOgonblick> = []
  for (const s of pass) {
    if (s.date < idag) continue
    if (s.attendance && franNarvarovarde(s.attendance) !== 'narvarande') continue
    poster.push({
      uid: `${s.id}@jobin.se`,
      datum: s.date,
      start: s.start_time,
      slut: s.end_time,
      titel: s.title,
      plats: s.location,
      beskrivning: texter.passBeskrivning(s),
    })
  }
  for (const m of moten) {
    if (m.status && m.status !== 'scheduled') continue
    if (!m.duration_minutes || m.duration_minutes <= 0) continue
    const startUtc = new Date(m.scheduled_at)
    if (startUtc.getTime() < nu.getTime()) continue
    poster.push({
      uid: `${m.id}@jobin.se`,
      startUtc,
      slutUtc: new Date(startUtc.getTime() + m.duration_minutes * 60_000),
      titel: texter.moteTitel,
      plats: m.location,
      beskrivning: texter.moteBeskrivning(m),
    })
  }
  return poster
}
