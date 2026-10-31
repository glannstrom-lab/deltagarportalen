import { describe, it, expect, beforeEach } from 'vitest'
import {
  INSTALLNINGAR_GAMMAL_NYCKEL as GAMMAL,
  INSTALLNINGAR_INNEHALL as INNEHALL,
  INSTALLNINGAR_TILLGANGLIGHET as TILLG,
  installningarStorage,
  migreraInstallningar,
} from './installningarLagring'

const lasa = (k: string) => JSON.parse(localStorage.getItem(k) ?? 'null')

const GAMMAL_BLOB = {
  state: {
    calmMode: true, focusMode: true, highContrast: true, largeText: true,
    language: 'en', grafikstil: 'action', showCoachWidget: false, radgivarRost: false,
    emailNotifications: false, pushNotifications: true, weeklySummary: true,
    energyLevel: 'low', hasCompletedOnboarding: true, lastSynced: '2026-10-01T10:00:00Z',
  },
  version: 0,
}

beforeEach(() => localStorage.clear())

describe('migreraInstallningar (ST3)', () => {
  it('delar den gamla nyckeln i två, förlorar inget val och tar bort den gamla', () => {
    localStorage.setItem(GAMMAL, JSON.stringify(GAMMAL_BLOB))
    migreraInstallningar()

    expect(localStorage.getItem(GAMMAL)).toBeNull()
    expect(lasa(TILLG).state).toEqual({
      calmMode: true, focusMode: true, highContrast: true, largeText: true,
      language: 'en', grafikstil: 'action', showCoachWidget: false, radgivarRost: false,
    })
    expect(lasa(INNEHALL).state).toEqual({
      emailNotifications: false, pushNotifications: true, weeklySummary: true,
      energyLevel: 'low', hasCompletedOnboarding: true, lastSynced: '2026-10-01T10:00:00Z',
    })
    expect(lasa(TILLG).version).toBe(0)
  })

  it('är idempotent: en andra körning ändrar ingenting', () => {
    localStorage.setItem(GAMMAL, JSON.stringify(GAMMAL_BLOB))
    migreraInstallningar()
    const t = localStorage.getItem(TILLG)
    const i = localStorage.getItem(INNEHALL)
    migreraInstallningar()
    expect(localStorage.getItem(TILLG)).toBe(t)
    expect(localStorage.getItem(INNEHALL)).toBe(i)
    expect(localStorage.getItem(GAMMAL)).toBeNull()
  })

  it('skriver inte över nyare nya nycklar med en kvarglömd gammal blob', () => {
    localStorage.setItem(TILLG, JSON.stringify({ state: { language: 'sv' }, version: 0 }))
    localStorage.setItem(INNEHALL, JSON.stringify({ state: { energyLevel: 'high' }, version: 0 }))
    localStorage.setItem(GAMMAL, JSON.stringify(GAMMAL_BLOB))
    migreraInstallningar()
    expect(lasa(TILLG).state).toEqual({ language: 'sv' })
    expect(lasa(INNEHALL).state).toEqual({ energyLevel: 'high' })
    expect(localStorage.getItem(GAMMAL)).toBeNull()
  })

  it('gör ingenting utan gammal nyckel och lämnar en oläsbar gammal orörd', () => {
    migreraInstallningar()
    expect(localStorage.getItem(TILLG)).toBeNull()

    localStorage.setItem(GAMMAL, '{trasig')
    migreraInstallningar()
    expect(localStorage.getItem(GAMMAL)).toBe('{trasig')
    expect(localStorage.getItem(TILLG)).toBeNull()
  })
})

describe('installningarStorage', () => {
  it('slår ihop de två nycklarna vid läsning och delar vid skrivning', () => {
    installningarStorage.setItem('x', JSON.stringify(GAMMAL_BLOB))
    expect(lasa(TILLG).state).not.toHaveProperty('energyLevel')
    expect(lasa(INNEHALL).state).not.toHaveProperty('language')
    const tillbaka = JSON.parse(installningarStorage.getItem('x') as string)
    expect(tillbaka.state).toEqual(GAMMAL_BLOB.state)
  })

  it('getItem ger null när ingen av nycklarna finns', () => {
    expect(installningarStorage.getItem('x')).toBeNull()
  })
})
