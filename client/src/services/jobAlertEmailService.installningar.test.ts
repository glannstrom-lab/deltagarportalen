/**
 * getNotificationPreferences — e-postvalet på bevakningsfliken.
 *
 * Före 2026-09-24 gav ett läsfel standardvärdena (på, dagligen). Den som
 * stängt av mejlen såg dem påslagna, och ett "Spara" slog på dem igen.
 * Nu kastar funktionen vid läsfel; att raden saknas är däremot normalt
 * (user_preferences skapas lazy) och ger kolumnernas standardvärden.
 * Mutation: återställ `error || !data` → standardvärden → test 3 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let svar: { data: unknown; error: { message: string } | null }

vi.mock('@/lib/supabase', () => {
  const builder: Record<string, unknown> = {}
  builder.select = () => builder
  builder.eq = () => builder
  builder.maybeSingle = () => Promise.resolve(svar)
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => builder,
    },
  }
})

import { getNotificationPreferences } from './jobAlertEmailService'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getNotificationPreferences', () => {
  it('läser det användaren valt — också avstängt', async () => {
    svar = { data: { job_alert_email_enabled: false, job_alert_frequency: 'weekly' }, error: null }
    await expect(getNotificationPreferences()).resolves.toEqual({ emailEnabled: false, frequency: 'weekly' })
  })

  it('ingen rad än ger kolumnernas standardvärden (DEFAULT true / daily)', async () => {
    svar = { data: null, error: null }
    await expect(getNotificationPreferences()).resolves.toEqual({ emailEnabled: true, frequency: 'daily' })
  })

  it('kastar vid läsfel — ett fel är inte "mejl på, dagligen"', async () => {
    svar = { data: null, error: { message: 'boom' } }
    await expect(getNotificationPreferences()).rejects.toThrow()
  })
})
