import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PrintResourcesWidget from './PrintResourcesWidget'

describe('PrintResourcesWidget', () => {
  it('always renders the 3 printable templates list', () => {
    render(
      <MemoryRouter>
        <PrintResourcesWidget id="utskriftsmaterial" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(screen.getByText('3 mallar att skriva ut')).toBeInTheDocument()
    expect(screen.getByText('CV-mall (utskrift)')).toBeInTheDocument()
    expect(screen.getByText('Personligt brev-mall')).toBeInTheDocument()
    expect(screen.getByText('Intervjuförberedelse')).toBeInTheDocument()
  })

  it('renders download links to /templates/* PDFs with download attribute', () => {
    const { container } = render(
      <MemoryRouter>
        <PrintResourcesWidget id="utskriftsmaterial" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    const cvLink = container.querySelector('a[href="/templates/cv-template.pdf"]')
    expect(cvLink).not.toBeNull()
    expect(cvLink!.hasAttribute('download')).toBe(true)
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    render(
      <MemoryRouter>
        <PrintResourcesWidget
          id="utskriftsmaterial"
          size="M"
          allowedSizes={['S', 'M']}
          editMode={true}
          onHide={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /Dölj widget/ })).toBeInTheDocument()
  })
})
