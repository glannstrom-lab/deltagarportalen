/**
 * GoalCreationDialog — ärlighet och fel (städpasset 2026-09-22).
 *
 * 1. Rutan hette "AI-förslag" och lovade "AI-baserade målförslag", men
 *    förslagen var fyra hårdkodade regler bakom en påhittad väntan på en
 *    sekund (`// Simulate API delay`). Ingen modell anropades. En mall får
 *    aldrig märkas som AI (CLAUDE.md, lärdomen 2026-08-09).
 * 2. "Förbättra CV-poängen till minst 70 %" föreslogs även när deltagaren
 *    inte HAR någon poäng (`(null || 0) < 70`).
 * 3. Ett misslyckat insert loggades bara till konsolen — dialogen stod kvar
 *    utan ett ord.
 * 4. Med förvald deltagare ledde "Tillbaka" till ett tomt deltagarsteg
 *    ("Inga deltagare hittades"), eftersom listan aldrig hämtas då.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

let insertSvar: { error: unknown } = { error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } } }) },
    from: () => ({
      select: () => ({ eq: async () => ({ data: [], error: null }) }),
      insert: async () => insertSvar,
    }),
  },
}))

import { GoalCreationDialog } from './GoalCreationDialog'

const utanPoang = {
  participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@example.com',
  has_cv: true, ats_score: null, saved_jobs_count: 12,
}

beforeEach(() => {
  insertSvar = { error: null }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('förslagsrutan', () => {
  it('kallar sig inte AI — förslagen är regler, inte en modell', async () => {
    render(<GoalCreationDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={utanPoang} />)
    await screen.findByRole('dialog')
    expect(screen.queryByText(/AI-förslag/)).not.toBeInTheDocument()
    expect(screen.queryByText(/AI-baserade/)).not.toBeInTheDocument()
  })

  it('föreslår inte att höja en CV-poäng som inte finns', async () => {
    render(<GoalCreationDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={utanPoang} />)
    fireEvent.click(await screen.findByRole('button', { name: /Visa förslag/ }))
    expect(await screen.findByText(/mock-intervju/)).toBeInTheDocument()
    expect(screen.queryByText(/CV-poängen/)).not.toBeInTheDocument()
  })

  it('med förvald deltagare finns ingen "Tillbaka" till ett tomt deltagarsteg', async () => {
    render(<GoalCreationDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={utanPoang} />)
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: /Tillbaka/ })).not.toBeInTheDocument()
  })
})

describe('sparfel', () => {
  it('ett misslyckat insert syns i dialogen, som inte stängs', async () => {
    insertSvar = { error: { message: 'permission denied' } }
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    const initialGoal = {
      title: 'Ringa två arbetsgivare', description: '', specific: '', measurable: '',
      achievable: '', relevant: '', timeBound: '', category: 'other', priority: 'MEDIUM' as const,
    }
    render(
      <GoalCreationDialog isOpen onClose={onClose} onSuccess={onSuccess}
        preselectedParticipant={utanPoang} initialGoal={initialGoal as never} />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Skapa mål/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Målet kunde inte sparas/)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
