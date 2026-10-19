/**
 * Översiktens kalenderrad: det som ligger närmast framåt — egen kalenderhändelse,
 * möte med konsulenten eller pass i aktivitetsplanen (DL4, 2026-10-19).
 *
 * Raden läste tidigare bara `calendar_events`. Anna i demot hade möte i morgon
 * och pass hela veckan, och Översikt sa ändå "inget inbokat". Ren logik.
 */
import type { MinVardagSummary } from '@/hooks/hubSummaryTypes'
import { formatLocalDate } from '@/services/aktivitetSchema'

export interface KalenderPost {
  titel: string
  /** `YYYY-MM-DD` i lokal tid. */
  datum: string
  till: string
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function nastaIKalendern(vardag: MinVardagSummary | undefined, moteTitel: string): KalenderPost | null {
  if (!vardag) return null
  const kandidater: Array<KalenderPost & { nyckel: string }> = []

  const handelse = vardag.upcomingEvents?.[0]
  if (handelse) {
    kandidater.push({ titel: handelse.title, datum: handelse.date, till: '/calendar', nyckel: `${handelse.date} ${handelse.time ?? '99:99'}` })
  }
  if (vardag.nastaMote) {
    const nar = new Date(vardag.nastaMote.scheduled_at)
    const datum = formatLocalDate(nar)
    kandidater.push({ titel: moteTitel, datum, till: '/my-consultant', nyckel: `${datum} ${hhmm(nar)}` })
  }
  if (vardag.nastaPass) {
    const p = vardag.nastaPass
    kandidater.push({ titel: p.title, datum: p.date, till: '/min-vecka', nyckel: `${p.date} ${p.start_time?.slice(0, 5) ?? '99:99'}` })
  }

  if (kandidater.length === 0) return null
  const forst = kandidater.reduce((a, b) => (b.nyckel < a.nyckel ? b : a))
  return { titel: forst.titel, datum: forst.datum, till: forst.till }
}
