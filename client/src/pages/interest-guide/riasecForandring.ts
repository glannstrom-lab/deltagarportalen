/**
 * Förändringen i ett RIASEC-område mellan två test.
 *
 * Skalan är 1–5 i hela steg (`calculateUserProfile` avrundar medelvärdet).
 * Fram till 2026-09-22 räknades allt under 3 steg som "Oförändrad" — en
 * tröskel som hörde till en gammal 0–100-skala. På 1–5 betydde det att ett
 * område som gått från 1 till 3 (eller från 5 till 3) visades som oförändrat:
 * jämförelsen, sidans enda syfte med historiken, sa nästan alltid "ingen
 * skillnad".
 */
export type Riktning = 'upp' | 'ned' | 'oforandrad'

export function riasecForandring(nu: number, fore: number): { riktning: Riktning; diff: number } {
  const diff = Math.round(nu - fore)
  if (diff === 0) return { riktning: 'oforandrad', diff: 0 }
  return { riktning: diff > 0 ? 'upp' : 'ned', diff }
}
