/** KSL16: reglerna bakom "Så räknas veckan". */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../JobbsokTidKort', () => ({ JobbsokTidKort: () => null }))
import { VeckoSummering } from './VeckoSummering'

const plan = { weekly_hours_target: 20, jobsearch_hours_per_week: 5 } as never

describe('VeckoSummering — Så räknas veckan', () => {
  it('förklarar timmar, fysiskt/digitalt, frånvaro och eget jobbsökande', () => {
    render(<VeckoSummering plan={plan} sessions={[]} vecka="2026-10-12" arLeverantor={false} participantId="p" />)
    expect(screen.getByText('Så räknas veckan')).toBeInTheDocument()
    for (const r of ['Vad som blir timmar', 'Fysiskt eller digitalt', 'Frånvaro', 'Eget jobbsökande']) {
      expect(screen.getAllByText(r).length).toBeGreaterThan(0)
    }
    expect(screen.getByText(/Beslut om nedsättning fattas av socialnämnden/)).toBeInTheDocument()
  })

  it('leverantörens frånvarotext talar om avvikelse, inte nedsättning', () => {
    render(<VeckoSummering plan={plan} sessions={[]} vecka="2026-10-12" arLeverantor participantId="p" />)
    expect(screen.getByTestId('sa-raknas-veckan').textContent).toMatch(/avvikelse att rapportera till Arbetsförmedlingen/)
  })
})
