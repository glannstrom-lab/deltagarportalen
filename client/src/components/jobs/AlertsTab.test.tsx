/**
 * AlertsTab — `getUnreadCount()` kastar vid fel sedan 2026-09-22 (en nolla
 * sa "allt läst" när uppslaget föll). Fliken ska då bara inte visa någon
 * räknare — och avvisningen får inte bli ohanterad.
 *
 * Mutation: ta bort `.catch(() => {})` → testet faller (ohanterad avvisning).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Inte vi.fn(): vitest fäster en .then på mockens löften (settledResults),
// vilket gör avvisningen "hanterad" och testet blint.
let anrop = 0
vi.mock('@/services/jobAlertEmailService', () => ({
  getUnreadCount: () => {
    anrop++
    return Promise.reject(new Error('timeout'))
  },
  getNotificationPreferences: () => new Promise(() => {}),
  updateNotificationPreferences: () => Promise.resolve(),
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
})
