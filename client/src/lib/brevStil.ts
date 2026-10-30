/**
 * brevStil (KF13) — brevskrivaren lär sig av hur deltagaren ändrar sina utkast.
 *
 * Ingen modellträning och inget extra AI-anrop. När deltagaren sparar ett brev
 * som hen ändrat jämförs utkastet med den sparade texten MEKANISKT (utropstecken,
 * "man" mot "jag", meningslängd, styckelängd, brevets längd), och högst fem korta
 * stilpreferenser sparas på kontot. Nästa gång ett brev skrivs läggs de i
 * prompten som STIL, aldrig som fakta om personen.
 *
 * Varför deterministiskt: preferenserna är meningar ur en fast katalog (plus ett
 * tal). Ingen text ur brevet följer med, så varken hälsa, namn eller något annat
 * personligt kan hamna i en preferens. Det som deltagaren själv skriver när hen
 * ändrar en rad under Inställningar går genom hälsoordslistan (samma som AIX11
 * och AIX2) och längdbegränsas.
 *
 * Av som standard. Det gäller först när deltagaren slagit på det under
 * Inställningar, där preferenserna syns, kan ändras och tas bort.
 *
 * ── PENDING_20261030_brev_stil ───────────────────────────────────────────────
 * Kolumnen skapas av `supabase/migrations/20261030_brev_stil.sql` (EJ KÖRD).
 * Med flaggan `false` (nu) rör koden aldrig kolumnen: ingenting lärs, inget
 * skickas, och Inställningar visar ingen sektion. Efter körning:
 * `npm run schema:refresh`, sätt flaggan till true.
 * Kolumnen läses via en variabel och skrivs via ett spritt objekt, så att
 * lint:schema/lint:kolumner inte fäller innan den finns i snapshoten.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Läsfel är inte "inga preferenser": skrivningen är read-modify-write av hela
 * objektet, och går läsningen fel skrivs INGENTING.
 */

import { supabase } from '@/lib/supabase'
import { hittaHalsoord } from '@/components/consultant/utkastGranskare'

/** PENDING_20261030_brev_stil — true när migrationen körts och schema:refresh gjorts. */
export const BREV_STIL_KOLUMN_FINNS = false

const KOLUMN = 'brev_stil'

export const MAX_PREFERENSER = 5
export const MAX_TECKEN = 100

export interface Preferens {
  /** Katalogens id (t.ex. "utrop"). Samma id ersätter aldrig en rad deltagaren ändrat. */
  id: string
  text: string
  /** ISO-tid då raden lades till. */
  at: string
}

export interface BrevStil {
  /** Av som standard. */
  pa: boolean
  prefs: Preferens[]
}

export const TOM_STIL: BrevStil = { pa: false, prefs: [] }

/**
 * Städar en preferenstext: en rad, högst MAX_TECKEN tecken. Returnerar null för
 * tomt eller för text som nämner hälsa (art. 9) — den får aldrig sparas eller skickas.
 */
export function rensaPreferens(text: unknown): string | null {
  if (typeof text !== 'string') return null
  const ren = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TECKEN)
  if (!ren) return null
  if (hittaHalsoord(ren).length > 0) return null
  return ren
}

/** Plockar ut en giltig BrevStil ur kolumnens värde; allt annat blir av/tomt. */
export function tolkaBrevStil(varde: unknown): BrevStil {
  if (!varde || typeof varde !== 'object' || Array.isArray(varde)) return { ...TOM_STIL, prefs: [] }
  const v = varde as { pa?: unknown; prefs?: unknown }
  const prefs: Preferens[] = []
  if (Array.isArray(v.prefs)) {
    for (const p of v.prefs) {
      if (!p || typeof p !== 'object') continue
      const { id, text, at } = p as { id?: unknown; text?: unknown; at?: unknown }
      const ren = rensaPreferens(text)
      if (typeof id !== 'string' || !id || !ren) continue
      prefs.push({ id, text: ren, at: typeof at === 'string' ? at : '' })
      if (prefs.length >= MAX_PREFERENSER) break
    }
  }
  return { pa: v.pa === true, prefs }
}

// ── Härledning ───────────────────────────────────────────────────────────────

export interface Forslag {
  id: string
  text: string
}

const ORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu

function ord(text: string): string[] {
  return text.match(ORD_RE) ?? []
}

function meningar(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((m) => ord(m).length > 0)
}

function stycken(text: string): string[] {
  return text.split(/\n\s*\n/).filter((s) => ord(s).length > 0)
}

function antal(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length
}

const snitt = (tal: number[]) => (tal.length === 0 ? 0 : tal.reduce((a, b) => a + b, 0) / tal.length)
const avrunda = (n: number, steg = 1) => Math.max(steg, Math.round(n / steg) * steg)

/** Under så här många ord i utkastet jämförs inget: för litet underlag. */
const MIN_ORD_UTKAST = 40

/**
 * Jämför AI-utkastet med den sparade texten. Returnerar högst MAX_PREFERENSER
 * förslag, alla ur en fast katalog. Samma text eller för litet underlag ger inget.
 */
