import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResurserDataProvider } from './ResurserDataContext'
import type { ResurserSummary } from './ResurserDataContext'
import AITeamWidget from './AITeamWidget'

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
        <AITeamWidget
          id="ai-team"
          size="L"
          allowedSizes={['M', 'L']}
          {...props}
        />
      </ResurserDataProvider>
    </MemoryRouter>
  )
}

describe('AITeamWidget', () => {
  it('renders empty state when no aiTeamSessions', () => {
    renderWidget({})
    expect(screen.getByText('Ditt AI-team väntar')).toBeInTheDocument()
    expect(screen.getByText(/karriärcoach, studievägledare eller motivationscoach/)).toBeInTheDocument()
    expect(screen.getByText('Möt ditt AI-team')).toBeInTheDocument()
  })

  it('renders filled state with Swedish-translated agent name', () => {
    renderWidget({
      aiTeamSessions: [{ agent_id: 'career-coach', updated_at: '2026-04-25' }],
      aiTeamSessionCount: 2,
    })
    // career-coach maps to Karriärcoach
    expect(screen.getByText('Senast: Karriärcoach')).toBeInTheDocument()
    expect(screen.getByText(/2 pågående samtal/)).toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
