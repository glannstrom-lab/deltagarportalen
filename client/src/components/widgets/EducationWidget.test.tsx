import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EducationWidget from './EducationWidget'

describe('EducationWidget', () => {
  it('always renders static empty-state-style content', () => {
    render(
      <MemoryRouter>
        <EducationWidget id="utbildning" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(screen.getByText('Hitta din nästa utbildning')).toBeInTheDocument()
    expect(screen.getByText(/Sök bland tusentals kurser/)).toBeInTheDocument()
    expect(screen.getByText('Utforska utbildningar')).toBeInTheDocument()
  })

  it('renders at S size without footer', () => {
    const { container } = render(
      <MemoryRouter>
        <EducationWidget id="utbildning" size="S" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(container.querySelector('a[href="/education"]')).not.toBeInTheDocument()
  })

  it('renders at M size with CTA link', () => {
    const { container } = render(
      <MemoryRouter>
        <EducationWidget id="utbildning" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(container.querySelector('a[href="/education"]')).toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    render(
      <MemoryRouter>
        <EducationWidget
          id="utbildning"
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
