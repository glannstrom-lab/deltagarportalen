/**
 * TI5 — samma brist som Progress.tsx (se kommentaren i Progress.test.tsx för
 * premissgranskningen: `ProgressBars` är också bara nåbar via barrel-filen,
 * ingen levande sida importerar den). Fixad ändå eftersom filen ligger i
 * uppdragets exklusiva fillista.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBars } from './ProgressBars'

describe('ProgressBars — tillgänglighet (TI5)', () => {
  it('ger varje stapel role="progressbar" med rätt aria-valuenow/min/max och den synliga etiketten som tillgängligt namn', () => {
    render(
      <ProgressBars
        items={[
          { label: 'CV', value: 80, color: 'bg-emerald-500' },
          { label: 'Personligt brev', value: 45, color: 'bg-sky-500' },
        ]}
      />
    )

    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(2)

    expect(screen.getByRole('progressbar', { name: 'CV' })).toHaveAttribute('aria-valuenow', '80')
    expect(
      screen.getByRole('progressbar', { name: 'Personligt brev' })
    ).toHaveAttribute('aria-valuenow', '45')

    bars.forEach((bar) => {
      expect(bar).toHaveAttribute('aria-valuemin', '0')
      expect(bar).toHaveAttribute('aria-valuemax', '100')
    })
  })
})
