/**
 * 2026-09-22 — samma felklass i dagbokens två andra flikar:
 *  · Läsfel såg ut som "inga mål"/"ingen tacksamhet i dag" (Tacksamhet: ett
 *    tomt formulär, och "Spara" lade en andra rad för samma dag).
 *  · En nekad sparning tömde målformuläret resp. visade "Sparat!".
 * Mutationer (kontrollerade): ta bort `if (isError)` i GoalsTab resp.
 * GratitudeTab → test 1 resp. 3 faller; ta bort `if (!nytt) return false`
 * resp. `if (!rad) {…}` → test 2 resp. 4 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const lage = { isError: false }
const createGoal = vi.fn()
const createGratitude = vi.fn()
const retry = vi.fn()

vi.mock('@/hooks/useDiary', () => ({
  useWeeklyGoals: () => ({
    goals: [], isLoading: false, isError: lage.isError, retry,
    createGoal, toggleComplete: vi.fn(), addReflection: vi.fn(), deleteGoal: vi.fn(),
    completedCount: 0, totalCount: 0,
  }),
  useGratitude: () => ({
    entries: [], todayEntry: null, isLoading: false, isError: lage.isError, retry,
    createEntry: createGratitude, hasLoggedToday: false,
  }),
}))

import { GoalsTab } from './GoalsTab'
import { GratitudeTab } from './GratitudeTab'

beforeEach(() => {
  lage.isError = false
  createGoal.mockReset()
  createGratitude.mockReset()
})

describe('GoalsTab', () => {
  it('läsfel visar ett fel, inte "inga mål"', () => {
    lage.isError = true
    render(<GoalsTab />)
    expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte hämta din dagbok/i)
  })

  it('nekad sparning: formuläret och texten ligger kvar med ett fel', async () => {
    createGoal.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<GoalsTab />)
    await user.click(screen.getAllByRole('button', { name: /lägg till|nytt mål/i })[0])
    const falt = screen.getByLabelText(/.+/, { selector: '#goalstab-f1' })
    await user.type(falt, 'Ring två företag')
    await user.click(screen.getByRole('button', { name: /^lägg till( mål)?$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/gick inte att spara/i)
    expect(screen.getByLabelText(/.+/, { selector: '#goalstab-f1' })).toHaveValue('Ring två företag')
  })
})

describe('GratitudeTab', () => {
  it('läsfel visar ett fel, inte ett tomt formulär', () => {
    lage.isError = true
    render(<GratitudeTab />)
    expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte hämta din dagbok/i)
  })

  it('nekad sparning säger det — visar inte "Sparat"', async () => {
    createGratitude.mockResolvedValue(null)
    render(<GratitudeTab />)
    const forsta = screen.getAllByRole('textbox')[0]
    fireEvent.change(forsta, { target: { value: 'Kaffe i solen' } })
    const spara = screen.getAllByRole('button').find(b => /spara/i.test(b.textContent ?? ''))!
    await act(async () => { fireEvent.click(spara) })
    expect(screen.getByRole('alert')).toHaveTextContent(/gick inte att spara/i)
  })
})
