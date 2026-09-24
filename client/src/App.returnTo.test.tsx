/**
 * TR2 (2026-09-24): en gäst som når ett verktyg (t.ex. från en guide) ska till
 * registreringen om ingen någonsin loggat in i webbläsaren — annars till
 * inloggningen. returnTo ska följa med i båda fallen, och flaggan får inte
 * rensas vid utloggning.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

const authState = { isAuthenticated: false, isLoading: false }
vi.mock('./stores/authStore', () => ({
  useAuthStore: (sel?: (s: typeof authState) => unknown) => (sel ? sel(authState) : authState),
}))

import { RootRoute, HAR_LOGGAT_IN_KEY, harLoggatInForut, useMinnsInloggning } from './App'
import { USER_SCOPED_STORAGE_KEYS, clearUserScopedStorage } from './utils/safeStorage'

function Mal({ namn }: { namn: string }) {
  const loc = useLocation()
  return <div data-testid="mal">{namn}{loc.search}</div>
}

function renderaGast(sokvag: string) {
  return render(
    <MemoryRouter initialEntries={[sokvag]}>
      <Routes>
        <Route path="/login" element={<Mal namn="login" />} />
        <Route path="/register" element={<Mal namn="register" />} />
        <Route path="/*" element={<RootRoute />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TR2: gästens väg från ett verktyg', () => {
  beforeEach(() => {
    localStorage.removeItem(HAR_LOGGAT_IN_KEY)
    authState.isAuthenticated = false
  })

  it('ny besökare (ingen flagga) skickas till registreringen med returnTo', () => {
    renderaGast('/cv')
    expect(screen.getByTestId('mal').textContent).toBe('register?returnTo=%2Fcv')
  })

  it('den som loggat in förut skickas till inloggningen med returnTo', () => {
    localStorage.setItem(HAR_LOGGAT_IN_KEY, '1')
    renderaGast('/job-search?q=lager')
    expect(screen.getByTestId('mal').textContent).toBe('login?returnTo=%2Fjob-search%3Fq%3Dlager')
  })

  it('flaggan sätts när någon är inloggad, inte för en gäst', () => {
    const { rerender } = renderHook(() => useMinnsInloggning())
    expect(harLoggatInForut()).toBe(false)
    authState.isAuthenticated = true
    rerender()
    expect(harLoggatInForut()).toBe(true)
  })

  it('flaggan överlever utloggningens rensning', () => {
    expect(USER_SCOPED_STORAGE_KEYS).not.toContain(HAR_LOGGAT_IN_KEY)
    localStorage.setItem(HAR_LOGGAT_IN_KEY, '1')
    clearUserScopedStorage()
    expect(harLoggatInForut()).toBe(true)
  })
})
