import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ApplicationsWidget from './ApplicationsWidget'
import { JobsokDataProvider } from './JobsokDataContext'
import type { JobsokSummary } from './JobsokDataContext'

const STATS_WITH_CLOSED: JobsokSummary['applicationStats'] = {
  total: 12,
  byStatus: { saved: 4, applied: 2, interview: 1, rejected: 5 },
  segments: [
    { label: 'aktiva', count: 4, color: 'var(--c-solid)' },
    { label: 'svar inväntas', count: 2, color: 'var(--c-accent)' },
    { label: 'intervju', count: 1, color: '#059669' },
    { label: 'avslutade', count: 5, color: '#C9C6BD', deEmphasized: true },
  ],
}

function renderWithStats(stats: JobsokSummary['applicationStats'] | undefined) {
  const summary =
    stats === undefined
      ? undefined
      : ({
          cv: null,
          coverLetters: [],
          interviewSessions: [],
          applicationStats: stats,
          spontaneousCount: 0,
        } as JobsokSummary)
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={summary}>
        <ApplicationsWidget id="applications" size="L" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

describe('ApplicationsWidget — data wiring', () => {
  it('renders total from applicationStats.total (HUB-01)', () => {
    renderWithStats(STATS_WITH_CLOSED)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('totalt')).toBeInTheDocument()
  })

  it('hides closed segment by default (A11Y-04)', () => {
    renderWithStats(STATS_WITH_CLOSED)
    // The "Visa avslutade" button should be visible
    expect(screen.getByRole('button', { name: /Visa avslutade \(5\)/ })).toBeInTheDocument()
  })

  it('reveals closed segment when toggle is clicked (A11Y-04)', async () => {
    const user = userEvent.setup()
    renderWithStats(STATS_WITH_CLOSED)
    const toggleBtn = screen.getByRole('button', { name: /Visa avslutade \(5\)/ })
    await user.click(toggleBtn)
    // After clicking, the toggle button should be gone (closed segment now visible)
    expect(screen.queryByRole('button', { name: /Visa avslutade/ })).toBeNull()
  })

  it('shows empty state when total is 0 (A11Y-03)', () => {
    renderWithStats({ total: 0, byStatus: {}, segments: [] })
    expect(screen.getByText('Inga ansökningar ännu')).toBeInTheDocument()
    expect(screen.getByText(/Lägg till din första ansökan/)).toBeInTheDocument()
  })
})
