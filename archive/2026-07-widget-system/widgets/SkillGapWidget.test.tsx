import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KarriarDataProvider } from './KarriarDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import SkillGapWidget from './SkillGapWidget'

function renderWidget(summary: Partial<KarriarSummary>, props: Record<string, unknown> = {}) {
  const value: KarriarSummary = {
    careerGoals: null,
    linkedinUrl: null,
    latestSkillsAnalysis: null,
    latestBrandAudit: null,
    ...summary,
  }
  return render(
    <MemoryRouter>
      <KarriarDataProvider value={value}>
        <SkillGapWidget
          id="kompetensgap"
          size="L"
          allowedSizes={['M', 'L']}
          {...props}
        />
      </KarriarDataProvider>
    </MemoryRouter>
  )
}

describe('SkillGapWidget', () => {
  it('renders empty state when latestSkillsAnalysis is null', () => {
    renderWidget({})
    expect(screen.getByText('Ingen analys gjord')).toBeInTheDocument()
    expect(screen.getByText(/Ta reda på vilka kompetenser/)).toBeInTheDocument()
    expect(screen.getByText('Gör analys')).toBeInTheDocument()
  })

  it('renders qualitative milestone label — never raw percentage in primary KPI slot', () => {
    renderWidget({
      latestSkillsAnalysis: {
        dream_job: 'UX Designer',
        skills_comparison: { missing: ['Figma', 'User research', 'Prototyping'] },
        match_percentage: 72,
        created_at: '2026-04-20',
      },
    })
    // Milestone label visible
    expect(screen.getByText('Nära målet')).toBeInTheDocument()
    // Raw percentage must NOT appear in 32px/22px font-bold slot
    const primaryKPIs = Array.from(document.querySelectorAll('*')).filter(el => {
      const cls = el.className?.toString?.() ?? ''
      return /(text-\[32px\]|text-\[22px\])/.test(cls) && /font-bold/.test(cls)
    })
    for (const el of primaryKPIs) {
      expect(el.textContent).not.toMatch(/\d+%/)
    }
  })

  it('renders at M size (smallest allowed)', () => {
    const { container } = render(
      <MemoryRouter>
        <KarriarDataProvider value={{ careerGoals: null, linkedinUrl: null, latestSkillsAnalysis: null, latestBrandAudit: null }}>
          <SkillGapWidget id="kompetensgap" size="M" allowedSizes={['M', 'L']} />
        </KarriarDataProvider>
      </MemoryRouter>
    )
    expect(container.querySelector('[data-widget-id="kompetensgap"]')).toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
