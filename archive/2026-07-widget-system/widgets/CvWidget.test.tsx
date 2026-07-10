import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CvWidget from './CvWidget'
import { JobsokDataProvider } from './JobsokDataContext'
import type { JobsokSummary } from './JobsokDataContext'

function renderWithCv(cv: JobsokSummary['cv']) {
  const summary =
    cv === undefined
      ? undefined
      : ({
          cv,
          coverLetters: [],
          interviewSessions: [],
          applicationStats: { total: 0, byStatus: {}, segments: [] },
          spontaneousCount: 0,
        } as JobsokSummary)
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={summary}>
        <CvWidget id="cv" size="L" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

describe('CvWidget — data wiring', () => {
  it('renders milestone label from cv.completion_pct (HUB-01, A11Y-03)', () => {
    renderWithCv({ id: 'cv-1', updated_at: '2026-04-25', completion_pct: 75 })
    // Milestone label, not raw "75%" as primary KPI
    expect(
      screen.getByText(/Nästan klart|Klar att skickas|Bra start|Kom igång med ditt CV/)
    ).toBeInTheDocument()
  })

  it('shows empty state when cv is null (A11Y-03)', () => {
    renderWithCv(null)
    expect(screen.getByText('Ditt CV väntar')).toBeInTheDocument()
    expect(screen.getByText(/Skapa ditt CV/)).toBeInTheDocument()
  })
})
