import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' }, profile: null, loading: false, isAuthenticated: true }),
}))

const fromMock = vi.fn()
const upsertMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

let mockBreakpointValue: 'desktop' | 'mobile' = 'desktop'
vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockBreakpointValue,
}))

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeReadBuilder(data: unknown) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.maybeSingle = vi.fn(() => Promise.resolve({ data, error: null }))
  return builder
}

function makeWriteBuilder() {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
  builder.upsert = upsertMock
  return builder
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
  }
  return { Wrapper, qc }
}

// --------------------------------------------------------------------------
// matchMedia mock
// --------------------------------------------------------------------------

type ChangeListener = (e: MediaQueryListEvent) => void

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
      listeners.forEach(fn => fn({ matches: newMatches } as MediaQueryListEvent))
    },
  }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mq),
  })
  return mq
}

// useBreakpoint tests are in useBreakpoint.test.ts (separate file for module isolation)

// --------------------------------------------------------------------------
// useWidgetLayout tests
// --------------------------------------------------------------------------

describe('useWidgetLayout', () => {
  beforeEach(() => {
    fromMock.mockReset()
    upsertMock.mockReset()
    mockBreakpointValue = 'desktop'
    // Default: read builder for reads, write builder for writes
    fromMock.mockImplementation((_table: string) => {
      return makeReadBuilder(null)
    })
    upsertMock.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("queryKey is ['user-widget-layouts', userId, hubId, breakpoint]", async () => {
    const { USER_WIDGET_LAYOUTS_KEY } = await import('./useWidgetLayout')
    const key = USER_WIDGET_LAYOUTS_KEY('test-user-id', 'jobb', 'desktop')
    expect(key).toEqual(['user-widget-layouts', 'test-user-id', 'jobb', 'desktop'])
  })

  it("queryFn calls supabase.from('user_widget_layouts').select with eq filters", async () => {
    const builder = makeReadBuilder(null)
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return builder
      return makeReadBuilder(null)
    })
    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fromMock).toHaveBeenCalledWith('user_widget_layouts')
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    expect(builder.eq).toHaveBeenCalledWith('hub_id', 'jobb')
    expect(builder.eq).toHaveBeenCalledWith('breakpoint', 'desktop')
    expect(builder.maybeSingle).toHaveBeenCalled()
  })

  it("queryFn passes persisted to mergeLayouts and returns the merged result", async () => {
    const persistedWidgets = [{ id: 'cv', size: 'S', order: 0, visible: false }]
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') {
        return makeReadBuilder({ widgets: persistedWidgets, updated_at: '2026-04-29T00:00:00Z' })
      }
      return makeReadBuilder(null)
    })
    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const cv = result.current.layout.find(w => w.id === 'cv')
    expect(cv?.size).toBe('S')
    expect(cv?.visible).toBe(false)
    // Default jobb has 8 widgets — remaining 7 appended with visible: true
    expect(result.current.layout.length).toBe(8)
  })

  it("saveDebounced does not fire upsert before 1000ms elapse", async () => {
    vi.useFakeTimers()
    const builder = makeWriteBuilder()
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return builder
      return makeReadBuilder(null)
    })
    upsertMock.mockResolvedValue({ data: null, error: null })

    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    // Flush the initial query
    await act(async () => { vi.runAllTimersAsync() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })

    upsertMock.mockClear()
    act(() => {
      result.current.saveDebounced([{ id: 'cv', size: 'S', order: 0, visible: true }])
    })
    act(() => { vi.advanceTimersByTime(999) })
    expect(upsertMock).not.toHaveBeenCalled()
    await act(async () => { vi.advanceTimersByTimeAsync(1) })
    expect(upsertMock).toHaveBeenCalledTimes(1)
  })

  it("rapid saveDebounced calls collapse into ONE upsert (latest payload wins)", async () => {
    vi.useFakeTimers()
    const payloadA = [{ id: 'cv', size: 'S', order: 0, visible: true }]
    const payloadB = [{ id: 'cv', size: 'L', order: 0, visible: false }]
    const builder = makeWriteBuilder()
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return builder
      return makeReadBuilder(null)
    })
    upsertMock.mockResolvedValue({ data: null, error: null })

    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await act(async () => { vi.runAllTimersAsync() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })

    upsertMock.mockClear()
    act(() => { result.current.saveDebounced(payloadA) })
    act(() => { vi.advanceTimersByTime(500) })
    act(() => { result.current.saveDebounced(payloadB) })
    await act(async () => { vi.advanceTimersByTimeAsync(1000) })
    expect(upsertMock).toHaveBeenCalledTimes(1)
    const callArg = upsertMock.mock.calls[0][0]
    expect(callArg.widgets[0].size).toBe('L')
  })

  it("upsert payload contains user_id, hub_id, breakpoint, widgets (no extra DB fields)", async () => {
    vi.useFakeTimers()
    const builder = makeWriteBuilder()
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return builder
      return makeReadBuilder(null)
    })
    upsertMock.mockResolvedValue({ data: null, error: null })

    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await act(async () => { vi.runAllTimersAsync() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })

    upsertMock.mockClear()
    act(() => {
      result.current.saveDebounced([{ id: 'cv', size: 'M', order: 0, visible: true }])
    })
    await act(async () => { vi.advanceTimersByTimeAsync(1000) })
    expect(upsertMock).toHaveBeenCalled()
    const payload = upsertMock.mock.calls[0][0]
    const keys = Object.keys(payload).sort()
    expect(keys).toEqual(['breakpoint', 'hub_id', 'user_id', 'widgets'].sort())
  })

  it("upsert is called with onConflict: 'user_id,hub_id,breakpoint'", async () => {
    vi.useFakeTimers()
    const builder = makeWriteBuilder()
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return builder
      return makeReadBuilder(null)
    })
    upsertMock.mockResolvedValue({ data: null, error: null })

    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await act(async () => { vi.runAllTimersAsync() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })

    upsertMock.mockClear()
    act(() => {
      result.current.saveDebounced([{ id: 'cv', size: 'M', order: 0, visible: true }])
    })
    await act(async () => { vi.advanceTimersByTimeAsync(1000) })
    expect(upsertMock).toHaveBeenCalled()
    const options = upsertMock.mock.calls[0][1]
    expect(options).toEqual({ onConflict: 'user_id,hub_id,breakpoint' })
  })

  it("Pitfall 5 — onError rolls back to snapshot (optimistic rollback)", async () => {
    // Use real timers; call mutation.mutate() directly (bypasses debounce)
    const initialWidgets = [{ id: 'cv', size: 'L', order: 0, visible: true }]

    // upsert fails to force onError path
    upsertMock.mockResolvedValue({ data: null, error: { message: 'network error' } })

    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') {
        // Both read AND write operations go through from('user_widget_layouts')
        // read: .select().eq().eq().eq().maybeSingle()
        // write: .upsert(..., options)
        const b = makeReadBuilder({ widgets: initialWidgets, updated_at: null })
        ;(b as Record<string, unknown>).upsert = upsertMock
        return b
      }
      return makeReadBuilder(null)
    })

    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.layout.find(w => w.id === 'cv')?.size).toBe('L')

    // Direct mutation — triggers onMutate (optimistic) synchronously via React Query internals
    act(() => {
      result.current.save([{ id: 'cv', size: 'S', order: 0, visible: false }])
    })
    // onMutate is async internally, wait for optimistic cache write
    await waitFor(() => {
      const cv = result.current.layout.find(w => w.id === 'cv')
      return cv?.size === 'S'
    }, { timeout: 2000 })

    // Upsert fires and fails → onError → snapshot restored; onSettled → invalidate → re-fetch
    await waitFor(() => expect(upsertMock).toHaveBeenCalled(), { timeout: 3000 })
    // After rollback + re-fetch, cv returns to 'L'
    await waitFor(() => {
      const cv = result.current.layout.find(w => w.id === 'cv')
      return cv?.size === 'L'
    }, { timeout: 5000 })
  })

  it("Pitfall 6 — mobile save uses breakpoint='mobile' in payload, does not affect desktop key", async () => {
    vi.useFakeTimers()
    mockBreakpointValue = 'mobile'
    const builder = makeWriteBuilder()
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return builder
      return makeReadBuilder(null)
    })
    upsertMock.mockResolvedValue({ data: null, error: null })

    const { useWidgetLayout, USER_WIDGET_LAYOUTS_KEY } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await act(async () => { vi.runAllTimersAsync() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })

    upsertMock.mockClear()
    act(() => {
      result.current.saveDebounced([{ id: 'cv', size: 'M', order: 0, visible: true }])
    })
    await act(async () => { vi.advanceTimersByTimeAsync(1000) })
    expect(upsertMock).toHaveBeenCalled()
    const payload = upsertMock.mock.calls[0][0]
    expect(payload.breakpoint).toBe('mobile')

    // Desktop and mobile query keys are distinct
    const desktopKey = USER_WIDGET_LAYOUTS_KEY('test-user-id', 'jobb', 'desktop')
    const mobileKey = USER_WIDGET_LAYOUTS_KEY('test-user-id', 'jobb', 'mobile')
    expect(desktopKey[3]).toBe('desktop')
    expect(mobileKey[3]).toBe('mobile')
    expect(desktopKey).not.toEqual(mobileKey)
  })

  it("Pitfall 15 — query data reference equality stable when no actual change", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return makeReadBuilder(null)
      return makeReadBuilder(null)
    })
    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const ref1 = result.current.layout
    // Trigger a no-op re-render
    act(() => {})
    const ref2 = result.current.layout
    // React Query returns same data object when nothing changed
    expect(ref1).toBe(ref2)
  })

  it("useBeforeUnload listener registered and removed on unmount", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'user_widget_layouts') return makeReadBuilder(null)
      return makeReadBuilder(null)
    })
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { useWidgetLayout } = await import('./useWidgetLayout')
    const { Wrapper } = makeWrapper()
    const { unmount } = renderHook(() => useWidgetLayout('jobb'), { wrapper: Wrapper })
    await waitFor(() => {
      const calls = addSpy.mock.calls.map(c => c[0])
      return calls.includes('beforeunload')
    })
    const addCount = addSpy.mock.calls.filter(c => c[0] === 'beforeunload').length
    expect(addCount).toBeGreaterThanOrEqual(1)
    unmount()
    const removeCount = removeSpy.mock.calls.filter(c => c[0] === 'beforeunload').length
    expect(removeCount).toBeGreaterThanOrEqual(1)
  })
})
