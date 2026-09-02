/**
 * TI5 — Progress saknade role="progressbar", aria-valuenow/min/max och en
 * tillgänglig etikett. Rena <div>-staplar med bredd satt i `style` är
 * osynliga i tillgänglighetsträdet — en skärmläsare säger ingenting alls om
 * en pågående process.
 *
 * VIKTIGT att veta om den här komponenten (premissgranskning 2026-09-02):
 * `Progress` exporteras bara via barrel-filen `components/ui/index.ts` — ett
 * fullständigt grep över `client/src` (`<Progress`, `{ Progress }`,
 * `nåbarhetsanalysen` i `scripts/dead-code.cjs`) hittar noll ställen som
 * faktiskt monterar komponenten i den levande appen. Varje "Progress bar" i
 * portalen (CVOnboarding, FocusCVBuilder, QuestionCard m.fl.) är en egen
 * handrullad `<div>`. Fixen görs ändå eftersom filen ligger i uppdragets
 * exklusiva fillista och är billig att göra rätt — men den har i dagsläget
 * INGEN effekt i produktion förrän något faktiskt importerar `Progress` från
 * `@/components/ui`. Se slutrapporten för hela resonemanget.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './Progress'

describe('Progress — tillgänglighet (TI5)', () => {
  it('har role="progressbar" med aria-valuemin/max och det klämda värdet som aria-valuenow', () => {
    render(<Progress value={42} label="CV-komplettering" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('bär den tillgängliga etiketten som ges via label-propen', () => {
    render(<Progress value={30} label="Kompetensanalys" />)
    expect(screen.getByRole('progressbar', { name: 'Kompetensanalys' })).toBeInTheDocument()
  })

  it('klämmer värdet till 0–100 i BÅDE aria-valuenow och bredden — ett värde utanför intervallet ska inte synas som ett ogiltigt ARIA-tal', () => {
    render(<Progress value={150} label="Test" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveStyle({ width: '100%' })
  })

  it('klämmer negativa värden till 0', () => {
    render(<Progress value={-10} label="Test" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})
