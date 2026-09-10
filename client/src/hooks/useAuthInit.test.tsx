/**
 * `useAuthInit` — hooken som synkar inställningar från molnet vid inloggning.
 *
 * Den hade ingen anropare från 2026-03-01 (`7faaf35f`) till 2026-09-10: App
 * initierade auth själv och hoppade över synken. Följden var att varje
 * inställning i `user_preferences` sparades men aldrig lästes tillbaka —
 * en ny enhet fick alltid default — och att `last_login_at` aldrig skrevs.
 * Upptäckt när grafikstilen låg som 'action' i databasen men kom tillbaka
 * som 'mjuk' vid ny inloggning.
 *
 * Två vakter: (1) hooken gör det den ska när användaren är inloggad, och
 * (2) App monterar den. Den andra är en textvakt, för det var precis
 * monteringen som försvann — en enhetstest på hooken hade varit grön hela
 * tiden.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// vi.mock hissas till filens topp — allt fabrikerna rör måste komma ur vi.hoisted.
const h = vi.hoisted(() => {
  const initialize = vi.fn()
  const syncSettings = vi.fn()
  const syncEnergy = vi.fn()
  const updateLastLogin = vi.fn()
  const auth = { initialize, isLoading: false, isAuthenticated: false, user: null as null | { id: string } }
  return { initialize, syncSettings, syncEnergy, updateLastLogin, auth }
})

vi.mock('@/stores/authStore', () => ({ useAuthStore: () => h.auth }))
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (sel: (s: { syncWithServer: () => void }) => unknown) => sel({ syncWithServer: h.syncSettings }),
}))
vi.mock('@/stores/energyStoreWithSync', () => ({
  useEnergyStore: (sel: (s: { syncWithServer: () => void }) => unknown) => sel({ syncWithServer: h.syncEnergy }),
}))
vi.mock('@/services/cloudStorage', () => ({ userPreferencesApi: { updateLastLogin: h.updateLastLogin } }))

import { useAuthInit } from './useAuthInit'

const { initialize, syncSettings, syncEnergy, updateLastLogin } = h

beforeEach(() => {
  vi.clearAllMocks()
  h.auth.isAuthenticated = false
  h.auth.user = null
})

describe('useAuthInit', () => {
  it('initierar auth vid montering men synkar inget för en utloggad', () => {
    renderHook(() => useAuthInit())
    expect(initialize).toHaveBeenCalledTimes(1)
    expect(syncSettings).not.toHaveBeenCalled()
    expect(updateLastLogin).not.toHaveBeenCalled()
  })

  it('synkar inställningar, energi och senaste inloggning när användaren är inloggad', () => {
    h.auth.isAuthenticated = true
    h.auth.user = { id: 'u1' }
    renderHook(() => useAuthInit())
    expect(syncSettings).toHaveBeenCalledTimes(1)
    expect(syncEnergy).toHaveBeenCalledTimes(1)
    expect(updateLastLogin).toHaveBeenCalledTimes(1)
  })
})

describe('App monterar hooken', () => {
  it('App.tsx anropar useAuthInit() och initierar inte auth vid sidan av', () => {
    const src = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
    expect(src).toMatch(/useAuthInit\(\)/)
    // Det gamla mönstret — `initialize()` i en egen effekt — är det som
    // gjorde hooken död. Finns det igen är synken borta igen.
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*initialize\(\)/)
  })
})
