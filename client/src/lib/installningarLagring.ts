/**
 * ST3: inställningarna i localStorage ligger under TVÅ nycklar.
 *
 * Tidigare blandade `deltagarportal-settings` innehåll (aviseringar,
 * energinivå, onboarding) med tillgänglighetsval som ska överleva utloggning
 * på en delad dator. Nyckeln kunde därför inte stå i
 * `USER_SCOPED_STORAGE_KEYS`, och innehållsdelen nollställdes bara om
 * settingsStore-modulen hunnit laddas innan utloggningen.
 *
 * - `INSTALLNINGAR_TILLGANGLIGHET`: språk, kontrast, textstorlek, lugnt läge,
 *   fokusläge, grafikstil m.m. Överlever utloggning.
 * - `INSTALLNINGAR_INNEHALL`: aviseringar, energinivå, onboarding, synkstämpel.
 *   Står i `USER_SCOPED_STORAGE_KEYS` och rensas alltid vid utloggning, även
 *   om storen aldrig laddats.
 *
 * `installningarStorage` är en zustand-`StateStorage` som delar upp ett
 * persist-värde över de två nycklarna, så storen i övrigt är oförändrad.
 */
import type { StateStorage } from 'zustand/middleware'

export const INSTALLNINGAR_TILLGANGLIGHET = 'deltagarportal-tillganglighet'
export const INSTALLNINGAR_INNEHALL = 'deltagarportal-innehall'
/** Den gamla blandade nyckeln. Läses bara av migreringen och tas sedan bort. */
export const INSTALLNINGAR_GAMMAL_NYCKEL = 'deltagarportal-settings'

/** Fält som hör till innehållsnyckeln. Allt annat är tillgänglighet/enhetsval. */
export const INNEHALLSFALT: readonly string[] = [
  'emailNotifications',
  'pushNotifications',
  'weeklySummary',
  'energyLevel',
  'hasCompletedOnboarding',
  'lastSynced',
]

interface Paket {
  state?: Record<string, unknown>
  version?: number
}

function lasPaket(key: string): Paket | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const p = JSON.parse(raw) as Paket
    return p && typeof p === 'object' ? p : null
  } catch {
    return null
  }
}

function delaUpp(state: Record<string, unknown>) {
  const tillganglighet: Record<string, unknown> = {}
  const innehall: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(state)) {
    if (INNEHALLSFALT.includes(k)) innehall[k] = v
    else tillganglighet[k] = v
  }
  return { tillganglighet, innehall }
}

/**
 * Engångsmigrering: delar den gamla blandade nyckeln i de två nya och tar
 * bort den. Idempotent — utan gammal nyckel görs ingenting, och redan
 * skrivna nya nycklar skrivs inte över (de är nyare än den gamla blobben).
 * Ingen användardata kastas: kan den gamla inte tolkas lämnas den orörd.
 */
export function migreraInstallningar(): void {
  try {
    const raw = localStorage.getItem(INSTALLNINGAR_GAMMAL_NYCKEL)
    if (raw === null) return
    const gammal = lasPaket(INSTALLNINGAR_GAMMAL_NYCKEL)
    if (!gammal || !gammal.state || typeof gammal.state !== 'object') return
    const version = gammal.version ?? 0
    const { tillganglighet, innehall } = delaUpp(gammal.state)
    if (localStorage.getItem(INSTALLNINGAR_TILLGANGLIGHET) === null) {
      localStorage.setItem(INSTALLNINGAR_TILLGANGLIGHET, JSON.stringify({ state: tillganglighet, version }))
    }
    if (localStorage.getItem(INSTALLNINGAR_INNEHALL) === null) {
      localStorage.setItem(INSTALLNINGAR_INNEHALL, JSON.stringify({ state: innehall, version }))
    }
    localStorage.removeItem(INSTALLNINGAR_GAMMAL_NYCKEL)
  } catch {
    // Lagring otillgänglig — inget att migrera.
  }
}

export const installningarStorage: StateStorage = {
  getItem: () => {
    const t = lasPaket(INSTALLNINGAR_TILLGANGLIGHET)
    const i = lasPaket(INSTALLNINGAR_INNEHALL)
    if (!t && !i) return null
    return JSON.stringify({
      state: { ...(t?.state ?? {}), ...(i?.state ?? {}) },
      version: t?.version ?? i?.version ?? 0,
    })
  },
  setItem: (_name, value) => {
    const p = JSON.parse(value) as Paket
    const { tillganglighet, innehall } = delaUpp(p.state ?? {})
    const version = p.version ?? 0
    localStorage.setItem(INSTALLNINGAR_TILLGANGLIGHET, JSON.stringify({ state: tillganglighet, version }))
    localStorage.setItem(INSTALLNINGAR_INNEHALL, JSON.stringify({ state: innehall, version }))
  },
  removeItem: () => {
    localStorage.removeItem(INSTALLNINGAR_TILLGANGLIGHET)
    localStorage.removeItem(INSTALLNINGAR_INNEHALL)
  },
}
