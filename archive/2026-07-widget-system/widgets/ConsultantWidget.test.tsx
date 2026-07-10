import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MinVardagDataProvider } from './MinVardagDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'
import ConsultantWidget from './ConsultantWidget'

function emptySummary(): MinVardagSummary {
  return {
    recentMoodLogs: [],
    diaryEntryCount: 0,
    latestDiaryEntry: null,
    upcomingEvents: [],
    networkContactsCount: 0,
    consultant: null,
  }
}

function renderWidget(
  summary: Partial<MinVardagSummary>,
  props: Record<string, unknown> = {}
) {
  const value: MinVardagSummary = { ...emptySummary(), ...summary }
  return render(
    <MemoryRouter>
      <MinVardagDataProvider value={value}>
        <ConsultantWidget
          id="min-konsulent"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </MinVardagDataProvider>
    </MemoryRouter>
  )
}

describe('ConsultantWidget', () => {
  it('renders non-pressuring empty state copy (verbatim)', () => {
    renderWidget({})
    expect(screen.getByText('Ingen konsulent ännu')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Kontakta arbetsförmedlingen för att komma igång med coachning'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Mer om konsulentcoachning')).toBeInTheDocument()
  })

  it('renders filled state with consultant name from joined profile (qualitative, no %)', () => {
    const { container } = renderWidget({
      consultant: {
        id: 'c1',
        full_name: 'Anna Karlsson',
        avatar_url: null,
      },
    })
    expect(screen.getByText('Anna Karlsson')).toBeInTheDocument()
    // Anti-shaming: primary KPI is the name, not a number
    const primaryKPI = container.querySelector('.text-\\[22px\\].font-bold')
    expect(primaryKPI?.textContent).toBe('Anna Karlsson')
    expect(primaryKPI?.textContent).not.toMatch(/\d+%/)
    // No upcoming meeting → fallback message
    expect(screen.getByText('Inget möte inplanerat')).toBeInTheDocument()
  })

  it('shows "Nästa möte" line when upcomingEvents has a meeting type', () => {
    renderWidget({
      consultant: {
        id: 'c1',
        full_name: 'Anna Karlsson',
        avatar_url: null,
      },
      upcomingEvents: [
        {
          id: 'e1',
          title: 'Coachmöte',
          date: '2026-05-05',
          time: '14:00',
          type: 'meeting',
        },
      ],
    })
    expect(screen.getByText(/Nästa möte:/)).toBeInTheDocument()
    expect(screen.queryByText('Inget möte inplanerat')).not.toBeInTheDocument()
  })

  it('falls back to "Konsulent" when full_name is null', () => {
    renderWidget({
      consultant: {
        id: 'c1',
        full_name: null,
        avatar_url: null,
      },
    })
    expect(screen.getByText('Konsulent')).toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
