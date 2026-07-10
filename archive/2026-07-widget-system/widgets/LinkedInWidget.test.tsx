import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KarriarDataProvider } from './KarriarDataContext'
import type { KarriarSummary } from './KarriarDataContext'
import LinkedInWidget from './LinkedInWidget'

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
        <LinkedInWidget
          id="linkedin"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </KarriarDataProvider>
    </MemoryRouter>
  )
}

describe('LinkedInWidget', () => {
  it('renders empty state when linkedinUrl is null', () => {
    renderWidget({})
    expect(screen.getByText('Koppla LinkedIn')).toBeInTheDocument()
    expect(screen.getByText(/Lägg till din LinkedIn-URL/)).toBeInTheDocument()
    expect(screen.getByText('Lägg till LinkedIn')).toBeInTheDocument()
  })

  it('renders filled state when linkedinUrl is set', () => {
    renderWidget({ linkedinUrl: 'https://linkedin.com/in/testuser' })
    expect(screen.getByText('Profil ansluten')).toBeInTheDocument()
    expect(screen.getByText('Optimera din profil')).toBeInTheDocument()
    expect(screen.queryByText('Koppla LinkedIn')).not.toBeInTheDocument()
  })

  it('renders at S size without footer', () => {
    const { container } = render(
      <MemoryRouter>
        <KarriarDataProvider value={{ careerGoals: null, linkedinUrl: null, latestSkillsAnalysis: null, latestBrandAudit: null }}>
          <LinkedInWidget id="linkedin" size="S" allowedSizes={['S', 'M']} />
        </KarriarDataProvider>
      </MemoryRouter>
    )
    // No footer at S size
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    renderWidget({}, { editMode: true, onHide: vi.fn() })
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
