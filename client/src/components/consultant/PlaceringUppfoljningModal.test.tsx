/**
 * Tester för PlaceringUppfoljningModal (AS4).
 *
 * Bakgrund: formuläret förifyllde `status: 'good'`. En konsulent som bara
 * fyllde vecka och datum sparade därmed "Går bra" utan att någon bedömt
 * det — ett påhittat värde, i precis den rad där avvikelsen är det viktiga.
 * Vakten här: inget läge är valt från början, spara utan val stoppas med
 * ett felmeddelande och onSave anropas inte, och ett gjort val följer med.
 *
 * Mutationskontroll (2026-09-08): med `status: 'good'` som startvärde faller
 * de två första testerna.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { PlaceringUppfoljningModal } from './PlaceringUppfoljningModal'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderModal() {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  const utils = render(
    <PlaceringUppfoljningModal
      open
      placementId="pl-1"
      nextWeekNumber={3}
      onSave={onSave}
      onClose={onClose}
    />
  )
  return { ...utils, onSave, onClose }
}

describe('PlaceringUppfoljningModal — läget är inte förifyllt (AS4)', () => {
  it('ingen av de tre lägesknapparna är vald när dialogen öppnas', () => {
    renderModal()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    for (const r of radios) expect(r).not.toBeChecked()
  })

  it('spara utan valt läge stoppas med felmeddelande och anropar inte onSave', async () => {
    const { onSave } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: /Spara uppföljning/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Välj hur det går på platsen')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('ett valt läge följer med i det som sparas', async () => {
    const { onSave, onClose } = renderModal()
    fireEvent.click(screen.getByLabelText('Vissa svårigheter'))
    fireEvent.click(screen.getByRole('button', { name: /Spara uppföljning/ }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0][0]).toMatchObject({
      placement_id: 'pl-1',
      week_number: 3,
      is_completed: true,
      status: 'concerns',
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('PlaceringUppfoljningModal — tillgänglighet', () => {
  it('är en riktig modal: role="dialog", aria-modal, rubrik kopplad', () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'uppf-title')
    expect(screen.getByRole('radiogroup', { name: 'Läge på platsen' })).toBeInTheDocument()
  })
})
