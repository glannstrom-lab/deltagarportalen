/**
 * HealthTab — fel i humör och välmående ska synas, inte bara loggas.
 *
 * `moodApi.getStreak()` kastar vid fel sedan 2026-09-22 (en nolla ljög om
 * att sviten var bruten). Den låg i samma Promise.all som dagens humör och
 * välmåendedatan — utan fångst fällde ett svitfel hela laddningen, och sidan
 * sa "logga ditt humör" till någon som redan gjort det.
 * Mutation: ta bort `.catch(() => null)` på getStreak i loadMood → test 1 faller.
 *
 * 2026-09-24: samma sak för `getTodaysMood`, och tre fel som bara hamnade i
 * konsolen — ett humör eller en anteckning som inte sparades såg sparad ut,
 * och ett läsfel av välmåendedatan gav tomma reflektioner som nästa bock
 * skrev över molnets. Mutationer står vid varje test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({
  getTodaysMood: vi.fn(),
  getStreak: vi.fn(),
  logMood: vi.fn(),
  get: vi.fn(),
  save: vi.fn(),
}))

vi.mock('@/services/cloudStorage', () => ({
  moodApi: {
    getTodaysMood: () => m.getTodaysMood(),
    getStreak: () => m.getStreak(),
    logMood: (...a: unknown[]) => m.logMood(...a),
  },
  wellnessDataApi: { get: () => m.get(), save: (d: unknown) => m.save(d) },
}))

import HealthTab from './HealthTab'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  m.getTodaysMood.mockReset().mockResolvedValue({ mood: 'good', note: '' })
  m.getStreak.mockReset().mockRejectedValue(new Error('timeout'))
  m.logMood.mockReset().mockResolvedValue(true)
  // Prod-formen i user_preferences.wellness_data: aktivitets-id → boolean.
  m.get.mockReset().mockResolvedValue({ activities: { '1': true }, reflections: ['Gick en promenad i solen'] })
  m.save.mockReset().mockResolvedValue(undefined)
})

describe('HealthTab', () => {
  it('visar dagens humör även när sviten inte gick att hämta', async () => {
    render(<HealthTab />)
    expect(await screen.findByText('Du har loggat ditt humör idag')).toBeInTheDocument()
  })

  it('ett fel i dagens humör fäller inte resten av sidan', async () => {
    // Mutation: ta bort `.catch(() => null)` på getTodaysMood → faller.
    m.getTodaysMood.mockRejectedValue(new Error('timeout'))
    m.getStreak.mockResolvedValue(3)
    render(<HealthTab />)
    expect(await screen.findByText('Gick en promenad i solen')).toBeInTheDocument()
    // Sviten hämtades i samma Promise.all — den ska visas ändå.
    expect(screen.getByText(/3\s*dagar/)).toBeInTheDocument()
  })

  it('ett humör som inte sparades säger det — och ser inte sparat ut', async () => {
    // Mutation: ta bort `setMoodfel(...)` i handleMoodSelect → faller.
    m.getTodaysMood.mockResolvedValue(null)
    m.logMood.mockResolvedValue(false)
    render(<HealthTab />)
    const knappar = await screen.findAllByRole('button', { name: /bra|good/i })
    fireEvent.click(knappar[0])

    expect(await screen.findByText(/ditt humör kunde inte sparas/i)).toBeInTheDocument()
    expect(screen.queryByText('Du har loggat ditt humör idag')).toBeNull()
  })

  it('en anteckning som inte sparades säger det — och fältet står kvar', async () => {
    // Mutation: låt handleSaveMoodNote stänga fältet utan att titta på svaret → faller.
    render(<HealthTab />)
    fireEvent.click(await screen.findByText(/lägg till anteckning/i))
    const falt = screen.getByRole('textbox', { name: /vill du skriva/i })
    fireEvent.change(falt, { target: { value: 'Sov dåligt' } })
    m.logMood.mockResolvedValue(false)
    fireEvent.click(screen.getByRole('button', { name: /^spara$/i }))

    expect(await screen.findByText(/anteckningen kunde inte sparas/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /vill du skriva/i })).toHaveValue('Sov dåligt')
  })

  it('ett läsfel av välmåendedatan spärrar sparandet — tomma reflektioner skrivs inte över molnets', async () => {
    // wellnessDataApi.save skriver HELA objektet. Utan känt utgångsläge vore
    // en bock en radering av alla reflektioner.
    // Mutation: `kanSparaValmaende = true` → faller.
    m.get.mockRejectedValue(new Error('timeout'))
    render(<HealthTab />)
    expect(await screen.findByText(/kunde inte hämta dina aktiviteter/i)).toBeInTheDocument()

    const promenad = screen.getAllByRole('button').find((b) => /promenad/i.test(b.textContent ?? ''))
    expect(promenad).toBeDefined()
    fireEvent.click(promenad!)
    await new Promise((r) => setTimeout(r, 20))
    expect(m.save).not.toHaveBeenCalled()
  })

  it('"Försök igen" hämtar välmåendedatan på nytt', async () => {
    m.get.mockRejectedValueOnce(new Error('timeout'))
    render(<HealthTab />)
    fireEvent.click(await screen.findByRole('button', { name: /försök igen/i }))
    await waitFor(() => expect(screen.getByText('Gick en promenad i solen')).toBeInTheDocument())
    expect(screen.queryByText(/kunde inte hämta dina aktiviteter/i)).toBeNull()
  })
})
