import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MinVardagDataProvider } from './MinVardagDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'
import DiaryWidget from './DiaryWidget'

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
        <DiaryWidget
          id="dagbok"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </MinVardagDataProvider>
    </MemoryRouter>
  )
}

describe('DiaryWidget', () => {
  it('renders non-pressuring empty state copy (verbatim from <interfaces>)', () => {
    renderWidget({})
    expect(screen.getByText('Inga anteckningar ännu')).toBeInTheDocument()
    expect(
      screen.getByText('Börja din dagbok — skriv fritt om din jobbsökning')
    ).toBeInTheDocument()
    expect(screen.getByText('Skriv idag')).toBeInTheDocument()
  })

  it('renders filled state with entry count as primary label (no %)', () => {
    const { container } = renderWidget({
      diaryEntryCount: 5,
      latestDiaryEntry: { id: 'd1', created_at: '2026-04-25' },
    })
    expect(screen.getByText('5 inlägg')).toBeInTheDocument()
    expect(screen.getByText(/Senast:/)).toBeInTheDocument()
    // Anti-shaming: primary KPI never contains %
    const primaryKPI = container.querySelector('.text-\\[22px\\].font-bold')
    expect(primaryKPI?.textContent).not.toMatch(/\d+%/)
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
