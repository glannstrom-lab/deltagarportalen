import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HubGrid } from './HubGrid'

describe('HubGrid', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders root grid with 4-col + 2-col responsive classes', () => {
    const { container } = render(<HubGrid><div>x</div></HubGrid>)
    const grid = container.firstElementChild!
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('grid-cols-2')
    expect(grid.className).toContain('min-[900px]:grid-cols-4')
    expect(grid.className).toContain('auto-rows-[150px]')
    expect(grid.className).toContain('gap-[14px]')
  })

  it('Section renders aria-labeled section + h4 heading', () => {
    render(<HubGrid.Section title="Skapa & öva"><div>x</div></HubGrid.Section>)
    expect(screen.getByRole('region', { name: 'Skapa & öva' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Skapa & öva' })).toBeInTheDocument()
  })

  it('Section heading has uppercase + letter-spacing classes', () => {
    render(<HubGrid.Section title="Test"><div>x</div></HubGrid.Section>)
    const h4 = screen.getByRole('heading', { level: 4 })
    expect(h4.className).toContain('uppercase')
    expect(h4.className).toContain('tracking-[0.06em]')
    expect(h4.className).toContain('text-[12px]')
    expect(h4.className).toContain('font-bold')
  })

  it('Slot applies correct grid span classes per size', () => {
    const { container, rerender } = render(<HubGrid.Slot size="S"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-1')
    expect(container.firstElementChild!.className).toContain('row-span-1')

    rerender(<HubGrid.Slot size="M"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-2')
    expect(container.firstElementChild!.className).toContain('row-span-1')

    rerender(<HubGrid.Slot size="L"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-2')
    expect(container.firstElementChild!.className).toContain('row-span-2')

    rerender(<HubGrid.Slot size="XL"><div>x</div></HubGrid.Slot>)
    expect(container.firstElementChild!.className).toContain('col-span-2')
    expect(container.firstElementChild!.className).toContain('min-[900px]:col-span-4')
  })

  it('Slot wraps child in error boundary (sibling slot survives child throw)', () => {
    const Boom = () => { throw new Error('boom') }
    render(
      <HubGrid>
        <HubGrid.Slot size="S"><Boom /></HubGrid.Slot>
        <HubGrid.Slot size="S"><div>Survivor</div></HubGrid.Slot>
      </HubGrid>
    )
    expect(screen.getByText('Survivor')).toBeInTheDocument()
    expect(screen.getByText('Kunde inte ladda')).toBeInTheDocument()
  })
})
