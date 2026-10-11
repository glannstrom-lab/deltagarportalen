/**
 * MinDagSection — skalet för konsulentens Min dag (omtaget "Kvarter", steg 3).
 *
 * Ärligheten är det som testas: under laddning påstås ingenting om dagen, vid
 * läsfel står en rad om felet och aldrig tomläget, och tomläget (bilden
 * "Klart för i dag") visas bara när allt verkligen är tomt.
 *
 * Motprov (kört): ta bort `!fel` ur `visaTomt` → "läsfel är aldrig allt klart" faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MinDagSection } from './MinDagSection'
import { halsning, sakerIDag } from './minDagText'

afterEach(() => cleanup())

const MORGON = new Date(2026, 9, 13, 8, 12)
const KVALL = new Date(2026, 9, 13, 17, 40)

function rita(props: Partial<Parameters<typeof MinDagSection>[0]> = {}) {
  return render(
    <MinDagSection lage="klart" fornamn="Karin" antalSaker={4} tomt={false} nu={MORGON} {...props}>
      <div data-testid="innehall">listan</div>
    </MinDagSection>,
  )
}

describe('MinDagSection', () => {
  it('hälsar med namn och datum, och säger hur många saker dagen har', () => {
    rita()
    expect(screen.getByRole('heading', { level: 2, name: 'God morgon, Karin' })).toBeInTheDocument()
    // Stor bokstav bara först, inte på månaden (drift 2026-09-22).
    expect(screen.getByText(/^[A-ZÅÄÖ][a-zåäö]+ 13 oktober$/)).toBeInTheDocument()
    expect(screen.getByTestId('mindag-antal')).toHaveTextContent('Fyra saker i dag. Det som brådskar står först.')
    expect(screen.getByTestId('innehall')).toBeInTheDocument()
  })

  it('under laddning: ingen räkning, inget innehåll, inget tomläge', () => {
    rita({ lage: 'laddar', antalSaker: null, tomt: true })
    expect(screen.getByTestId('mindag-antal')).toHaveTextContent('Hämtar din dag')
    expect(screen.queryByTestId('innehall')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mindag-tomt')).not.toBeInTheDocument()
  })

  it('läsfel är aldrig "allt klart" — en rad om felet, inget tomläge', () => {
    rita({ fel: 'Möten och frånvaro kunde inte hämtas', tomt: true, antalSaker: null })
    expect(screen.getByRole('alert')).toHaveTextContent('Möten och frånvaro kunde inte hämtas')
    expect(screen.queryByTestId('mindag-tomt')).not.toBeInTheDocument()
    expect(screen.queryByText(/Allt för i dag är gjort/)).not.toBeInTheDocument()
  })

  it('tomläget har bilden och en handling, och ersätter listan', () => {
    const onSeAlla = vi.fn()
    rita({ tomt: true, antalSaker: 0, onSeAlla, nu: KVALL })
    const tomt = screen.getByTestId('mindag-tomt')
    expect(tomt.querySelector('img')).toHaveAttribute('src', '/kontor/klart-900.webp')
    expect(screen.getByRole('heading', { name: 'Allt för i dag är gjort' })).toBeInTheDocument()
    expect(screen.queryByTestId('innehall')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Se alla deltagare' }))
    expect(onSeAlla).toHaveBeenCalled()
  })

  it('snabbåtgärderna ligger i Mer-menyn, inte som fem knappar', () => {
    rita({ meny: [{ etikett: 'Bjud in deltagare', onClick: vi.fn() }, { etikett: 'Boka möte', onClick: vi.fn() }] })
    expect(screen.getByRole('button', { name: 'Mer' })).toHaveAttribute('aria-haspopup')
    expect(screen.queryByRole('button', { name: 'Bjud in deltagare' })).not.toBeInTheDocument()
  })

  it('veckan i en mening och leverantörens vecka mot avtalet visas bara när de finns', () => {
    rita({ veckan: 'Alla tre deltagare med pass den här veckan har varit på alla sina.', avtal: ['1 utan fysiskt möte'] })
    expect(screen.getByTestId('mindag-veckan')).toHaveTextContent('Alla tre deltagare')
    expect(screen.getByLabelText('Veckan mot avtalet')).toHaveTextContent('1 utan fysiskt möte')
    cleanup()
    rita()
    expect(screen.queryByTestId('mindag-veckan')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Veckan mot avtalet')).not.toBeInTheDocument()
  })
})

describe('hälsning och antal', () => {
  it('God morgon före tio, God kväll från fem, annars Hej', () => {
    expect(halsning(new Date(2026, 9, 13, 7))).toBe('God morgon')
    expect(halsning(new Date(2026, 9, 13, 13))).toBe('Hej')
    expect(halsning(new Date(2026, 9, 13, 18))).toBe('God kväll')
  })
  it('ord upp till tolv, singular för en', () => {
    expect(sakerIDag(1)).toBe('En sak i dag.')
    expect(sakerIDag(12)).toBe('Tolv saker i dag.')
    expect(sakerIDag(14)).toBe('14 saker i dag.')
  })
})
