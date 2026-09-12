/**
 * Tidslinje (PG16/F14): tre lägen, invit vid tomt underlag, delvis fel nämns,
 * och en händelse leder till rätt sektion.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Tidslinje } from './Tidslinje'

const hamtaTidslinje = vi.fn()
vi.mock('@/services/tidslinjeApi', () => ({
  tidslinjeApi: { hamtaTidslinje: (...a: unknown[]) => hamtaTidslinje(...a) },
}))

describe('Tidslinje', () => {
  beforeEach(() => { hamtaTidslinje.mockReset() })

  it('visar en invit när det inte finns några händelser — aldrig "kommer"', async () => {
    hamtaTidslinje.mockResolvedValue({ handelser: [], misslyckadeKallor: [] })
    render(<Tidslinje participantId="p1" onGaTill={() => {}} />)
    await waitFor(() => expect(screen.getByText(/inga händelser än/i)).toBeInTheDocument())
    expect(screen.queryByText(/kommer/i)).not.toBeInTheDocument()
  })

  it('listar händelser i tidsordning med datum och leder till rätt sektion', async () => {
    hamtaTidslinje.mockResolvedValue({
      handelser: [
        { id: 'a', typ: 'journal', tidpunkt: '2026-09-12T10:00:00Z', titel: 'Anteckning', detalj: 'Ringde om praktik', sektion: 'journal' },
        { id: 'b', typ: 'pass', tidpunkt: '2026-09-11T09:00:00', titel: 'Pass: Jobbsökarverkstad', detalj: 'Närvarande', sektion: 'aktivitet' },
      ],
      misslyckadeKallor: [],
    })
    const onGaTill = vi.fn()
    render(<Tidslinje participantId="p1" onGaTill={onGaTill} />)
    const rader = await screen.findAllByRole('listitem')
    expect(rader).toHaveLength(2)
    expect(rader[0]).toHaveTextContent('Anteckning')
    expect(rader[1]).toHaveTextContent('Närvarande')
    fireEvent.click(screen.getByRole('button', { name: /Pass: Jobbsökarverkstad/ }))
    expect(onGaTill).toHaveBeenCalledWith('aktivitet')
  })

  it('nämner källor som inte gick att läsa i stället för att visa tomt', async () => {
    hamtaTidslinje.mockResolvedValue({
      handelser: [{ id: 'a', typ: 'mal', tidpunkt: '2026-09-01T08:00:00Z', titel: 'Mål satt', sektion: 'goals' }],
      misslyckadeKallor: ['mötena'],
    })
    render(<Tidslinje participantId="p1" onGaTill={() => {}} />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/mötena/))
    expect(screen.getByRole('listitem')).toHaveTextContent('Mål satt')
  })

  it('visar ett fel som fel, inte som tom tidslinje', async () => {
    hamtaTidslinje.mockRejectedValue(new Error('nej'))
    render(<Tidslinje participantId="p1" onGaTill={() => {}} />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByText(/inga händelser än/i)).not.toBeInTheDocument()
  })
})
