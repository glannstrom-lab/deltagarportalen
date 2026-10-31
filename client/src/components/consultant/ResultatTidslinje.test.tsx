import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ResultatTidslinje } from './ResultatTidslinje'

afterEach(cleanup)
const bas = { followup_3m: false, followup_6m: false }

describe('ResultatTidslinje', () => {
  it('visar — med skäl när nivå, slutdatum och uppföljning saknas', () => {
    render(<ResultatTidslinje placering={{ ...bas, start_date: '2026-06-09' }} idag="2026-07-01" />)
    expect(screen.getByTestId('rt-3m')).toHaveTextContent('belopp — (nivå saknas)')
    expect(screen.getByTestId('rt-3m')).toHaveTextContent('— (uppföljningen är inte registrerad)')
    expect(screen.getByTestId('rt-tilltrade')).toHaveTextContent('— (slutdatum saknas)')
    expect(screen.getByTestId('rt-tillagg')).toHaveTextContent('— (nivå saknas)')
    expect(screen.queryByText(/\d\s?kr/)).toBeNull()
  })
  it('visar belopp, fönster och status när datan finns', () => {
    render(<ResultatTidslinje placering={{ ...bas, start_date: '2026-06-09', end_date: '2026-09-15', outcome_level: 'C', followup_3m: true, followup_3m_payment_status: 'verifierad' }} idag="2026-10-01" />)
    expect(screen.getByTestId('rt-3m')).toHaveTextContent('9 september 2026 (passerad)')
    expect(screen.getByTestId('rt-3m')).toHaveTextContent('högst 19')
    expect(screen.getByTestId('rt-3m')).toHaveTextContent('Verifierad')
    expect(screen.getByTestId('rt-6m')).toHaveTextContent('kommande')
    expect(screen.getByTestId('rt-tilltrade')).toHaveTextContent('15 november 2026')
    expect(screen.getByTestId('rt-tillagg')).toHaveTextContent('5')
  })
})
