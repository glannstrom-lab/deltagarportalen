/**
 * Tests for useBreakpoint hook.
 * Each test uses vi.resetModules() + dynamic import to get a fresh module instance
 * so the useState initializer re-reads window.matchMedia on each test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

type ChangeListener = (e: { matches: boolean }) => void

function mockMatchMedia(matches: boolean) {
  const listeners: ChangeListener[] = []
  const mq = {
    matches,
    media: '(min-width: 900px)',
    addEventListener: vi.fn((_: string, handler: ChangeListener) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_: string, handler: ChangeListener) => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    dispatchEvent: vi.fn(),
    _fire: (newMatches: boolean) => {
      listeners.forEach(fn => fn({ matches: newMatches }))
    },
  }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mq),
  })
  return mq
}

describe('useBreakpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it("returns 'desktop' when matchMedia(min-width: 900px) matches", async () => {
    mockMatchMedia(true)
    vi.resetModules()
    const { useBreakpoint } = await import('./useBreakpoint')
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('desktop')
  })

  it("returns 'mobile' when matchMedia does not match", async () => {
    mockMatchMedia(false)
    vi.resetModules()
    const { useBreakpoint } = await import('./useBreakpoint')
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('mobile')
  })

  it("updates when matchMedia change event fires", async () => {
    const mq = mockMatchMedia(false)
    vi.resetModules()
    const { useBreakpoint } = await import('./useBreakpoint')
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('mobile')
    act(() => {
      mq._fire(true)
    })
    expect(result.current).toBe('desktop')
  })
})
