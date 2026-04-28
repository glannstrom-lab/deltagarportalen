import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SpontaneousWidget from './SpontaneousWidget'
import { JobsokDataProvider } from './JobsokDataContext'
import type { JobsokSummary } from './JobsokDataContext'

function renderWithCount(spontaneousCount: number | undefined) {
  const summary =
    spontaneousCount === undefined
      ? undefined
      : ({
          cv: null,
          coverLetters: [],
          interviewSessions: [],
          applicationStats: { total: 0, byStatus: {}, segments: [] },
          spontaneousCount,
        } as JobsokSummary)
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={summary}>
        <SpontaneousWidget id="spontaneous" size="M" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

describe('SpontaneousWidget — data wiring', () => {
  it('renders pipeline count from spontaneousCount (HUB-01)', () => {
    renderWithCount(5)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('företag i pipeline')).toBeInTheDocument()
  })

  it('shows empty state when spontaneousCount is 0 (A11Y-03)', () => {
    renderWithCount(0)
    expect(screen.getByText('Inget i pipeline')).toBeInTheDocument()
    expect(screen.getByText(/Kontakta företag direkt/)).toBeInTheDocument()
  })
})
