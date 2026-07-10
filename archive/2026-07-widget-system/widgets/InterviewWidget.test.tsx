import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InterviewWidget from './InterviewWidget'
import { JobsokDataProvider } from './JobsokDataContext'
import type { JobsokSummary } from './JobsokDataContext'

function renderWithSessions(sessions: JobsokSummary['interviewSessions'] | undefined) {
  const summary =
    sessions === undefined
      ? undefined
      : ({
          cv: null,
          coverLetters: [],
          interviewSessions: sessions,
          applicationStats: { total: 0, byStatus: {}, segments: [] },
          spontaneousCount: 0,
        } as JobsokSummary)
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={summary}>
        <InterviewWidget id="interview" size="L" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

describe('InterviewWidget — data wiring', () => {
  it('renders latest score from interviewSessions[0].score (HUB-01)', () => {
    renderWithSessions([
      { id: 's-1', score: 84, created_at: '2026-04-25' },
      { id: 's-2', score: 76, created_at: '2026-04-24' },
    ])
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText('/ 100')).toBeInTheDocument()
  })

  it('shows "—" when score is null on latest session (Plan 01 nullable contract)', () => {
    renderWithSessions([{ id: 's-1', score: null, created_at: '2026-04-25' }])
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows empty state when interviewSessions is empty (A11Y-03)', () => {
    renderWithSessions([])
    expect(screen.getByText('Redo att öva?')).toBeInTheDocument()
    expect(screen.getByText(/Träna på vanliga intervjufrågor/)).toBeInTheDocument()
  })
})
