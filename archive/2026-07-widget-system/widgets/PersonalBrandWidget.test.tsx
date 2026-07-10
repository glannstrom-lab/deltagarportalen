import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KarriarDataProvider } from './KarriarDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import PersonalBrandWidget from './PersonalBrandWidget'

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
        <PersonalBrandWidget
          id="personligt-varumarke"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </KarriarDataProvider>
    </MemoryRouter>
  )
}

describe('PersonalBrandWidget', () => {
  it('renders empty state when latestBrandAudit is null', () => {
    renderWidget({})
    expect(screen.getByText('Ditt personliga varumärke')).toBeInTheDocument()
    expect(screen.getByText(/Gör en audit/)).toBeInTheDocument()
    expect(screen.getByText('Starta audit')).toBeInTheDocument()
  })

  it('renders qualitative label for score — never raw score in primary KPI slot', () => {
    renderWidget({
      latestBrandAudit: {
        score: 84,
        dimensions: { presence: 90 },
        created_at: '2026-04-15T00:00:00Z',
      },
    })
    // Qualitative label based on score >= 75
    expect(screen.getByText('Starkt varumärke')).toBeInTheDocument()
    // Raw score/percentage must NOT appear in 32px/22px font-bold slot
    const primaryKPIs = Array.from(document.querySelectorAll('*')).filter(el => {
      const cls = el.className?.toString?.() ?? ''
      return /(text-\[32px\]|text-\[22px\])/.test(cls) && /font-bold/.test(cls)
    })
    for (const el of primaryKPIs) {
      expect(el.textContent).not.toMatch(/\d+%/)
    }
    // Date text should appear in body (not as KPI)
    expect(screen.getByText(/Senaste audit/)).toBeInTheDocument()
  })

  it('renders at S size without footer', () => {
    const { container } = render(
      <MemoryRouter>
        <KarriarDataProvider value={{ careerGoals: null, linkedinUrl: null, latestSkillsAnalysis: null, latestBrandAudit: null }}>
          <PersonalBrandWidget id="personligt-varumarke" size="S" allowedSizes={['S', 'M', 'L']} />
        </KarriarDataProvider>
      </MemoryRouter>
    )
    expect(container.querySelector('a[href="/personal-brand"]')).not.toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
