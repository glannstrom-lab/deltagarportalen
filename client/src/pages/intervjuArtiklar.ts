/**
 * Vilka kunskapsbanksartiklar som hör till intervjuträningen.
 *
 * Slugen (artikelns `id`) är svensk på båda språken, titeln är det inte.
 * Före 2026-09-22 filtrerades bara titeln på "intervju" — i engelskt läge är
 * titlarna engelska, och listan "Läs vidare" blev tom (driftgenomgången).
 */
export function artikelOmIntervju(a: { id: string; title?: string }): boolean {
  return /intervju/i.test(a.id) || /intervju|interview/i.test(a.title ?? '')
}
