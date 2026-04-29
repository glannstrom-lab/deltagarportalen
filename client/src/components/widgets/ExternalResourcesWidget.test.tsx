import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ExternalResourcesWidget from './ExternalResourcesWidget'

describe('ExternalResourcesWidget', () => {
  it('always renders curated 3-link static list', () => {
    render(
      <MemoryRouter>
        <ExternalResourcesWidget id="externa-resurser" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(screen.getByText('3 utvalda externa länkar')).toBeInTheDocument()
    expect(screen.getByText('Arbetsförmedlingen')).toBeInTheDocument()
    expect(screen.getByText('Jobtech Atlas')).toBeInTheDocument()
    expect(screen.getByText('Karriärguiden')).toBeInTheDocument()
  })

  it('all external links open in new tab with rel=noreferrer', () => {
    const { container } = render(
      <MemoryRouter>
        <ExternalResourcesWidget id="externa-resurser" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    const links = container.querySelectorAll('a[href^="https://"]')
    expect(links.length).toBe(3)
    links.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noreferrer')
    })
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    render(
      <MemoryRouter>
        <ExternalResourcesWidget
          id="externa-resurser"
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
