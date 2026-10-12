/**
 * HealthTab — en aktivitet eller reflektion som inte sparades ska säga det.
 * wellnessDataApi.save kastar numera vid skrivfel; sidan sväljde det förut.
 * Mutation: ta bort setValmaendeSparfel(true) i catch -> båda faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const m = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
}))

vi.mock('@/services/cloudStorage', () => ({
  moodApi: {
    getTodaysMood: () => Promise.resolve({ mood: 'good', note: '' }),
    getStreak: () => Promise.resolve(1),
    logMood: () => Promise.resolve(true),
  },
  wellnessDataApi: { get: () => m.get(), save: (d: unknown) => m.save(d) },
}))

import HealthTab from './HealthTab'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  m.get.mockReset().mockResolvedValue({ activities: {}, reflections: ['Gammal'] })
  m.save.mockReset().mockRejectedValue(new Error('boom'))
})

describe('HealthTab sparfel', () => {
  it('en reflektion som inte sparades säger det och texten står kvar', async () => {
    render(<HealthTab />)
    await screen.findByText('Gammal')
    const falt = document.getElementById('wellness-reflection') as HTMLTextAreaElement
    fireEvent.change(falt, { target: { value: 'Ny tanke' } })
    fireEvent.click(screen.getByRole('button', { name: /spara/i, hidden: false }) as HTMLElement)
    expect(await screen.findByText(/kunde inte sparas just nu/i)).toBeInTheDocument()
    expect(falt.value).toBe('Ny tanke')
    expect(screen.queryByText('Ny tanke', { selector: 'div' })).toBeNull()
  })

  it('en bockad aktivitet som inte sparades rullas tillbaka och säger det', async () => {
    render(<HealthTab />)
    await screen.findByText('Gammal')
    const promenad = screen.getAllByRole('button').find((b) => /promenad/i.test(b.textContent ?? ''))!
    const fore = promenad.outerHTML
    fireEvent.click(promenad)
    expect(await screen.findByText(/kunde inte sparas just nu/i)).toBeInTheDocument()
    const efter = screen.getAllByRole('button').find((b) => /promenad/i.test(b.textContent ?? ''))!
    expect(efter.outerHTML).toBe(fore)
  })
})
