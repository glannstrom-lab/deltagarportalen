/**
 * journalSol — RK38 (rollspelet 2026-09-27). Före PENDING_20260927d får
 * klienten aldrig skicka eller läsa det databasen saknar.
 *
 * Motprov (körda): (1) låt journalKolumner ignorera flaggan → "före migrationen"
 * faller. (2) ta bort `if (!finns) return []` i hamtaJournalHistorik → testet
 * som kräver noll anrop faller. (3) släpp framtidskontrollen i klockslagFel → faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const from = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from } }))

import {
  franDatetimeLocal,
  hamtaJournalHistorik,
  JOURNAL_SOL_KOLUMNER,
  journalKolumner,
  journalMetaFranRad,
  klockslagFel,
  kontaktTid,
  tillDatetimeLocal,
} from './journalSol'

beforeEach(() => from.mockReset())

describe('journalSol', () => {
  it('flaggan är på sedan migrationen 20260927d_journal_sol', () => {
    expect(JOURNAL_SOL_KOLUMNER).toBe(true)
  })

  it('före migrationen skickas inga nya kolumner; efter skickas klockslag och kontaktform', () => {
    const extra = { occurredAt: '2026-09-27T08:15:00.000Z', contactForm: 'telefon' as const }
    expect(journalKolumner(extra, false)).toEqual({})
    expect(journalKolumner(extra, true)).toEqual({ occurred_at: '2026-09-27T08:15:00.000Z', contact_form: 'telefon' })
    expect(journalKolumner({}, true)).toEqual({ occurred_at: null, contact_form: null })
    expect(journalKolumner(undefined, true)).toEqual({})
  })

  it('läser de nya kolumnerna ur en select(*)-rad, och ignorerar okända kontaktformer', () => {
    expect(journalMetaFranRad({ id: 'j1', content: 'x' })).toEqual({})
    expect(journalMetaFranRad({ occurred_at: '2026-09-26T13:00:00Z', contact_form: 'besok', updated_at: '2026-09-27T09:00:00Z', updated_by: 'k1' }))
      .toEqual({ occurredAt: '2026-09-26T13:00:00Z', contactForm: 'besok', updatedAt: '2026-09-27T09:00:00Z', updatedBy: 'k1' })
    expect(journalMetaFranRad({ contact_form: 'brevduva' })).toEqual({})
  })

  it('kontaktens tid är klockslaget om det angetts, annars när anteckningen skrevs', () => {
    expect(kontaktTid({ createdAt: '2026-09-27T10:00:00Z', occurredAt: '2026-09-26T13:00:00Z' })).toBe('2026-09-26T13:00:00Z')
    expect(kontaktTid({ createdAt: '2026-09-27T10:00:00Z' })).toBe('2026-09-27T10:00:00Z')
  })

  it('datetime-local fram och tillbaka i lokal tid', () => {
    const iso = new Date(2026, 8, 26, 13, 5).toISOString()
    expect(tillDatetimeLocal(iso)).toBe('2026-09-26T13:05')
    expect(franDatetimeLocal('2026-09-26T13:05')).toBe(iso)
    expect(franDatetimeLocal('')).toBeNull()
    expect(franDatetimeLocal('inte ett datum')).toBeNull()
  })

  it('ett klockslag i framtiden är ett skrivfel', () => {
    const nu = new Date(2026, 8, 27, 12, 0)
    expect(klockslagFel('2026-09-27T11:00', nu)).toBeNull()
    expect(klockslagFel('2026-09-27T12:03', nu)).toBeNull() // inom fem minuter
    expect(klockslagFel('2026-09-28T09:00', nu)).toBe('Klockslaget ligger i framtiden.')
    expect(klockslagFel('', nu)).toBeNull()
  })

  it('historiken hämtas inte alls före migrationen', async () => {
    expect(await hamtaJournalHistorik('j1', false)).toEqual([])
    expect(from).not.toHaveBeenCalled()
  })

  it('efter migrationen: versionerna i tidsordning, och ett fel kastas i stället för en tom logg', async () => {
    const b: Record<string, unknown> = {}
    b.select = vi.fn(() => b)
    b.eq = vi.fn(() => b)
    b.order = vi.fn(() => Promise.resolve({
      data: [{ id: 'r1', journal_id: 'j1', action: 'update', content: 'Original', category: 'GENERAL', occurred_at: null, contact_form: 'telefon', author_id: 'k1', version_from: '2026-09-25T10:00:00Z', changed_by: 'k1', changed_at: '2026-09-26T10:00:00Z' }],
      error: null,
    }))
    from.mockReturnValue(b)
    const v = await hamtaJournalHistorik('j1', true)
    expect(from).toHaveBeenCalledWith('consultant_journal_revisions')
    expect(b.eq).toHaveBeenCalledWith('journal_id', 'j1')
    expect(v).toEqual([{ id: 'r1', journalId: 'j1', action: 'update', content: 'Original', category: 'GENERAL', occurredAt: null, contactForm: 'telefon', authorId: 'k1', versionFrom: '2026-09-25T10:00:00Z', changedBy: 'k1', changedAt: '2026-09-26T10:00:00Z' }])

    b.order = vi.fn(() => Promise.resolve({ data: null, error: { message: 'nekad' } }))
    await expect(hamtaJournalHistorik('j1', true)).rejects.toEqual({ message: 'nekad' })
  })
})
