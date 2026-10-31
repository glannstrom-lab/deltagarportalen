/**
 * Arbetsgivarregistret (FN13) — rena funktioner: normalisering, dubblettkontroll
 * och uppbyggnad av registerposter. Ingen I/O.
 *
 * Bara FIRMAUPPGIFTER. Registret bär aldrig deltagare, kontaktperson, telefon eller
 * e-post (DP1: den rättsliga grunden för kontaktpersonens uppgifter är inte vald).
 *
 * DP2: organisationsnumret för en enskild firma ÄR innehavarens personnummer.
 * Ett organisationsnummer har 3:e siffran >= 2 (aktiebolag börjar 556…); ett
 * personnummer har månad 01–12 på plats 3–4, alltså 3:e siffran 0 eller 1.
 * Allt som inte med säkerhet är ett organisationsnummer visas därför aldrig för
 * kollegor (`orgnrForKollega` ger null). Samma regel finns i SQL-funktionen
 * `arbetsgivarregister` (supabase/migrations/20261031_fn13_arbetsgivarregister.sql)
 * — ändra dem tillsammans.
 */

/** Siffror ur ett organisations-/personnummer; 12 siffror (16/19/20…) kortas till 10. Annars null. */
export function normaliseraOrgnr(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && (d.startsWith('16') || d.startsWith('19') || d.startsWith('20'))) d = d.slice(2)
  return d.length === 10 ? d : null
}

/** Ser siffrorna ut som ett personnummer (månad 01–12 på plats 3–4)? */
export function liknarPersonnummer(tiosiffrigt: string): boolean {
  const manad = Number(tiosiffrigt.slice(2, 4))
  return manad >= 1 && manad <= 12
}

const ENSKILD_FIRMA_ORD = /\b(enskild\s+firma|firma)\b/i

/** Enskild firma = personnummerliknande nummer, eller namnet säger det rakt ut. Saknat/oläsligt nummer räknas INTE hit. */
export function arEnskildFirma(orgnr: string | null | undefined, namn?: string | null): boolean {
  const n = normaliseraOrgnr(orgnr)
  if (n && liknarPersonnummer(n)) return true
  return !!namn && ENSKILD_FIRMA_ORD.test(namn)
}

/**
 * Organisationsnumret som får visas för en kollega, formaterat 556677-8899 —
 * eller null. Null för enskild firma OCH för allt som inte går att läsa som ett
 * giltigt organisationsnummer (hellre inget än ett personnummer).
 */
export function orgnrForKollega(orgnr: string | null | undefined, namn?: string | null): string | null {
  const n = normaliseraOrgnr(orgnr)
  if (!n) return null
  if (arEnskildFirma(n, namn)) return null
  if (Number(n[2]) < 2) return null
  return `${n.slice(0, 6)}-${n.slice(6)}`
}

const BOLAGSSUFFIX = /\s+(aktiebolag|ab|hb|kb|handelsbolag|kommanditbolag|ekonomisk\s+förening)$/i

/** Nyckel för namnjämförelse: gemener, utan bolagsform, skiljetecken och mellanrum. */
export function normaliseraForetagsnamn(namn: string | null | undefined): string {
  if (!namn) return ''
  let s = namn.toLowerCase().normalize('NFC').trim()
  s = s.replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim()
  // Både "Lidl AB" och "AB Lidl".
  s = s.replace(BOLAGSSUFFIX, '').replace(/^(aktiebolaget|aktiebolag|ab)\s+/i, '')
  return s.replace(/[^\p{L}\p{N}]/gu, '')
}

/** Det minsta registret behöver av en plats. */
export interface PlatsUnderlag {
  consultant_id: string | null
  company_name: string
  org_number: string | null
  updated_at: string
}

export interface ArbetsgivarPost {
  /** Dubblettnyckel: org.nr om det finns, annars normaliserat namn. */
  nyckel: string
  namn: string
  /** Bara organisationsnummer som får visas för kollegor (DP2) — annars null. */
  orgnr: string | null
  antalPlatser: number
  /** ISO-tid; platsens senaste ändring (det finns inget eget kontaktdatum). */
  senastAndrad: string
  /** Konsulenten som senast rörde företaget. */
  agareId: string | null
}

/**
 * Nyckeln bär org.nr bara när numret får visas för kollegor (DP2). Ett personnummer
 * får aldrig hamna i en nyckel, eftersom nyckeln följer med i registerobjektet.
 */
export function dubblettNyckel(namn: string, orgnr: string | null | undefined): string {
  const synligt = orgnrForKollega(orgnr, namn)
  return synligt ? `org:${normaliseraOrgnr(synligt)}` : `namn:${normaliseraForetagsnamn(namn)}`
}

/** Grupperar platser till ett register. Nyckel på org.nr; platser utan org.nr slås ihop på namn och med en post som har samma namn. */
export function byggRegister(platser: readonly PlatsUnderlag[]): ArbetsgivarPost[] {
  const poster = new Map<string, ArbetsgivarPost>()
  const namnTillNyckel = new Map<string, string>()
  const sorterade = [...platser].sort((a, b) => a.updated_at.localeCompare(b.updated_at))
  // Först poster med org.nr, så att namn-only-platser kan haka på dem.
  for (const p of sorterade) {
    if (orgnrForKollega(p.org_number, p.company_name)) {
      namnTillNyckel.set(normaliseraForetagsnamn(p.company_name), dubblettNyckel(p.company_name, p.org_number))
    }
  }
  for (const p of sorterade) {
    const namnKey = normaliseraForetagsnamn(p.company_name)
    if (!namnKey) continue
    const nyckel = orgnrForKollega(p.org_number, p.company_name)
      ? dubblettNyckel(p.company_name, p.org_number)
      : namnTillNyckel.get(namnKey) ?? `namn:${namnKey}`
    const finns = poster.get(nyckel)
    const nr = orgnrForKollega(p.org_number, p.company_name)
    if (!finns) {
      poster.set(nyckel, {
        nyckel,
        namn: p.company_name.trim(),
        orgnr: nr,
        antalPlatser: 1,
        senastAndrad: p.updated_at,
        agareId: p.consultant_id,
      })
    } else {
      finns.antalPlatser += 1
      finns.orgnr = finns.orgnr ?? nr
      // Sorterat stigande: senaste raden vinner namn, datum och ägare.
      finns.namn = p.company_name.trim()
      finns.senastAndrad = p.updated_at
      finns.agareId = p.consultant_id ?? finns.agareId
    }
  }
  return [...poster.values()].sort((a, b) => b.senastAndrad.localeCompare(a.senastAndrad))
}

/** Poster i registret som kandidaten (namn och/eller org.nr) krockar med. Tom lista = ingen dubblett. */
export function hittaDubbletter(
  register: readonly ArbetsgivarPost[],
  kandidat: { namn: string; orgnr?: string | null },
): ArbetsgivarPost[] {
  const namnKey = normaliseraForetagsnamn(kandidat.namn)
  // Samma regel som för registret: ett personnummer används aldrig som nyckel.
  const synligt = orgnrForKollega(kandidat.orgnr, kandidat.namn)
  const orgKey = synligt ? normaliseraOrgnr(synligt) : null
  if (!namnKey && !orgKey) return []
  return register.filter((r) => {
    if (orgKey && r.nyckel === `org:${orgKey}`) return true
    return !!namnKey && normaliseraForetagsnamn(r.namn) === namnKey
  })
}
