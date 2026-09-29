/**
 * SFT3-rest: på/av-knappen på en jobbevakning är en switch för hjälpmedel
 * (role="switch" + aria-checked), inte en ikonknapp vars läge bara syns i färg.
 * Mutation: ta bort role/aria-checked på knappen i AlertCard → testet faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const toggleAlert = vi.fn()
vi.mock('@/services/jobAlertEmailService', () => ({
  getUnreadCount: async () => 0,
  getNotificationPreferences: async () => ({ emailEnabled: false, frequency: 'weekly' }),
  updateNotificationPreferences: async () => true,
}))
vi.mock('@/hooks/useJobAlerts', () => ({
  useJobAlerts: () => ({
    alerts: [
      { id: 'a1', user_id: 'u', name: 'Lagerjobb Malmö', is_active: true, notification_frequency: 'daily', new_jobs_count: 0, created_at: '', updated_at: '' },
      { id: 'a2', user_id: 'u', name: 'Kundtjänst', is_active: false, notification_frequency: 'daily', new_jobs_count: 0, created_at: '', updated_at: '' },
    ],
    isLoading: false,
    createAlert: vi.fn(), deleteAlert: vi.fn(), toggleAlert, checkForNewJobs: vi.fn(),
  }),
}))

import { AlertsTab } from './AlertsTab'

describe('AlertsTab — bevakningarna har switchar', () => {
  it('varje bevakning har en switch med stabilt namn och aria-checked efter läget', async () => {
    render(<MemoryRouter><AlertsTab /></MemoryRouter>)
    const paa = await screen.findByRole('switch', { name: /Lagerjobb Malmö/ })
    const av = screen.getByRole('switch', { name: /Kundtjänst/ })
    expect(paa).toHaveAttribute('aria-checked', 'true')
    expect(av).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(av)
    expect(toggleAlert).toHaveBeenCalledWith('a2', true)
  })
})
