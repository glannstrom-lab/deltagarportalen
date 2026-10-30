/**
 * AIX29: sparade checklistor från "Gör det mindre".
 *
 * Sparas BARA i den här webbläsaren (localStorage), medvetet: en egen
 * databastabell kräver en migration och ett beslut om vem som får läsa dem, och
 * listorna kan innehålla det personen skrev om sitt liv. Konsekvensen sägs i
 * gränssnittet ("syns inte på andra enheter"). Nyckeln rensas vid utloggning
 * (utils/safeStorage.ts).
 */

export const GOR_MINDRE_NYCKEL = 'gor-det-mindre'
/** Äldsta listan tas bort när fler än så här sparas. */
export const GOR_MINDRE_MAX_LISTOR = 10

export interface GorMindreLista {
  id: string
  uppgift: string
  skapad: string
  steg: Array<{ text: string; klar: boolean }>
}

function arLista(v: unknown): v is GorMindreLista {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' && typeof o.uppgift === 'string' && typeof o.skapad === 'string' &&
    Array.isArray(o.steg) &&
    o.steg.every((s) => !!s && typeof s === 'object' && typeof (s as { text?: unknown }).text === 'string' && typeof (s as { klar?: unknown }).klar === 'boolean')
  )
}

export function lasListor(): GorMindreLista[] {
  try {
    const rå = localStorage.getItem(GOR_MINDRE_NYCKEL)
    if (!rå) return []
    const data: unknown = JSON.parse(rå)
    return Array.isArray(data) ? data.filter(arLista) : []
  } catch {
    return []
  }
}

/** Returnerar false om webbläsaren inte lät oss spara (privat läge, full disk). */
function skriv(listor: GorMindreLista[]): boolean {
  try {
    localStorage.setItem(GOR_MINDRE_NYCKEL, JSON.stringify(listor.slice(0, GOR_MINDRE_MAX_LISTOR)))
    return true
  } catch {
    return false
  }
}

export function sparaLista(uppgift: string, steg: string[]): { listor: GorMindreLista[]; sparad: boolean } {
  const ny: GorMindreLista = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    uppgift: uppgift.trim().slice(0, 300),
    skapad: new Date().toISOString(),
    steg: steg.map((text) => ({ text, klar: false })),
  }
  const listor = [ny, ...lasListor()].slice(0, GOR_MINDRE_MAX_LISTOR)
  return { listor, sparad: skriv(listor) }
}

export function vaxlaSteg(id: string, index: number): GorMindreLista[] {
  const listor = lasListor().map((l) =>
    l.id === id ? { ...l, steg: l.steg.map((s, i) => (i === index ? { ...s, klar: !s.klar } : s)) } : l,
  )
  skriv(listor)
  return listor
}

export function taBortLista(id: string): GorMindreLista[] {
  const listor = lasListor().filter((l) => l.id !== id)
  skriv(listor)
  return listor
}
