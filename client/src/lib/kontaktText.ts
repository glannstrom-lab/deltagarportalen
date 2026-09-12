/**
 * PG24 (2026-09-12): en och samma formulering för "behöver kontakt" på
 * Översikt (Min dag + Kräver uppmärksamhet) och deltagarkortet:
 * "Aldrig kontaktad" när last_contact_at saknas, annars dagar sedan.
 */
export function kontaktText(t: (k: string, o?: Record<string, unknown>) => string, days: number | null | undefined): string {
  if (days === null || days === undefined) return t('consultant.participants.neverContacted')
  return t('consultant.alerts.noContactDays', { count: days })
}

/** Dagar sedan senaste kontakt; null = aldrig. Samma regel som deltagarkortet. */
export function dagarSedanKontakt(lastContactAt: string | null | undefined, nu: number = Date.now()): number | null {
  if (!lastContactAt) return null
  return Math.max(0, Math.floor((nu - new Date(lastContactAt).getTime()) / (24 * 60 * 60 * 1000)))
}
