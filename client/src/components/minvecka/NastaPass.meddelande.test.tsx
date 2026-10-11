/**
 * Min vecka: ett oläst meddelande från konsulenten står överst med EN knapp som
 * leder till Min konsulent (där det markeras läst). Beslut 2026-10-11.
 */
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/utils'

const navigera = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (orig) => ({ ...(await orig<typeof import('react-router-dom')>()), useNavigate: () => navigera }))

import { NastaPass } from './NastaPass'

describe('NastaPass — meddelande', () => {
  it('rubrik med konsulentens namn och antal, knappen går till Min konsulent', () => {
    render(<NastaPass steg={{ typ: 'meddelande', antal: 2 }} konsulentNamn="Kim" dagText={(d) => d} pagar={null} onCheckin={vi.fn()} onKanInte={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Du har 2 meddelanden från Kim' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Läs meddelandet' }))
    expect(navigera).toHaveBeenCalledWith('/my-consultant')
  })

  it('ett meddelande, utan känt namn', () => {
    render(<NastaPass steg={{ typ: 'meddelande', antal: 1 }} konsulentNamn={null} dagText={(d) => d} pagar={null} onCheckin={vi.fn()} onKanInte={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Du har ett meddelande från din konsulent' })).toBeInTheDocument()
  })
})
