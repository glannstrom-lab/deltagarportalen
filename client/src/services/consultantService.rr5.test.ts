/**
 * RR5 (rollspelet 2026-09-27): uppföljningen var en kryssruta utan datum,
 * utfall eller underlag. Nu skrivs journalraden (underlaget) först och
 * kryssrutan sedan, med datum/utfall/underlag i egna kolumner (migrationen körd 2026-09-27).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const anrop: Array<{ tabell: string; op: string; payload: unknown }> = []
let updateSvar: { data: unknown; error: unknown } = { data: [{ id: 'pl1' }], error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } } }) },
    from: (tabell: string) => ({
      insert: async (payload: unknown) => { anrop.push({ tabell, op: 'insert', payload }); return { error: null } },
      update: (payload: unknown) => {
        anrop.push({ tabell, op: 'update', payload })
        const b = { eq: () => b, select: async () => updateSvar }
        return b
      },
    }),
  },
}))

import { consultantService } from './consultantService'

const placering = { id: 'pl1', participant_id: 'p1', employer_name: 'Demolager AB', job_title: 'Lager', start_date: '2026-07-09' }
const input = { vilken: '3m' as const, datum: '2026-10-09', utfall: 'kvar' as const, underlag: 'lonespecifikation' as const, anteckning: 'Trivs.' }

beforeEach(() => { anrop.length = 0; updateSvar = { data: [{ id: 'pl1' }], error: null } })

describe('registreraUppfoljning', () => {
  it('skriver journalraden med datum, utfall och underlag, och markerar sedan placeringen', async () => {
    await consultantService.registreraUppfoljning(placering, input)
    expect(anrop.map((a) => `${a.tabell}.${a.op}`)).toEqual(['consultant_journal.insert', 'consultant_placements.update'])
    const journal = anrop[0].payload as { content: string; category: string; participant_id: string }
    expect(journal.category).toBe('PROGRESS')
    expect(journal.participant_id).toBe('p1')
    expect(journal.content).toContain('Uppföljningen gjord: 2026-10-09')
    expect(journal.content).toContain('Utfall: Kvar i samma anställning/studier')
    expect(journal.content).toContain('Underlag: Lönespecifikation')
    // Migrationen 20260927b_placering_utfall körd: kryssrutan plus datum, utfall och underlag i egna kolumner.
    expect(anrop[1].payload).toMatchObject({ followup_3m: true, followup_3m_date: '2026-10-09', followup_3m_outcome: 'kvar', followup_3m_evidence: 'lonespecifikation' })
  })

  it('en tyst RLS-nollträff på markeringen blir ett fel, inte en lyckad registrering', async () => {
    updateSvar = { data: [], error: null }
    await expect(consultantService.registreraUppfoljning(placering, input)).rejects.toThrow(/står i journalen/)
  })
})
