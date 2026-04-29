import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobsokDataProvider } from '../JobsokDataContext'
import type { JobsokSummary } from '../JobsokDataContext'
import { KarriarDataProvider } from '../KarriarDataContext'
import type { KarriarSummary } from '../KarriarDataContext'
import CvWidget from '../CvWidget'
import CoverLetterWidget from '../CoverLetterWidget'
import InterviewWidget from '../InterviewWidget'
import JobSearchWidget from '../JobSearchWidget'
import ApplicationsWidget from '../ApplicationsWidget'
import SpontaneousWidget from '../SpontaneousWidget'
import SalaryWidget from '../SalaryWidget'
import InternationalWidget from '../InternationalWidget'
import CareerGoalWidget from '../CareerGoalWidget'
import SkillGapWidget from '../SkillGapWidget'
import PersonalBrandWidget from '../PersonalBrandWidget'

// Mock useInterestProfile for InterestGuideWidget (called inside the widget directly)
vi.mock('@/hooks/useInterestProfile', () => ({
  useInterestProfile: () => ({
    profile: {
      hasResult: true,
      riasecScores: { realistic: 20, investigative: 80, artistic: 60, social: 40, enterprising: 30, conventional: 10 },
      dominantTypes: [{ code: 'investigative', score: 80 }],
      recommendedOccupations: [{ name: 'UX Designer', matchPercentage: 85 }],
      completedAt: '2026-04-20',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import InterestGuideWidget from '../InterestGuideWidget'

/**
 * A11Y-03 — anti-shaming guard.
 *
 * No widget renders a number followed by "%" as a PRIMARY KPI.
 * Primary KPI typography slot = element with className containing
 * "text-[32px]" OR "text-[22px]", AND "font-bold".
 *
 * NOTE: Decorative percentages inside ProgressRing label (CV) are EXCLUDED —
 * they are inside SVG with smaller font, not the primary 32/22px slot.
 * CvWidget's ProgressRing renders "75%" as an SVG text element (decorative label)
 * inside the ring — that is the ring's internal annotation, NOT the primary KPI.
 * The primary KPI is the milestoneLabel ("Nästan klart — 1 sektion kvar").
 *
 * Allowed examples: "84 / 100" (no %), "12" (no %), "52 000 kr/mån" (no %)
 * Forbidden examples: "75%", "94%", "84%"
 */

const PRIMARY_KPI_CLASS_RE = /(text-\[32px\]|text-\[22px\])/

function isPrimaryKPI(el: Element): boolean {
  const cls = el.className?.toString?.() ?? ''
  return PRIMARY_KPI_CLASS_RE.test(cls) && /font-bold/.test(cls)
}

function fixture(): JobsokSummary {
  return {
    cv: { id: 'cv-1', updated_at: '2026-04-25', completion_pct: 75 },
    coverLetters: [{ id: 'cl-1', title: 'Klarna UX', created_at: '2026-04-26' }],
    interviewSessions: [{ id: 's-1', score: 84, created_at: '2026-04-27' }],
    applicationStats: {
      total: 12,
      byStatus: { saved: 4, applied: 2, interview: 1, rejected: 3, pending_response: 1 },
      segments: [
        { label: 'aktiva', count: 4 },
        { label: 'svar inväntas', count: 2 },
        { label: 'intervju', count: 1 },
        { label: 'avslutade', count: 5, deEmphasized: true },
      ],
    },
    spontaneousCount: 5,
  }
}

function karriarFixture(): KarriarSummary {
  return {
    careerGoals: { shortTerm: 'Senior UX Designer', longTerm: 'Design Lead' },
    linkedinUrl: 'https://linkedin.com/in/test',
    latestSkillsAnalysis: {
      dream_job: 'UX Designer',
      skills_comparison: { missing: ['Figma', 'User research'] },
      match_percentage: 72, // MUST NOT appear raw in 32/22px font-bold
      created_at: '2026-04-20',
    },
    latestBrandAudit: {
      score: 84, // MUST NOT appear raw in 32/22px font-bold
      dimensions: { presence: 90 },
      created_at: '2026-04-15T00:00:00Z',
    },
  }
}

function renderWidget(W: React.ComponentType<any>, widgetId: string) {
  const data = fixture()
  return render(
    <MemoryRouter>
      <JobsokDataProvider value={data}>
        <W id={widgetId} size="L" />
      </JobsokDataProvider>
    </MemoryRouter>
  )
}

function renderKarriarWidget(W: React.ComponentType<any>, widgetId: string) {
  const data = karriarFixture()
  return render(
    <MemoryRouter>
      <KarriarDataProvider value={data}>
        <W id={widgetId} size="L" />
      </KarriarDataProvider>
    </MemoryRouter>
  )
}

const cases: [string, React.ComponentType<any>, string][] = [
  ['CvWidget', CvWidget, 'cv'],
  ['CoverLetterWidget', CoverLetterWidget, 'cover-letter'],
  ['InterviewWidget', InterviewWidget, 'interview'],
  ['JobSearchWidget', JobSearchWidget, 'job-search'],
  ['ApplicationsWidget', ApplicationsWidget, 'applications'],
  ['SpontaneousWidget', SpontaneousWidget, 'spontaneous'],
  ['SalaryWidget', SalaryWidget, 'salary'],
  ['InternationalWidget', InternationalWidget, 'international'],
]

const karriarCases: [string, React.ComponentType<any>, string][] = [
  ['CareerGoalWidget', CareerGoalWidget, 'karriar-mal'],
  ['InterestGuideWidget', InterestGuideWidget, 'intresseguide'],
  ['SkillGapWidget', SkillGapWidget, 'kompetensgap'],
  ['PersonalBrandWidget', PersonalBrandWidget, 'personligt-varumarke'],
]

describe('A11Y-03: no raw % in primary KPI slot', () => {
  it.each(cases)('%s does not render a number followed by %% in primary-KPI typography', (name, W, widgetId) => {
    const { container } = renderWidget(W, widgetId)
    const allEls = Array.from(container.querySelectorAll('*'))
    const primaryKPIs = allEls.filter(isPrimaryKPI)

    for (const el of primaryKPIs) {
      const text = (el.textContent ?? '').trim()
      // Allowed: "84 / 100" (no %), "12" (no %), "5" (no %)
      // Forbidden: "75%", "94%", "84%" — raw number-only percent string
      expect(text, `${name}: primary KPI element should not contain raw percentage, got: "${text}"`).not.toMatch(/\d+%/)
    }
  })

  it('JobSearchWidget match cards never contain a raw percentage', () => {
    const { container } = renderWidget(JobSearchWidget, 'job-search')
    const text = container.textContent ?? ''
    // Forbidden: "94% match", "85%", etc. Allowed: "Bra match", "Mycket bra match"
    expect(text).not.toMatch(/\d+%\s*match/i)
    expect(text).not.toMatch(/match\s*\d+%/i)
  })
})

describe('A11Y-03 Karriär: no raw % in primary KPI slot (HUB-02)', () => {
  it.each(karriarCases)('%s does not render a number followed by %% in primary-KPI typography', (name, W, widgetId) => {
    const { container } = renderKarriarWidget(W, widgetId)
    const allEls = Array.from(container.querySelectorAll('*'))
    const primaryKPIs = allEls.filter(isPrimaryKPI)

    for (const el of primaryKPIs) {
      const text = (el.textContent ?? '').trim()
      expect(text, `${name}: primary KPI element should not contain raw percentage, got: "${text}"`).not.toMatch(/\d+%/)
    }
  })
})
