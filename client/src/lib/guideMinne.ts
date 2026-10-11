/**
 * guideMinne — kommer ihåg att en inbyggd guide stängts (Kom igång i
 * konsulentvyn, "Vad förväntas av mig" och genomgången i Min vecka).
 *
 * Beslut Mikael 2026-10-11: läget följer KONTOT, inte webbläsaren. Det sparas i
 * `user_preferences.guider` ({ "<guide>": { stangd, at } }) med localStorage som
 * cache och reserv:
 *   · vid montering visas cachens läge direkt (inget hopp), sedan läses kontot
 *     och dess läge vinner — stängd på mobilen är stängd på datorn;
 *   · finns inget i kontot men cachen säger stängd flyttas det upp en gång;
 *   · vid LÄSFEL gäller cachens värde. Guiden döljs aldrig "för alltid" på ett
 *     fel, och den visas inte heller igen bara för att nätet strulade;
 *   · skrivningen är read-modify-write av hela jsonb-objektet — går läsningen
 *     fel skrivs INGENTING (annars skrevs de andra guidernas läge över med tomt,
 *     se lärdomen "läsfel som tom data skriver över").
 *
 * ── PENDING_20261011b_guider_preferenser ─────────────────────────────────────
 * Kolumnen skapas av `supabase/migrations/20261011b_guider_preferenser.sql`.
 * Med flaggan `false` (nu) rör koden aldrig kolumnen — allt är localStorage som
 * förut. Efter körning: `npm run schema:refresh`, sätt flaggan till true.
 * Kolumnen läses via en variabel och skrivs via ett spritt objekt, så att
 * lint:schema/lint:kolumner inte fäller innan den finns i snapshoten.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Det som är KLART läses aldrig härifrån; det räknas alltid ur datan.
 */

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** PENDING_20261011b — sätts till true när migrationen körts och schema:refresh gjorts. */
export const GUIDER_KOLUMN_FINNS = true

const PREFIX = 'jobin-guide:'
const KOLUMN = 'guider'

export interface GuideLage {
  stangd: boolean
  /** ISO-tid för senaste ändringen. */
  at: string
}
export type Guider = Record<string, GuideLage>

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
    // privat läge — kontot (eller nästa besök) får bära läget
  }
}

/** Plockar ut ett giltigt guideobjekt ur kolumnens värde; allt annat blir tomt. */
export function tolkaGuider(varde: unknown): Guider {
  if (!varde || typeof varde !== 'object' || Array.isArray(varde)) return {}
  const ut: Guider = {}
  for (const [k, v] of Object.entries(varde as Record<string, unknown>)) {
    if (v && typeof v === 'object' && typeof (v as { stangd?: unknown }).stangd === 'boolean') {
      const at = (v as { at?: unknown }).at
      ut[k] = { stangd: (v as { stangd: boolean }).stangd, at: typeof at === 'string' ? at : '' }
    }
  }
  return ut
}

/** Nytt objekt med en guides läge ändrat — de andra guiderna orörda. */
export function medGuide(guider: Guider, guide: string, stangd: boolean, nu: Date = new Date()): Guider {
  return { ...guider, [guide]: { stangd, at: nu.toISOString() } }
}

/** Kontots guider. Kastar vid läsfel — ett fel är inte "inga guider stängda". */
export async function hamtaGuider(userId: string): Promise<Guider> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(KOLUMN)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return tolkaGuider((data as Record<string, unknown> | null)?.[KOLUMN])
}

/** Sparar en guides läge i kontot. Läser först; går läsningen fel skrivs ingenting. */
export async function sparaGuideIKonto(guide: string, userId: string, stangd: boolean): Promise<void> {
  const guider = await hamtaGuider(userId)
  const falt: Record<string, unknown> = { [KOLUMN]: medGuide(guider, guide, stangd) }
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...falt }, { onConflict: 'user_id' })
  if (error) throw error
}

/**
 * [stängd, sättStängd]. Cachens läge direkt, kontots läge när det är inläst.
 * `kolumnFinns` är flaggan — parametern finns för testerna.
 */
export function useGuideStangd(
  guide: string,
  userId: string | null | undefined,
  kolumnFinns: boolean = GUIDER_KOLUMN_FINNS,
): [boolean, (stangd: boolean) => void] {
  const [stangd, setStangd] = useState(() => lasGuideStangd(guide, userId))
  const [forraNyckel, setForraNyckel] = useState(() => nyckel(guide, userId))
  // Ändrat för hand efter montering: då får ett sent svar från kontot inte skriva över.
  const andradNu = useRef(false)
  const aktuell = nyckel(guide, userId)
  if (aktuell !== forraNyckel) {
    // Kontot byttes (eller laddades in) efter montering — läs det nya kontots läge.
    setForraNyckel(aktuell)
    setStangd(lasGuideStangd(guide, userId))
  }

  useEffect(() => {
    if (!kolumnFinns || !userId) return
    andradNu.current = false
    let aktiv = true
    hamtaGuider(userId)
      .then((guider) => {
        if (!aktiv || andradNu.current) return
        const iKontot = guider[guide]
        if (iKontot) {
          sparaGuideStangd(guide, userId, iKontot.stangd)
          setStangd(iKontot.stangd)
        } else if (lasGuideStangd(guide, userId)) {
          // Stängd på den här enheten innan läget följde kontot — flytta upp det.
          sparaGuideIKonto(guide, userId, true).catch((err) => console.warn('[guideMinne] kunde inte flytta upp läget:', err))
        }
      })
      .catch((err) => {
        // Läsfel: cachens värde står kvar.
        console.warn('[guideMinne] kunde inte läsa guidernas läge:', err)
      })
    return () => {
      aktiv = false
    }
  }, [guide, userId, kolumnFinns])

  const satt = (v: boolean) => {
    andradNu.current = true
    sparaGuideStangd(guide, userId, v)
    setStangd(v)
    if (kolumnFinns && userId) {
      sparaGuideIKonto(guide, userId, v).catch((err) => console.warn('[guideMinne] kunde inte spara guidens läge:', err))
    }
  }
  return [stangd, satt]
}
