/**
 * PlatserFlik — tomt/laddat/fel, riktig dialog (role="dialog", Esc stänger),
 * ledtexten, att skapa går till foretagApi.skapaPlats, och att ta bort går
 * genom bekräftelsedialogen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ORG, plats } from './__tests__/fixturer'

const mock = vi.hoisted(() => ({
  listaPlatser: vi.fn(),
  skapaPlats: vi.fn(),
  uppdateraPlats: vi.fn(),
  raderaPlats: vi.fn(),
}))
vi.mock('@/services/foretagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/foretagApi')>('@/services/foretagApi')
  return { ...actual, foretagApi: { ...actual.foretagApi, ...mock } }
})

import { PlatserFlik } from './PlatserFlik'

describe('PlatserFlik', () => {
  beforeEach(() => Object.values(mock).forEach((m) => m.mockReset()))

  it('tomt: invit via EmptyState, ingen nolla', async () => {
    mock.listaPlatser.mockResolvedValue([])
    rendera(<PlatserFlik org={ORG} />)
    expect(await screen.findByText('Berätta vad ni kan erbjuda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lägg till första platsen' })).toBeInTheDocument()
  })

  it('fel visas som fel', async () => {
    mock.listaPlatser.mockRejectedValue(new Error('nekad'))
    rendera(<PlatserFlik org={ORG} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('nekad')
  })

  it('laddat: rubrik, insatstyp, status-chip och handledning', async () => {
    mock.listaPlatser.mockResolvedValue([plats(), plats({ id: 'p2', title: 'Kök', status: 'pausad', placement_type: 'arbetstraning', workplace_supervision_capacity: null, supervision_notes: null })])
    rendera(<PlatserFlik org={ORG} />)
    expect(await screen.findByText('Lagerarbete, förmiddagar')).toBeInTheDocument()
    expect(screen.getByText('Öppen')).toBeInTheDocument()
    expect(screen.getByText('Pausad')).toBeInTheDocument()
    expect(screen.getByText('Arbetsträning')).toBeInTheDocument()
    expect(screen.getByText(/Hög — Lisa går bredvid första veckan/)).toBeInTheDocument()
  })

  it('formuläret är en riktig dialog med ledtexten, och Escape stänger', async () => {
    mock.listaPlatser.mockResolvedValue([])
    rendera(<PlatserFlik org={ORG} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Lägg till en plats' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText('Ni fyller i vad platsen kräver och vad ni kan ge — inte vem ni söker.')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Handledning ni kan ge')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Telefon för sjukanmälan')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('?ny=1 öppnar formuläret direkt', async () => {
    mock.listaPlatser.mockResolvedValue([])
    rendera(<PlatserFlik org={ORG} />, '/foretag/platser?ny=1')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('skapa: tom rubrik stoppas lokalt, ifylld går till skapaPlats', async () => {
    mock.listaPlatser.mockResolvedValue([])
    mock.skapaPlats.mockResolvedValue(plats())
    rendera(<PlatserFlik org={ORG} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Lägg till en plats' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lägg till platsen' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/rubrik/)
    expect(mock.skapaPlats).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Rubrik *'), { target: { value: 'Kök, kvällar' } })
    fireEvent.change(within(dialog).getByLabelText('Handledning ni kan ge'), { target: { value: 'mellan' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lägg till platsen' }))
    await waitFor(() => expect(mock.skapaPlats).toHaveBeenCalledTimes(1))
    const [orgId, input] = mock.skapaPlats.mock.calls[0]
    expect(orgId).toBe('org1')
    expect(input).toMatchObject({ title: 'Kök, kvällar', placement_type: 'praktik', workplace_supervision_capacity: 'mellan', status: 'oppen' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('ta bort går genom bekräftelsedialogen innan raderaPlats', async () => {
    mock.listaPlatser.mockResolvedValue([plats()])
    mock.raderaPlats.mockResolvedValue(undefined)
    rendera(<PlatserFlik org={ORG} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ta bort' }))
    const bekrafta = await screen.findByRole('dialog')
    expect(mock.raderaPlats).not.toHaveBeenCalled()
    fireEvent.click(within(bekrafta).getByRole('button', { name: 'Ta bort' }))
    await waitFor(() => expect(mock.raderaPlats).toHaveBeenCalledWith('p1'))
  })
})
