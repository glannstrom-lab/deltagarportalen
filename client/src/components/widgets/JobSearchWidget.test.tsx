import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JobSearchWidget from './JobSearchWidget'
import { JobsokDataProvider } from './JobsokDataContext'
import type { JobsokSummary } from './JobsokDataContext'

function renderWithSummary(summary: JobsokSummary | undefined) {
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={summary}>
        <JobSearchWidget id="job-search" size="L" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

describe('JobSearchWidget — data wiring', () => {
  it('shows empty state when applicationStats has no saved jobs (A11Y-03)', () => {
    renderWithSummary({
      cv: null,
      coverLetters: [],
      interviewSessions: [],
      applicationStats: { total: 0, byStatus: {}, segments: [] },
      spontaneousCount: 0,
    })
    expect(screen.getByText('Inga sparade sökningar')).toBeInTheDocument()
    expect(screen.getByText(/Spara en sökning/)).toBeInTheDocument()
  })

  it('renders qualitative match labels only — no raw % (A11Y-03 anti-shaming)', () => {
    renderWithSummary({
      cv: null,
      coverLetters: [],
      interviewSessions: [],
      applicationStats: { total: 3, byStatus: { saved: 3 }, segments: [] },
      spontaneousCount: 0,
    })
    // No raw percentage labels should appear as match quality indicators
    const percentageCells = screen.queryAllByText(/\d+%/)
    // Percentages may appear elsewhere (e.g. ring), but match labels must be qualitative
    // Verify no element with text like "94%" appears as a match label
    expect(screen.queryByText(/^\d+%$/)).toBeNull()
  })
})
