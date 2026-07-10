import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MinVardagDataProvider } from './MinVardagDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'
import NetworkWidget from './NetworkWidget'

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
        <NetworkWidget
          id="natverk"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MinVardagDataProvider>
    </MemoryRouter>
  )
}

describe('NetworkWidget', () => {
  it('renders empty state with non-pressuring copy (verbatim)', () => {
    renderWidget({})
    expect(screen.getByText('Bygg ditt nätverk')).toBeInTheDocument()
    expect(
      screen.getByText('Lägg till kontakter från ditt yrkesnätverk')
    ).toBeInTheDocument()
    expect(screen.getByText('Lägg till kontakt')).toBeInTheDocument()
  })

  it('renders milestone label "Första kontakter" for 1-2 contacts', () => {
    renderWidget({ networkContactsCount: 2 })
    expect(screen.getByText('Första kontakter')).toBeInTheDocument()
    expect(screen.getByText(/2 kontakter/)).toBeInTheDocument()
  })

  it('renders "Bygger nätverk" for 3-9, "Bra nätverk" for ≥10 — never a %', () => {
    const { rerender, container } = renderWidget({ networkContactsCount: 5 })
    expect(screen.getByText('Bygger nätverk')).toBeInTheDocument()
    let primaryKPI = container.querySelector('.text-\\[22px\\].font-bold')
    expect(primaryKPI?.textContent).not.toMatch(/\d+%/)

    rerender(
      <MemoryRouter>
        <MinVardagDataProvider
          value={{ ...emptySummary(), networkContactsCount: 12 }}
        >
          <NetworkWidget
            id="natverk"
            size="M"
            allowedSizes={['S', 'M']}
          />
        </MinVardagDataProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('Bra nätverk')).toBeInTheDocument()
    primaryKPI = container.querySelector('.text-\\[22px\\].font-bold')
    expect(primaryKPI?.textContent).not.toMatch(/\d+%/)
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
