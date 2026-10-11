/**
 * guideMinne — kommer ihåg att en inbyggd guide stängts (Kom igång i
 * konsulentvyn, "Vad förväntas av mig" och genomgången i Min vecka).
 *
 * localStorage, per konto och webbläsare. Med flit inte i user_preferences:
 * tabellen har ingen kolumn för det (mätt 2026-10-11), och en migration mot
 * prod ligger utanför det här passet. Det värsta som händer när minnet saknas
 * (ny enhet, privat läge) är att guiden visas en gång till — den blockerar
 * ingenting och kan stängas igen. Det som är KLART läses aldrig härifrån; det
 * räknas alltid ur datan.
 */

import { useState } from 'react'

const PREFIX = 'jobin-guide:'

function nyckel(guide: string, userId: string | null | undefined): string {
  return `${PREFIX}${guide}:${userId ?? 'anon'}`
}

export function lasGuideStangd(guide: string, userId: string | null | undefined): boolean {
  try {
    return localStorage.getItem(nyckel(guide, userId)) === 'stangd'
  } catch {
    return false
  }
}

export function sparaGuideStangd(guide: string, userId: string | null | undefined, stangd: boolean): void {
  try {
    if (stangd) localStorage.setItem(nyckel(guide, userId), 'stangd')
    else localStorage.removeItem(nyckel(guide, userId))
  } catch {
    // privat läge — guiden visas igen nästa gång, inget går förlorat
  }
}

/** [stängd, sättStängd] — läst vid montering, sparad vid varje ändring. */
export function useGuideStangd(guide: string, userId: string | null | undefined): [boolean, (stangd: boolean) => void] {
  const [stangd, setStangd] = useState(() => lasGuideStangd(guide, userId))
  const [forraNyckel, setForraNyckel] = useState(() => nyckel(guide, userId))
  const aktuell = nyckel(guide, userId)
  if (aktuell !== forraNyckel) {
    // Kontot byttes (eller laddades in) efter montering — läs det nya kontots läge.
    setForraNyckel(aktuell)
    setStangd(lasGuideStangd(guide, userId))
  }
  const satt = (v: boolean) => {
    sparaGuideStangd(guide, userId, v)
    setStangd(v)
  }
  return [stangd, satt]
}
