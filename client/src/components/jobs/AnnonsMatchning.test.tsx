import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const hamtaMatchskal = vi.fn()
vi.mock('@/services/matchskalApi', () => ({ hamtaMatchskal: (...a: unknown[]) => hamtaMatchskal(...a) }))

import { AnnonsMatchning } from './AnnonsMatchning'

const ANNONS = { id: '1', titel: 'Lager', foretag: 'Nordfrakt', text: 'Vi söker en lagerarbetare. Truckkort A krävs. Körkort B är ett krav.' }
const rita = (a = ANNONS) => render(<MemoryRouter><AnnonsMatchning annons={a} /></MemoryRouter>)

beforeEach(() => {
  hamtaMatchskal.mockReset()
})

describe('AnnonsMatchning', () => {
  it('visar ingen knapp när annonsen saknar text', () => {
    rita({ ...ANNONS, text: 'kort' })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hämtar först vid klick och visar skäl med citat ur båda, utan procent', async () => {
    hamtaMatchskal.mockResolvedValue({
      skal: [
        { typ: 'traffar', punkt: 'Truckkort A', annons: 'Truckkort A krävs', cv: 'Truckkort A' },
        { typ: 'saknas', punkt: 'Körkort B', annons: 'Körkort B är ett krav' },
      ],
    })
    rita()
    expect(hamtaMatchskal).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /Varför passar annonsen mig/ }))
    expect(await screen.findByText('Körkort B')).toBeInTheDocument()
    expect(screen.getByText(/Så står det i ditt CV:/)).toBeInTheDocument()
    expect(screen.getAllByText(/Så står det i annonsen:/)).toHaveLength(2)
    expect(screen.getByText(/Det är inget betyg på dig/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/%/)
  })

  it('visar en invit och länk till CV:t när CV saknas', async () => {
    hamtaMatchskal.mockResolvedValue({ inteCv: true })
    rita()
    await userEvent.click(screen.getByRole('button', { name: /Varför passar annonsen mig/ }))
    expect(await screen.findByRole('link', { name: /Gå till ditt CV/ })).toHaveAttribute('href', '/cv')
  })

  it('visar felet med Försök igen', async () => {
    hamtaMatchskal.mockRejectedValue(new Error('Nu small det'))
    rita()
    await userEvent.click(screen.getByRole('button', { name: /Varför passar annonsen mig/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Nu small det')
    expect(screen.getByRole('button', { name: 'Försök igen' })).toBeInTheDocument()
  })
})
