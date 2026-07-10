import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CoverLetterWidget from './CoverLetterWidget'
import { JobsokDataProvider } from './JobsokDataContext'
import type { JobsokSummary } from './JobsokDataContext'

function renderWithLetters(coverLetters: JobsokSummary['coverLetters'] | undefined) {
  const summary =
    coverLetters === undefined
      ? undefined
      : ({
          cv: null,
          coverLetters,
          interviewSessions: [],
          applicationStats: { total: 0, byStatus: {}, segments: [] },
          spontaneousCount: 0,
        } as JobsokSummary)
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={summary}>
        <CoverLetterWidget id="cover-letter" size="M" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

describe('CoverLetterWidget — data wiring', () => {
  it('renders draft count from coverLetters.length (HUB-01)', () => {
    renderWithLetters([
      { id: 'l-1', title: 'Brev till Klarna', created_at: '2026-04-25' },
      { id: 'l-2', title: 'Brev till Spotify', created_at: '2026-04-24' },
    ])
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('utkast')).toBeInTheDocument()
  })

  it('shows empty state when coverLetters is empty (A11Y-03)', () => {
    renderWithLetters([])
    expect(screen.getByText('Inga brev ännu')).toBeInTheDocument()
    expect(screen.getByText(/Generera ett anpassat brev/)).toBeInTheDocument()
  })
})
