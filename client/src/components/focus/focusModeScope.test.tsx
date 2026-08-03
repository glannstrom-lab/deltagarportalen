/**
 * UX11 — fokusläget ska inte kunna stänga av sig självt.
 *
 * Buggen: `onExit` betydde två saker samtidigt. "Hoppa över", "Klar" och
 * verktygslänkarna band alla mot `toggleFocusMode`, som persisterar
 * `focusMode = false` och synkar det till kontot. 36 bindningar över 29 guider
 * — varje sätt att lämna en guide släckte tillgänglighetsfunktionen överallt.
 *
 * Kontraktet som låses här:
 *   1. `leaveWizard` lämnar guiden på EN sida. Globala läget står kvar.
 *   2. Andra sidor påverkas inte av att en sida lämnats.
 *   3. `toggleFocusMode` är det enda som ändrar den globala inställningen.
 *   4. Ett påslag nollställer lämnade guider — annars vore sidor man lämnat
 *      tidigare tysta även efter att man slagit på läget igen.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useFocusMode } from '@/components/FocusModeProvider'
import { useFocusWizardStore } from '@/stores/focusWizardStore'
import { useSettingsStore } from '@/stores/settingsStore'

function wrapper(initialPath: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  )
}

beforeEach(() => {
  useFocusWizardStore.getState().resetDismissed()
  useSettingsStore.setState({ focusMode: true })
})

describe('useFocusMode — sidscopad guide vs. global inställning', () => {
  it('visar guiden när fokusläget är på', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })

    expect(result.current.isFocusMode).toBe(true)
    expect(result.current.isFocusModeEnabled).toBe(true)
  })

  it('leaveWizard döljer guiden på sidan MEN låter fokusläget stå kvar', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })

    act(() => result.current.leaveWizard())

    expect(result.current.isFocusMode).toBe(false)
    // Det här är hela UX11: inställningen får INTE ha ändrats.
    expect(result.current.isFocusModeEnabled).toBe(true)
    expect(useSettingsStore.getState().focusMode).toBe(true)
  })

  it('påverkar bara den sida guiden lämnades på', () => {
    const cv = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })
    act(() => cv.result.current.leaveWizard())

    const jobb = renderHook(() => useFocusMode(), { wrapper: wrapper('/jobb') })

    expect(cv.result.current.isFocusMode).toBe(false)
    expect(jobb.result.current.isFocusMode).toBe(true)
  })

  it('toggleFocusMode är det enda som ändrar den globala inställningen', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })

    act(() => result.current.toggleFocusMode())

    expect(useSettingsStore.getState().focusMode).toBe(false)
    expect(result.current.isFocusModeEnabled).toBe(false)
    expect(result.current.isFocusMode).toBe(false)
  })

  it('ett påslag nollställer lämnade guider', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })

    act(() => result.current.leaveWizard())
    expect(useFocusWizardStore.getState().dismissedPaths).toContain('/cv')

    act(() => result.current.toggleFocusMode()) // av
    act(() => result.current.toggleFocusMode()) // på igen

    expect(useFocusWizardStore.getState().dismissedPaths).toEqual([])
    expect(result.current.isFocusMode).toBe(true)
  })

  it('leaveWizard är idempotent — dubbelklick lägger inte till dubbletter', () => {
    const { result } = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })

    act(() => result.current.leaveWizard())
    act(() => result.current.leaveWizard())

    expect(useFocusWizardStore.getState().dismissedPaths).toEqual(['/cv'])
  })

  it('med fokusläget AV är guiden av oavsett lämningar', () => {
    useSettingsStore.setState({ focusMode: false })
    const { result } = renderHook(() => useFocusMode(), { wrapper: wrapper('/cv') })

    expect(result.current.isFocusMode).toBe(false)
    expect(result.current.isFocusModeEnabled).toBe(false)
  })
})
