/**
 * MeddelandenFlik — trådar ur förslag ∪ placeringar, texten om att deltagaren
 * aldrig nås, markeraLasta vid öppning, skicka som 'foretag', och att ett
 * RLS-fel vid sändning visas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ORG, forslag, pagaende } from './__tests__/fixturer'

const mock = vi.hoisted(() => ({ listaForslag: vi.fn(), listaPagaende: vi.fn() }))
const trad = vi.hoisted(() => ({ lista: vi.fn(), skicka: vi.fn(), markeraLasta: vi.fn(), antalOlasta: vi.fn() }))

vi.mock('@/services/foretagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/foretagApi')>('@/services/foretagApi')
  return { ...actual, foretagApi: { ...actual.foretagApi, ...mock } }
})
vi.mock('@/services/delningsforslagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/delningsforslagApi')>('@/services/delningsforslagApi')
  return { ...actual, foretagsTradApi: trad }
})

import { MeddelandenFlik } from './MeddelandenFlik'

const MEDD = [
  { id: 'm1', proposal_id: 'f1', sender_id: 'k1', sender_kind: 'konsulent', content: 'Hej! Passar tisdag?', is_read: false, created_at: '2026-09-11T10:00:00Z' },
  { id: 'm2', proposal_id: 'f1', sender_id: 'u1', sender_kind: 'foretag', content: 'Ja, klockan nio.', is_read: true, created_at: '2026-09-11T11:00:00Z' },
]

describe('MeddelandenFlik', () => {
  beforeEach(() => {
    ;[...Object.values(mock), ...Object.values(trad)].forEach((m) => m.mockReset())
    trad.markeraLasta.mockResolvedValue(undefined)
  })

  it('säger att meddelanden går till konsulenten, inte deltagaren', async () => {
    mock.listaForslag.mockResolvedValue([])
    mock.listaPagaende.mockResolvedValue([])
    rendera(<MeddelandenFlik org={ORG} />, '/foretag/meddelanden')
    expect(screen.getByText('Meddelanden går till konsulenten, inte till deltagaren.')).toBeInTheDocument()
    expect(await screen.findByText('Här pratar ni med konsulenten')).toBeInTheDocument()
  })

  it('trådar ur förslag OCH placeringar (utan dubblett), en tråd per förslag', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    mock.listaPagaende.mockResolvedValue([pagaende(), pagaende({ id: 'w2', proposal_id: 'f9', participant_first_name: 'Bo', participant_last_name: 'Berg' })])
    rendera(<MeddelandenFlik org={ORG} />, '/foretag/meddelanden')
    const lista = await screen.findByRole('list', { name: 'Trådar' })
    expect(lista.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getByText('Bo Berg')).toBeInTheDocument()
    expect(screen.getByText('Välj en tråd')).toBeInTheDocument()
  })

  it('?forslag= öppnar tråden, markerar läst och skickar som foretag', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    mock.listaPagaende.mockResolvedValue([])
    trad.lista.mockResolvedValue(MEDD)
    trad.skicka.mockResolvedValue({ ...MEDD[1], id: 'm3', content: 'Tack!' })
    rendera(<MeddelandenFlik org={ORG} />, '/foretag/meddelanden?forslag=f1')
    expect(await screen.findByText('Hej! Passar tisdag?')).toBeInTheDocument()
    expect(screen.getByText('Ja, klockan nio.')).toBeInTheDocument()
    await waitFor(() => expect(trad.markeraLasta).toHaveBeenCalledWith('f1'))
    expect(trad.lista).toHaveBeenCalledWith('f1')

    fireEvent.change(screen.getByLabelText('Skriv till Kim Konsulent'), { target: { value: 'Tack!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skicka' }))
    await waitFor(() => expect(trad.skicka).toHaveBeenCalledWith('f1', 'foretag', 'Tack!'))
  })

  it('ett RLS-fel vid sändning visas, sväljs inte', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    mock.listaPagaende.mockResolvedValue([])
    trad.lista.mockResolvedValue([])
    trad.skicka.mockRejectedValue({ code: '42501', message: 'new row violates row-level security policy' })
    rendera(<MeddelandenFlik org={ORG} />, '/foretag/meddelanden?forslag=f1')
    expect(await screen.findByText('Inga meddelanden än. Skriv det första.')).toBeInTheDocument()
    expect(trad.markeraLasta).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Skriv till Kim Konsulent'), { target: { value: 'Hej' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skicka' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/row-level security/)
  })
})
