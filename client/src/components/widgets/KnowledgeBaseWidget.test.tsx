import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResurserDataProvider } from './ResurserDataContext'
import type { ResurserSummary } from './ResurserDataContext'
import KnowledgeBaseWidget from './KnowledgeBaseWidget'

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
        <KnowledgeBaseWidget
          id="kunskapsbanken"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </ResurserDataProvider>
    </MemoryRouter>
  )
}

describe('KnowledgeBaseWidget', () => {
  it('renders empty state when no recentArticles', () => {
    renderWidget({})
    expect(screen.getByText('Utforska kunskapsbanken')).toBeInTheDocument()
    expect(screen.getByText(/Läs guider och tips/)).toBeInTheDocument()
    expect(screen.getByText('Bläddra i kunskapsbanken')).toBeInTheDocument()
  })

  it('renders filled state with completed-article count (qualitative, no %)', () => {
    renderWidget({
      recentArticles: [
        { article_id: 'cv-tips', progress_percent: 100, is_completed: true, completed_at: '2026-04-20' },
      ],
      articleCompletedCount: 3,
    })
    expect(screen.getByText('3 artiklar lästa')).toBeInTheDocument()
    expect(screen.getByText(/Senast: cv-tips/)).toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
