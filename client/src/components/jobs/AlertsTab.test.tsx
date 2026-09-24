/**
 * AlertsTab — `getUnreadCount()` kastar vid fel sedan 2026-09-22 (en nolla
 * sa "allt läst" när uppslaget föll). Fliken ska då bara inte visa någon
 * räknare — och avvisningen får inte bli ohanterad.
 *
 * Mutation: ta bort `.catch(() => {})` → testet faller (ohanterad avvisning).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Inte vi.fn(): vitest fäster en .then på mockens löften (settledResults),
// vilket gör avvisningen "hanterad" och testet blint.
let anrop = 0
let hamtaInstallningar: () => Promise<unknown> = () => new Promise(() => {})
const sparaInstallningar = vi.fn(async (_p: unknown) => true)
vi.mock('@/services/jobAlertEmailService', () => ({
  getUnreadCount: () => {
    anrop++
    return Promise.reject(new Error('timeout'))
  },
  getNotificationPreferences: () => hamtaInstallningar(),
  updateNotificationPreferences: (p: unknown) => sparaInstallningar(p),
}))
vi.mock('@/hooks/useJobAlerts', () => ({
  useJobAlerts: () => ({
    alerts: [], isLoading: false,
    createAlert: vi.fn(), deleteAlert: vi.fn(), toggleAlert: vi.fn(), checkForNewJobs: vi.fn(),
  }),
}))

import { AlertsTab } from './AlertsTab'

describe('AlertsTab', () => {
  it('ett fel i olästräknaren ger ingen ohanterad avvisning', async () => {
    const avvisningar: unknown[] = []
    const lyssnare = (e: unknown) => avvisningar.push(e)
    process.on('unhandledRejection', lyssnare)
    try {
      render(<MemoryRouter><AlertsTab /></MemoryRouter>)
      await screen.findAllByRole('button')
      await new Promise((r) => setTimeout(r, 30))
      expect(anrop).toBe(1)
      expect(avvisningar).toHaveLength(0)
    } finally {
      process.off('unhandledRejection', lyssnare)
    }
  })

  it('ett läsfel av e-postvalet visar ett fel — inte "på, dagligen" att spara över', async () => {
    // Före 2026-09-24 gav läsfelet standardvärdena. Den som stängt av mejlen
    // såg rutan ikryssad, och "Spara" slog på utskicken igen.
    // Mutation: låt felgrenen sätta standardvärdena och släppa formuläret
    // (ta bort `setLaddningsfel(true)`) → testet faller.
    let forsok = 0
    hamtaInstallningar = () => {
      forsok++
      return forsok === 1
        ? Promise.reject(new Error('timeout'))
        : Promise.resolve({ emailEnabled: false, frequency: 'weekly' })
    }
    render(<MemoryRouter><AlertsTab /></MemoryRouter>)
    fireEvent.click(await screen.findByTitle(/e-post/i))

    expect(await screen.findByText(/kunde inte hämta dina e-postinställningar/i)).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /spara/i })).toBeNull()
    expect(sparaInstallningar).not.toHaveBeenCalled()

    // "Försök igen" hämtar på nytt och visar det användaren faktiskt valt.
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))
    const ruta = await screen.findByRole('checkbox')
    expect(ruta).not.toBeChecked()
  })
})
