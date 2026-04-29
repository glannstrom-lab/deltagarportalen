import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ExercisesWidget from './ExercisesWidget'

describe('ExercisesWidget', () => {
  it('always renders static content (Pitfall G — no exercise_progress table in v1.0)', () => {
    render(
      <MemoryRouter>
        <ExercisesWidget id="ovningar" size="M" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(screen.getByText('Träna och öva')).toBeInTheDocument()
    expect(screen.getByText(/Öva på intervjufärdigheter/)).toBeInTheDocument()
    expect(screen.getByText('Se alla övningar')).toBeInTheDocument()
  })

  it('renders at S size without footer link', () => {
    const { container } = render(
      <MemoryRouter>
        <ExercisesWidget id="ovningar" size="S" allowedSizes={['S', 'M']} />
      </MemoryRouter>
    )
    expect(container.querySelector('a[href="/exercises"]')).not.toBeInTheDocument()
  })

  it('forwards onHide to Widget — hide button appears in editMode', () => {
    render(
      <MemoryRouter>
        <ExercisesWidget
          id="ovningar"
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
