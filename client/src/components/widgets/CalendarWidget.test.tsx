import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MinVardagDataProvider } from './MinVardagDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'
import CalendarWidget from './CalendarWidget'

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
        <CalendarWidget
          id="kalender"
          size="L"
          allowedSizes={['M', 'L']}
          {...props}
        />
      </MinVardagDataProvider>
    </MemoryRouter>
  )
}

describe('CalendarWidget', () => {
  it('renders empty state with non-pressuring copy (verbatim)', () => {
    renderWidget({})
    expect(screen.getByText('Inga kommande möten')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Lägg till intervjuer, möten och deadlines i din kalender'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Lägg till händelse')).toBeInTheDocument()
  })

  it('renders filled state with next-event title + Swedish-locale date', () => {
    const { container } = renderWidget({
      upcomingEvents: [
        {
          id: 'e1',
          title: 'Intervju Klarna',
          date: '2026-05-05',
          time: '14:00',
          type: 'meeting',
        },
        {
          id: 'e2',
          title: 'Möte med konsulent',
          date: '2026-05-07',
          time: null,
          type: 'meeting',
        },
      ],
    })
    expect(screen.getByText('Intervju Klarna')).toBeInTheDocument()
    // <time dateTime> renders for the primary event
    const time = container.querySelector('time[datetime="2026-05-05"]')
    expect(time).toBeInTheDocument()
    // Anti-shaming: primary KPI is the event title, not a number
    const primaryKPI = container.querySelector('.text-\\[22px\\].font-bold')
    expect(primaryKPI?.textContent).not.toMatch(/^\d+$/)
    expect(primaryKPI?.textContent).not.toMatch(/\d+%/)
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
