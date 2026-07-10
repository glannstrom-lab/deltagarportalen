import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MinVardagDataProvider } from './MinVardagDataContext'
import type { MinVardagSummary } from './MinVardagDataContext'
import HealthWidget from './HealthWidget'

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
        <HealthWidget
          id="halsa"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </MinVardagDataProvider>
    </MemoryRouter>
  )
}

describe('HealthWidget', () => {
  it('renders empty state with non-pressuring "Om du vill" copy (empathy contract)', () => {
    renderWidget({})
    expect(screen.getByText('Hur mår du idag?')).toBeInTheDocument()
    // EXACT verbatim — agent-locked empathy copy. Do NOT paraphrase.
    expect(
      screen.getByText('Om du vill — logga ditt mående med ett klick')
    ).toBeInTheDocument()
    expect(screen.getByText('Logga idag')).toBeInTheDocument()
    // Anti-pressure: must NOT contain shaming framing
    expect(screen.queryByText(/inte loggat på/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Logga nu/)).not.toBeInTheDocument()
  })

  it('renders filled state — primary slot is streak (qualitative), never raw mood number', () => {
    const { container } = renderWidget({
      recentMoodLogs: [
        { mood_level: 4, energy_level: 3, log_date: '2026-04-27' },
        { mood_level: 3, energy_level: 3, log_date: '2026-04-26' },
        { mood_level: 4, energy_level: 4, log_date: '2026-04-25' },
      ],
    })
    expect(screen.getByText('3 dagar i rad')).toBeInTheDocument()
    // Anti-shaming: primary KPI must NOT contain a raw mood-level number like "4/5"
    const primaryKPI = container.querySelector('.text-\\[22px\\].font-bold')
    expect(primaryKPI?.textContent).not.toMatch(/\d+\/5/)
    expect(primaryKPI?.textContent).not.toMatch(/^\d+$/)
  })

  it('renders Sparkline as decorative data viz when ≥2 logs (M-size, not minimal)', () => {
    const { container } = renderWidget(
      {
        recentMoodLogs: [
          { mood_level: 4, energy_level: 3, log_date: '2026-04-27' },
          { mood_level: 3, energy_level: 3, log_date: '2026-04-26' },
        ],
      },
      { size: 'L', allowedSizes: ['S', 'M', 'L'] }
    )
    // Sparkline svg has aria-label "Trend: ..."
    const svg = container.querySelector('svg[aria-label^="Trend:"]')
    expect(svg).toBeInTheDocument()
  })

  it('shows last-log-date label when only 1 log (no streak)', () => {
    renderWidget({
      recentMoodLogs: [{ mood_level: 4, energy_level: 3, log_date: '2026-04-27' }],
    })
    // Streak < 2 → fallback to "Senast: {date}" label
    expect(screen.getByText(/Senast:/)).toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
