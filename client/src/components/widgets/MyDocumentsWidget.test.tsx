import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResurserDataProvider } from './ResurserDataContext'
import type { ResurserSummary } from './ResurserDataContext'
import MyDocumentsWidget from './MyDocumentsWidget'

function emptySummary(): ResurserSummary {
  return {
    cv: null,
    coverLetters: [],
    recentArticles: [],
    articleCompletedCount: 0,
    aiTeamSessions: [],
    aiTeamSessionCount: 0,
  }
}

function renderWidget(summary: Partial<ResurserSummary>, props: Record<string, unknown> = {}) {
  const value: ResurserSummary = { ...emptySummary(), ...summary }
  return render(
    <MemoryRouter>
      <ResurserDataProvider value={value}>
        <MyDocumentsWidget
          id="mina-dokument"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </ResurserDataProvider>
    </MemoryRouter>
  )
}

describe('MyDocumentsWidget', () => {
  it('renders empty state when cv is null and no cover letters', () => {
    renderWidget({})
    expect(screen.getByText('Inga dokument ännu')).toBeInTheDocument()
    expect(screen.getByText(/Skapa ditt CV och dina personliga brev/)).toBeInTheDocument()
    expect(screen.getByText('Gå till Söka jobb')).toBeInTheDocument()
  })

  it('renders filled state with milestone-style label (CV + N brev klara)', () => {
    renderWidget({
      cv: { id: 'cv-1', updated_at: '2026-04-25' },
      coverLetters: [
        { id: 'cl-1', title: 'Spotify', created_at: '2026-04-26' },
        { id: 'cl-2', title: 'Klarna',  created_at: '2026-04-27' },
      ],
    })
    expect(screen.getByText('CV + 2 brev klara')).toBeInTheDocument()
    expect(screen.queryByText('Inga dokument ännu')).not.toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
