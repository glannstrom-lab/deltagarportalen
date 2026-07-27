/**
 * useCelebration (G5) — testar det som faktiskt kan gå fel:
 * att firandet rör sig när användaren har bett om lugn.
 *
 * Texten ska ALLTID visas; det är bara animationen som ska tystas.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const showToastSuccess = vi.fn()
vi.mock('@/components/Toast', () => ({
  showToast: {
    success: (...args: unknown[]) => showToastSuccess(...args),
    error: vi.fn(),
  },
}))

const confettiSpy = vi.fn()
vi.mock('canvas-confetti', () => ({
  default: (...args: unknown[]) => confettiSpy(...args),
}))

let calmMode = false
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector: (s: { calmMode: boolean }) => unknown) =>
    selector({ calmMode }),
}))

let isFocusMode = false
vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode, toggleFocusMode: vi.fn() }),
}))

import { useCelebration } from './useCelebration'

/** Låt de lazy-importerade confetti-anropen hinna resolva. */
const flush = () => new Promise((r) => setTimeout(r, 0))

function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }),
  })
}

describe('useCelebration', () => {
  beforeEach(() => {
    showToastSuccess.mockClear()
    confettiSpy.mockClear()
    calmMode = false
    isFocusMode = false
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('visar en varm text och animerar i normalläge', async () => {
    const { result } = renderHook(() => useCelebration())
    result.current.celebrate('applicationSent')
    await flush()

    expect(showToastSuccess).toHaveBeenCalledTimes(1)
    expect(confettiSpy).toHaveBeenCalledTimes(1)
  })

  it('tystar animationen men behåller texten vid prefers-reduced-motion', async () => {
    setReducedMotion(true)
    const { result } = renderHook(() => useCelebration())
    result.current.celebrate('applicationSent')
    await flush()

    expect(showToastSuccess).toHaveBeenCalledTimes(1)
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('tystar animationen i calm mode', async () => {
    calmMode = true
    const { result } = renderHook(() => useCelebration())
    result.current.celebrate('exerciseDone')
    await flush()

    expect(showToastSuccess).toHaveBeenCalledTimes(1)
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('tystar animationen i fokusläget', async () => {
    isFocusMode = true
    const { result } = renderHook(() => useCelebration())
    result.current.celebrate('cvComplete')
    await flush()

    expect(showToastSuccess).toHaveBeenCalledTimes(1)
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('gör ingenting för ett okänt ögonblick', async () => {
    const { result } = renderHook(() => useCelebration())
    // @ts-expect-error — avsiktligt ogiltigt värde
    result.current.celebrate('nagot-annat')
    await flush()

    expect(showToastSuccess).not.toHaveBeenCalled()
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('har text för alla tre ögonblicken', async () => {
    const { result } = renderHook(() => useCelebration())
    for (const moment of ['applicationSent', 'exerciseDone', 'cvComplete'] as const) {
      showToastSuccess.mockClear()
      result.current.celebrate(moment)
      await flush()
      const [title, message] = showToastSuccess.mock.calls[0]
      expect(String(title).length).toBeGreaterThan(0)
      expect(String(message).length).toBeGreaterThan(0)
    }
  })
})
