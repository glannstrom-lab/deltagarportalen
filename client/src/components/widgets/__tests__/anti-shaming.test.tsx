import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobsokDataProvider } from '../JobsokDataContext'
import type { JobsokSummary } from '../JobsokDataContext'
import { KarriarDataProvider } from '../KarriarDataContext'
import type { KarriarSummary } from '../KarriarDataContext'
import { ResurserDataProvider } from '../ResurserDataContext'
import type { ResurserSummary } from '../ResurserDataContext'
import { MinVardagDataProvider } from '../MinVardagDataContext'
import type { MinVardagSummary } from '../MinVardagDataContext'
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
import MyDocumentsWidget from '../MyDocumentsWidget'
import KnowledgeBaseWidget from '../KnowledgeBaseWidget'
import ExternalResourcesWidget from '../ExternalResourcesWidget'
import PrintResourcesWidget from '../PrintResourcesWidget'
import AITeamWidget from '../AITeamWidget'
import ExercisesWidget from '../ExercisesWidget'
import HealthWidget from '../HealthWidget'
import DiaryWidget from '../DiaryWidget'
import CalendarWidget from '../CalendarWidget'
import NetworkWidget from '../NetworkWidget'
import ConsultantWidget from '../ConsultantWidget'

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

function minVardagFixture(): MinVardagSummary {
  return {
    recentMoodLogs: [
      { mood_level: 4, energy_level: 3, log_date: '2026-04-27' },
      { mood_level: 3, energy_level: 3, log_date: '2026-04-26' },
      { mood_level: 4, energy_level: 4, log_date: '2026-04-25' },
    ],
    diaryEntryCount: 5,
    latestDiaryEntry: { id: 'd1', created_at: '2026-04-25' },
    upcomingEvents: [
      {
        id: 'e1',
        title: 'Intervju Klarna',
        date: '2026-05-05',
        time: '14:00',
        type: 'meeting',
      },
    ],
    networkContactsCount: 12, // triggers "Bra nätverk" milestone
    consultant: { id: 'c1', full_name: 'Anna Karlsson', avatar_url: null },
  }
}

function resurserFixture(): ResurserSummary {
  return {
    cv: { id: 'cv-1', updated_at: '2026-04-25' },
    coverLetters: [
      { id: 'cl-1', title: 'Spotify', created_at: '2026-04-26' },
      { id: 'cl-2', title: 'Klarna',  created_at: '2026-04-27' },
    ],
    recentArticles: [
      { article_id: 'cv-tips', progress_percent: 100, is_completed: true, completed_at: '2026-04-20' },
    ],
    articleCompletedCount: 5,
    aiTeamSessions: [{ agent_id: 'career-coach', updated_at: '2026-04-25' }],
    aiTeamSessionCount: 3,
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

function renderResurserWidget(W: React.ComponentType<any>, widgetId: string) {
  const data = resurserFixture()
  return render(
    <MemoryRouter>
      <ResurserDataProvider value={data}>
        <W id={widgetId} size="L" />
      </ResurserDataProvider>
    </MemoryRouter>
  )
}

function renderMinVardagWidget(W: React.ComponentType<any>, widgetId: string) {
  const data = minVardagFixture()
  return render(
    <MemoryRouter>
      <MinVardagDataProvider value={data}>
        <W id={widgetId} size="L" />
      </MinVardagDataProvider>
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

const resurserCases: [string, React.ComponentType<any>, string][] = [
  ['MyDocumentsWidget',        MyDocumentsWidget,        'mina-dokument'],
  ['KnowledgeBaseWidget',      KnowledgeBaseWidget,      'kunskapsbanken'],
  ['ExternalResourcesWidget',  ExternalResourcesWidget,  'externa-resurser'],
  ['PrintResourcesWidget',     PrintResourcesWidget,     'utskriftsmaterial'],
  ['AITeamWidget',             AITeamWidget,             'ai-team'],
  ['ExercisesWidget',          ExercisesWidget,          'ovningar'],
]

const minVardagCases: [string, React.ComponentType<any>, string][] = [
  ['HealthWidget',     HealthWidget,     'halsa'],
  ['DiaryWidget',      DiaryWidget,      'dagbok'],
  ['CalendarWidget',   CalendarWidget,   'kalender'],
  ['NetworkWidget',    NetworkWidget,    'natverk'],
  ['ConsultantWidget', ConsultantWidget, 'min-konsulent'],
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

describe('A11Y-03 Resurser: no raw % in primary KPI slot (HUB-03)', () => {
  it.each(resurserCases)('%s does not render a number followed by %% in primary-KPI typography', (name, W, widgetId) => {
    const { container } = renderResurserWidget(W, widgetId)
    const allEls = Array.from(container.querySelectorAll('*'))
    const primaryKPIs = allEls.filter(isPrimaryKPI)

    for (const el of primaryKPIs) {
      const text = (el.textContent ?? '').trim()
      expect(text, `${name}: primary KPI element should not contain raw percentage, got: "${text}"`).not.toMatch(/\d+%/)
    }
  })
})

describe('A11Y-03 Min Vardag: no raw % in primary KPI slot (HUB-04)', () => {
  it.each(minVardagCases)('%s does not render a number followed by %% in primary-KPI typography', (name, W, widgetId) => {
    const { container } = renderMinVardagWidget(W, widgetId)
    const allEls = Array.from(container.querySelectorAll('*'))
    const primaryKPIs = allEls.filter(isPrimaryKPI)

    for (const el of primaryKPIs) {
      const text = (el.textContent ?? '').trim()
      expect(text, `${name}: primary KPI element should not contain raw percentage, got: "${text}"`).not.toMatch(/\d+%/)
    }
  })

  it('HealthWidget primary KPI never contains a raw mood number like "4/5"', () => {
    const { container } = renderMinVardagWidget(HealthWidget, 'halsa')
    const allEls = Array.from(container.querySelectorAll('*'))
    const primaryKPIs = allEls.filter(isPrimaryKPI)
    for (const el of primaryKPIs) {
      const text = (el.textContent ?? '').trim()
      expect(text, `HealthWidget: primary KPI must not contain raw mood number "${text}"`).not.toMatch(/\d+\s*\/\s*5/)
    }
  })
})