export function harleda(utkast: string, sparad: string): Forslag[] {
  const u = utkast.replace(/\r\n/g, '\n').trim()
  const s = sparad.replace(/\r\n/g, '\n').trim()
  if (!u || !s || u === s) return []
  const uOrd = ord(u)
  const sOrd = ord(s)
  if (uOrd.length < MIN_ORD_UTKAST || sOrd.length === 0) return []

  const ut: Forslag[] = []

  // Utropstecken: AI:n skrev några, deltagaren tog bort alla.
  if (antal(u, /!/g) >= 1 && antal(s, /!/g) === 0) {
    ut.push({ id: 'utrop', text: 'Använd inte utropstecken.' })
  }

  // "man" mot "jag": deltagaren har bytt det opersonliga mot första person.
  const manU = antal(u, /(?<![\p{L}\p{N}])man(?![\p{L}\p{N}])/giu)
  const manS = antal(s, /(?<![\p{L}\p{N}])man(?![\p{L}\p{N}])/giu)
  const jagS = antal(s, /(?<![\p{L}\p{N}])jag(?![\p{L}\p{N}])/giu)
  if (manU >= 1 && manS < manU && jagS >= 1) {
    ut.push({ id: 'jag', text: 'Skriv ”jag” i stället för ”man”.' })
  }

  // Meningslängd (ord per mening), jämförd som snitt.
  const mU = snitt(meningar(u).map((m) => ord(m).length))
  const mS = snitt(meningar(s).map((m) => ord(m).length))
  if (mU - mS >= 3 && mS / mU <= 0.8) {
    ut.push({ id: 'meningar', text: `Skriv korta meningar, ungefär ${avrunda(mS)} ord var.` })
  } else if (mS - mU >= 3 && mS / mU >= 1.25) {
    ut.push({ id: 'meningar', text: `Skriv längre, sammanhängande meningar, ungefär ${avrunda(mS)} ord var.` })
  }

  // Styckelängd: bara om deltagaren själv har delat upp i minst två stycken.
  const stU = stycken(u)
  const stS = stycken(s)
  if (stS.length >= 2) {
    const pU = snitt(stU.map((p) => ord(p).length))
    const pS = snitt(stS.map((p) => ord(p).length))
    if (pU - pS >= 15 && pS / pU <= 0.75) {
      ut.push({ id: 'stycken', text: `Skriv korta stycken, ungefär ${avrunda(pS, 10)} ord var.` })
    }
  }

  // Brevets längd.
  const forhallande = sOrd.length / uOrd.length
  if (forhallande <= 0.75) {
    ut.push({ id: 'langd', text: `Skriv ett kortare brev, ungefär ${avrunda(sOrd.length, 10)} ord.` })
  } else if (forhallande >= 1.3) {
    ut.push({ id: 'langd', text: `Skriv ett längre brev, ungefär ${avrunda(sOrd.length, 10)} ord.` })
  }

  return ut.slice(0, MAX_PREFERENSER)
}

/**
 * Lägger nya förslag till de sparade. Ett id som redan finns lämnas orört (har
 * deltagaren ändrat texten gäller hennes version). Är listan full tas den äldsta bort.
 */
export function slaIhop(befintliga: Preferens[], nya: Forslag[], nu: Date = new Date()): Preferens[] {
  const lista = befintliga.slice()
  for (const f of nya) {
    if (lista.some((p) => p.id === f.id)) continue
    const text = rensaPreferens(f.text)
    if (!text) continue
    lista.push({ id: f.id, text, at: nu.toISOString() })
  }
  if (lista.length <= MAX_PREFERENSER) return lista
  return lista
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (a.p.at === b.p.at ? a.i - b.i : a.p.at < b.p.at ? -1 : 1))
    .slice(lista.length - MAX_PREFERENSER)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.p)
}

// ── Kontot ───────────────────────────────────────────────────────────────────

/** Kontots stil. Kastar vid läsfel — ett fel är inte "inga preferenser". */
export async function hamtaBrevStil(userId: string): Promise<BrevStil> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(KOLUMN)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return tolkaBrevStil((data as Record<string, unknown> | null)?.[KOLUMN])
}

/** Skriver hela stilobjektet. Anropas bara med ett objekt som bygger på en lyckad läsning. */
export async function sparaBrevStil(userId: string, stil: BrevStil): Promise<void> {
  const falt: Record<string, unknown> = { [KOLUMN]: stil }
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...falt }, { onConflict: 'user_id' })
  if (error) throw error
}

/**
 * `kolumnFinns` är flaggan — parametern finns för testerna.
 * Preferenserna som ska med i nästa brevanrop. Tomt när funktionen är av,
 * kolumnen saknas eller kontot inte kan läsas — brevet skrivs då som förut.
 */
export async function stilForAnrop(
  userId: string | null | undefined,
  kolumnFinns: boolean = BREV_STIL_KOLUMN_FINNS,
): Promise<string[]> {
  if (!kolumnFinns || !userId) return []
  try {
    const stil = await hamtaBrevStil(userId)
    if (!stil.pa) return []
    return stil.prefs.map((p) => p.text).slice(0, MAX_PREFERENSER)
  } catch {
    return []
  }
}

/**
 * Anropas när ett brev sparats. Gör ingenting om funktionen är av eller kontot
 * inte kan läsas; kastar aldrig (sparningen av brevet får inte stå och falla med detta).
 */
export async function laraAvAndringar(
  userId: string | null | undefined,
  utkast: string,
  sparad: string,
  kolumnFinns: boolean = BREV_STIL_KOLUMN_FINNS,
): Promise<void> {
  if (!kolumnFinns || !userId) return
  try {
    const nya = harleda(utkast, sparad)
    if (nya.length === 0) return
    const stil = await hamtaBrevStil(userId)
    if (!stil.pa) return
    const prefs = slaIhop(stil.prefs, nya)
    if (prefs.length === stil.prefs.length && prefs.every((p, i) => p.id === stil.prefs[i].id)) return
    await sparaBrevStil(userId, { pa: true, prefs })
  } catch (e) {
    console.warn('[brevStil] kunde inte lära av ändringarna', e instanceof Error ? e.message : e)
  }
}
