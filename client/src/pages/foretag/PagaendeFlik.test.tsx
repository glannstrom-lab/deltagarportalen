/**
 * PagaendeFlik — tomt/laddat/fel, vecka X av Y, sjukanmälan och upptrappning,
 * tidigare avstämningar, och att avstämningsformuläret går till skapaAvstamning
 * med vecka 12/24.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ORG, avstamning, pagaende } from './__tests__/fixturer'

const mock = vi.hoisted(() => ({
  listaPagaende: vi.fn(),
  listaAvstamningar: vi.fn(),
  skapaAvstamning: vi.fn(),
}))
vi.mock('@/services/foretagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/foretagApi')>('@/services/foretagApi')
  return { ...actual, foretagApi: { ...actual.foretagApi, ...mock } }
})

import { PagaendeFlik } from './PagaendeFlik'

describe('PagaendeFlik', () => {
  beforeEach(() => {
    Object.values(mock).forEach((m) => m.mockReset())
    mock.listaAvstamningar.mockResolvedValue([])
  })

  it('tomt: invit, aldrig "0 placeringar"', async () => {
    mock.listaPagaende.mockResolvedValue([])
    rendera(<PagaendeFlik org={ORG} />, '/foretag/pagaende')
    expect(await screen.findByText('Här följer ni dem som är hos er')).toBeInTheDocument()
    expect(screen.queryByText(/0 placeringar/)).not.toBeInTheDocument()
  })

  it('fel visas som fel', async () => {
    mock.listaPagaende.mockRejectedValue(new Error('nekad'))
    rendera(<PagaendeFlik org={ORG} />, '/foretag/pagaende')
    expect(await screen.findByRole('alert')).toHaveTextContent('nekad')
  })

  it('laddat: vecka X av Y, konsulent, sjukanmälan, instruktioner, upptrappning, tidigare avstämning', async () => {
    mock.listaPagaende.mockResolvedValue([pagaende()])
    mock.listaAvstamningar.mockResolvedValue([avstamning()])
    rendera(<PagaendeFlik org={ORG} />, '/foretag/pagaende')
    expect(await screen.findByRole('heading', { name: 'Anna Andersson' })).toBeInTheDocument()
    expect(screen.getByText(/Arbetsträning · vecka \d+ av 12/)).toBeInTheDocument()
    expect(screen.getByText('Kim Konsulent')).toBeInTheDocument()
    expect(screen.getByText('033-123 45 67 · Ring före 07.00.')).toBeInTheDocument()
    expect(screen.getByText('Korta, tydliga instruktioner. En sak i taget.')).toBeInTheDocument()
    expect(screen.getByText('Börja 2 dagar, öka till 3 efter fyra veckor.')).toBeInTheDocument()
    expect(screen.getByText(/Vecka 12 ·/)).toBeInTheDocument()
    expect(screen.getByText('Kommer i tid, trivs.')).toBeInTheDocument()
    expect(screen.getByText('Ja, vi vill fortsätta')).toBeInTheDocument()
  })

  it('utan sjukanmälan: säger det, hittar inte på ett nummer', async () => {
    mock.listaPagaende.mockResolvedValue([pagaende({ sick_call_phone: null, sick_call_instructions: null })])
    rendera(<PagaendeFlik org={ORG} />, '/foretag/pagaende')
    expect(await screen.findByText(/Inte överenskommet än/)).toBeInTheDocument()
  })

  it('avstämningen går till skapaAvstamning med vecka 24 och author via API:t', async () => {
    mock.listaPagaende.mockResolvedValue([pagaende()])
    mock.skapaAvstamning.mockResolvedValue(avstamning({ milestone_week: 24 }))
    rendera(<PagaendeFlik org={ORG} />, '/foretag/pagaende')
    fireEvent.click(await screen.findByRole('button', { name: 'Gör en avstämning' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skicka avstämningen' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/åtminstone en rad/)
    expect(mock.skapaAvstamning).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByLabelText('Vecka 24'))
    fireEvent.change(within(dialog).getByLabelText('Vad går bra?'), { target: { value: 'Allt' } })
    fireEvent.change(within(dialog).getByLabelText('Vill ni fortsätta?'), { target: { value: 'kanske' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skicka avstämningen' }))
    await waitFor(() => expect(mock.skapaAvstamning).toHaveBeenCalledWith({
      placement_id: 'w1', org_id: 'org1', milestone_week: 24, going_well: 'Allt', concerns: '', continue_interest: 'kanske',
    }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('?avstamning=<id> öppnar formuläret direkt', async () => {
    mock.listaPagaende.mockResolvedValue([pagaende()])
    rendera(<PagaendeFlik org={ORG} />, '/foretag/pagaende?avstamning=w1')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Avstämning om Anna Andersson' })).toBeInTheDocument()
  })
})
