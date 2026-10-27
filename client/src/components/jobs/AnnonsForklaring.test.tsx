import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const forklaraAnnons = vi.fn()
vi.mock('@/services/ansokanAiApi', () => ({
  forklaraAnnons: (...a: unknown[]) => forklaraAnnons(...a),
  lasCachadForklaring: () => null,
}))

import { AnnonsForklaring } from './AnnonsForklaring'

const ANNONS = { id: '1', titel: 'Lager', foretag: 'Nordfrakt', text: 'Vi söker en lagerarbetare. Körkort B är ett krav. Truckkort är meriterande.' }

beforeEach(() => forklaraAnnons.mockReset())

describe('AnnonsForklaring', () => {
  it('visar ingen knapp när annonsen saknar text', () => {
    render(<AnnonsForklaring annons={{ ...ANNONS, text: 'kort' }} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hämtar först när man klickar, och visar krav med citat och ansvarsraden', async () => {
    forklaraAnnons.mockResolvedValue({
      uppgifter: [{ punkt: 'Plocka varor', citat: 'plock' }],
      krav: [
        { typ: 'hart', punkt: 'Körkort B', citat: 'Körkort B är ett krav' },
        { typ: 'onskemal', punkt: 'Truckkort', citat: 'Truckkort är meriterande' },
        { typ: 'oklart', punkt: 'Svenska', citat: 'god svenska' },
      ],
      ord: [{ ord: 'WMS', betydelse: 'Lagersystem' }],
    })
    render(<AnnonsForklaring annons={ANNONS} />)
    expect(forklaraAnnons).not.toHaveBeenCalled()
    const knapp = screen.getByRole('button', { name: /Förklara annonsen/ })
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(knapp)
    expect(await screen.findByText('Körkort B')).toBeInTheDocument()
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Förenklat av AI, originalet gäller\./)).toBeInTheDocument()
    expect(screen.getByText(/“Körkort B är ett krav”/)).toBeInTheDocument()
    // Typen står som text, inte bara som färg.
    expect(screen.getByText('Krav')).toBeInTheDocument()
    expect(screen.getByText('Önskemål')).toBeInTheDocument()
    expect(screen.getByText('Annonsen säger inte om det är ett krav')).toBeInTheDocument()
    expect(screen.getByText('WMS')).toBeInTheDocument()
    expect(forklaraAnnons).toHaveBeenCalledTimes(1)
    expect(forklaraAnnons.mock.calls[0][0]).toMatchObject({ id: '1', titel: 'Lager', foretag: 'Nordfrakt' })
  })

  it('ett tomt svar säger att inget kunde pekas ut och hittar inte på något', async () => {
    forklaraAnnons.mockResolvedValue({ uppgifter: [], krav: [], ord: [] })
    render(<AnnonsForklaring annons={ANNONS} />)
    await userEvent.click(screen.getByRole('button', { name: /Förklara annonsen/ }))
    expect(await screen.findByText(/inget i texten som vi kunde peka ut/)).toBeInTheDocument()
  })

  it('ett fel visas som alert med möjlighet att försöka igen', async () => {
    forklaraAnnons.mockRejectedValueOnce(new Error('AI är pausad'))
    render(<AnnonsForklaring annons={ANNONS} />)
    await userEvent.click(screen.getByRole('button', { name: /Förklara annonsen/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('AI är pausad')
    forklaraAnnons.mockResolvedValueOnce({ uppgifter: [], krav: [{ typ: 'hart', punkt: 'Körkort B', citat: 'Körkort B är ett krav' }], ord: [] })
    await userEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    await waitFor(() => expect(screen.getByText('Körkort B')).toBeInTheDocument())
  })
})
