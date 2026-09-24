/**
 * TR1 (2026-09-24): kakbannern låg över "Skapa ett konto" på /login. Bannern
 * publicerar nu sin höjd i `--cookie-banner-h`, och Login/Register reserverar
 * den som bottenpadding. Utan bottennav (publika sidor) är det enda som gör
 * länken nåbar.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CookieConsent, COOKIE_BANNER_HEIGHT_VAR, PUBLIC_PAGE_BOTTOM_PADDING } from './CookieConsent'

vi.mock('../stores/authStore', () => {
  const state = { signIn: vi.fn(), signInWithGoogle: vi.fn(), signUp: vi.fn(), isAuthenticated: false, isLoading: false, error: null }
  return { useAuthStore: (sel?: (s: typeof state) => unknown) => (sel ? sel(state) : state) }
})

const rootVar = () => document.documentElement.style.getPropertyValue(COOKIE_BANNER_HEIGHT_VAR)

describe('TR1: kakbannerns höjd reserveras på publika sidor', () => {
  let aterstall: () => void
  beforeEach(() => {
    localStorage.removeItem('jobin_cookie_consent')
    vi.useFakeTimers()
    const orig = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function () {
      const r = orig.call(this)
      return this.hasAttribute('data-cookie-banner') ? { ...r, height: 243 } : r
    }
    aterstall = () => { HTMLElement.prototype.getBoundingClientRect = orig }
  })
  afterEach(() => {
    aterstall()
    vi.useRealTimers()
    document.documentElement.style.removeProperty(COOKIE_BANNER_HEIGHT_VAR)
  })

  it('sätter variabeln till bannerns mätta höjd medan den syns och tar bort den när den stängs', () => {
    const { unmount } = render(<MemoryRouter><CookieConsent /></MemoryRouter>)
    expect(rootVar()).toBe('')
    act(() => { vi.advanceTimersByTime(600) })
    expect(rootVar()).toBe('243px')
    unmount()
    expect(rootVar()).toBe('')
  })

  it('sätter ingen variabel när samtycket redan är givet', () => {
    localStorage.setItem('jobin_cookie_consent', 'true')
    render(<MemoryRouter><CookieConsent /></MemoryRouter>)
    act(() => { vi.advanceTimersByTime(600) })
    expect(rootVar()).toBe('')
  })

  it('paddingen läser variabeln (0 som reserv)', () => {
    expect(PUBLIC_PAGE_BOTTOM_PADDING).toBe('calc(1rem + var(--cookie-banner-h, 0px))')
  })

  it.each([
    ['Login', () => import('../pages/Login')],
    ['Register', () => import('../pages/Register')],
  ])('%s reserverar bannerns höjd i sin yttersta behållare', async (_namn, ladda) => {
    vi.useRealTimers()
    const { default: Sida } = await ladda()
    const { container } = render(<MemoryRouter><Sida /></MemoryRouter>)
    const ytter = container.firstElementChild as HTMLElement
    expect(ytter.style.paddingBottom).toBe(PUBLIC_PAGE_BOTTOM_PADDING)
  })
})
