import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KarriarDataProvider } from './KarriarDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import CareerGoalWidget from './CareerGoalWidget'

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
        <CareerGoalWidget
          id="karriar-mal"
          size="M"
          allowedSizes={['S', 'M', 'L']}
          {...props}
        />
      </KarriarDataProvider>
    </MemoryRouter>
  )
}

describe('CareerGoalWidget', () => {
  it('renders empty state when careerGoals is null', () => {
    renderWidget({})
    expect(screen.getByText('Inga aktiva mål')).toBeInTheDocument()
    expect(screen.getByText(/Sätt ditt nästa karriärmål/)).toBeInTheDocument()
    expect(screen.getByText('Skapa mitt karriärmål')).toBeInTheDocument()
  })

  it('renders filled state with shortTerm goal when set', () => {
    renderWidget({ careerGoals: { shortTerm: 'Senior UX Designer' } })
    expect(screen.getByText('Senior UX Designer')).toBeInTheDocument()
    expect(screen.queryByText('Inga aktiva mål')).not.toBeInTheDocument()
  })

  it('renders at S size without footer', () => {
    const { container } = render(
      <MemoryRouter>
        <KarriarDataProvider value={{ careerGoals: null, linkedinUrl: null, latestSkillsAnalysis: null, latestBrandAudit: null }}>
          <CareerGoalWidget id="karriar-mal" size="S" allowedSizes={['S', 'M', 'L']} />
        </KarriarDataProvider>
      </MemoryRouter>
    )
    // Footer link should not be present at S size
    expect(container.querySelector('a[href="/career"]')).not.toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
