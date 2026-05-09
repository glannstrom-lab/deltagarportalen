/**
 * Tests för useCVAutoSave — verifierar de kritiska invarianterna efter
 * 2026-04-28-fixen: 800ms debounce, visibilitychange-flush, localStorage-fallback.
 *
 * Mockar React Query, Supabase API och Zustand-stores så vi kan köra hooken isolerat.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCVAutoSave } from './useCVAutoSave'

// Mocka cvApi.updateCV (server-anropet). Hooken importerar från
// '@/services/cvApi' och '@/services/userApi' direkt sedan supabaseApi-
// splitten 2026-05-09 — mocka samma paths.
const mockUpdateCV = vi.fn().mockResolvedValue({ id: 'cv-1' })
vi.mock('@/services/cvApi', () => ({
  cvApi: {
    updateCV: (...args: unknown[]) => mockUpdateCV(...args),
  },
}))
vi.mock('@/services/userApi', () => ({
  userApi: {
    updateOnboardingStep: vi.fn().mockResolvedValue(undefined),
  },
}))
// supabaseApi behåller types-exporten — type-only mock räcker.
vi.mock('@/services/supabaseApi', () => ({}))

// Mocka useCVStore — return stub-funktioner
vi.mock('@/stores/cvStore', () => ({
  useCVStore: () => ({
    markSaving: vi.fn(),
    markSaved: vi.fn(),
    markError: vi.fn(),
    markUnsaved: vi.fn(),
    setPendingCount: vi.fn(),
    lastSavedAt: null,
    saveStatus: 'idle' as const,
    hasUnsavedChanges: false,
    pendingCount: 0,
  }),
}))

// Mocka achievement tracker
vi.mock('./useAchievementTracker', () => ({
  useAchievementTracker: () => ({
    trackCVUpdate: vi.fn(),
  }),
}))

// React Query wrapper
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const sampleCV = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
}

describe('useCVAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockUpdateCV.mockClear()
    // Reset storage spies. Drafts skrivs nu till sessionStorage (GDPR-fix
    // 2026-05-09) — localStorage används bara för icke-PII-flaggor.
    ;(window.localStorage.setItem as ReturnType<typeof vi.fn>).mockClear()
    ;(window.sessionStorage.setItem as ReturnType<typeof vi.fn>).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('skippar första render (initial load triggar inget save)', () => {
    const { result } = renderHook(() => useCVAutoSave(sampleCV), {
      wrapper: makeWrapper(),
    })

    act(() => {
      result.current.triggerSave(sampleCV)
    })

    // Advancera långt förbi debounce — inget server-anrop ska ha skett på första rendern
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockUpdateCV).not.toHaveBeenCalled()
  })

  it('sparar draft till sessionStorage omedelbart vid triggerSave (INTE localStorage — GDPR)', () => {
    const { result } = renderHook(() => useCVAutoSave(sampleCV), {
      wrapper: makeWrapper(),
    })

    // Andra anropet — första hoppas över
    act(() => {
      result.current.triggerSave(sampleCV)
      result.current.triggerSave({ ...sampleCV, firstName: 'Anna' })
    })

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'cv-draft',
      expect.stringContaining('"firstName":"Anna"')
    )
    // Säkerställ att vi INTE skriver CV-PII till localStorage (cross-user-läcka).
    const localCalls = (window.localStorage.setItem as ReturnType<typeof vi.fn>).mock?.calls || []
    const cvDraftToLocal = localCalls.find((c: unknown[]) => c[0] === 'cv-draft')
    expect(cvDraftToLocal).toBeUndefined()
  })

  it('skickar till server efter 800ms debounce (inte tidigare)', async () => {
    const { result } = renderHook(() => useCVAutoSave(sampleCV), {
      wrapper: makeWrapper(),
    })

    act(() => {
      result.current.triggerSave(sampleCV) // första, hoppas över
      result.current.triggerSave({ ...sampleCV, firstName: 'Anna' })
    })

    // Inom debounce-fönstret — inget server-call än
    await act(async () => {
      await vi.advanceTimersByTimeAsync(799)
    })
    expect(mockUpdateCV).not.toHaveBeenCalled()

    // Precis efter debounce — server-call sker
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2)
    })
    expect(mockUpdateCV).toHaveBeenCalledTimes(1)
    expect(mockUpdateCV.mock.calls[0][0]).toMatchObject({ firstName: 'Anna' })
  })

  it('flushar pending data till server omedelbart vid visibilitychange→hidden', async () => {
    const { result } = renderHook(() => useCVAutoSave(sampleCV), {
      wrapper: makeWrapper(),
    })

    act(() => {
      result.current.triggerSave(sampleCV) // första, hoppas över
      result.current.triggerSave({ ...sampleCV, firstName: 'Bob' })
    })

    // Användaren byter flik EFTER 200ms (väl före debounce-timeouten på 800ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
      // Ge React Query's mutate en microtask att kalla mutationFn
      await Promise.resolve()
    })

    // Server-call ska ha skett UTAN att vänta på resterande 600ms av debouncen
    expect(mockUpdateCV).toHaveBeenCalledTimes(1)
    expect(mockUpdateCV.mock.calls[0][0]).toMatchObject({ firstName: 'Bob' })

    // Och om vi sedan advancerar timern fullt — debouncen ska INTE trigga ett andra anrop
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(mockUpdateCV).toHaveBeenCalledTimes(1)
  })

  it('skickar inte till server vid visibilitychange om offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => false,
    })

    const { result } = renderHook(() => useCVAutoSave(sampleCV), {
      wrapper: makeWrapper(),
    })

    act(() => {
      result.current.triggerSave(sampleCV)
      result.current.triggerSave({ ...sampleCV, firstName: 'Cecilia' })
    })

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Offline — inget server-call ska ske, men sessionStorage ska ha draften
    expect(mockUpdateCV).not.toHaveBeenCalled()
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'cv-draft',
      expect.stringContaining('"firstName":"Cecilia"')
    )

    // Restore online state för nästa test
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true,
    })
  })
})
