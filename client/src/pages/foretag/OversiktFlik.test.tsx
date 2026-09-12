/**
 * OversiktFlik — tre lägen per kort, inviter i stället för nollor, och att
 * "Tacka nej" går genom dialogen till foretagApi.svara med declined.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ORG, forslag, pagaende, plats } from './__tests__/fixturer'

const mock = vi.hoisted(() => ({
  listaForslag: vi.fn(),
  listaPlatser: vi.fn(),
  listaPagaende: vi.fn(),
  svara: vi.fn(),
}))
vi.mock('@/services/foretagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/foretagApi')>('@/services/foretagApi')
  return { ...actual, foretagApi: { ...actual.foretagApi, ...mock } }
})

import { OversiktFlik } from './OversiktFlik'

describe('OversiktFlik', () => {
  beforeEach(() => {
    Object.values(mock).forEach((m) => m.mockReset())
    mock.svara.mockResolvedValue(undefined)
  })

  it('tomt: tre inviter, ingen nolla, hälsar på företagsnamnet', async () => {
    mock.listaForslag.mockResolvedValue([])
    mock.listaPlatser.mockResolvedValue([])
    mock.listaPagaende.mockResolvedValue([])
    rendera(<OversiktFlik org={ORG} />)
    expect(screen.getByRole('heading', { name: 'Hej Glänne & Söner' })).toBeInTheDocument()
    expect(await screen.findByText('Inget väntar på svar just nu.')).toBeInTheDocument()
    expect(screen.getByText('Här landar förslag från konsulenter')).toBeInTheDocument()
    expect(screen.getByText('Berätta vad ni kan erbjuda')).toBeInTheDocument()
    expect(screen.getByText('Här följer ni dem som är hos er')).toBeInTheDocument()
    expect(screen.queryByText(/^0 /)).not.toBeInTheDocument()
  })

  it('laddar: påstår inget om företaget innan svaren är inne', () => {
    mock.listaForslag.mockReturnValue(new Promise(() => {}))
    mock.listaPlatser.mockReturnValue(new Promise(() => {}))
    mock.listaPagaende.mockReturnValue(new Promise(() => {}))
    rendera(<OversiktFlik org={ORG} />)
    expect(screen.queryByText(/inget väntar/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/här landar förslag/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/hämtar/i).length).toBeGreaterThanOrEqual(3)
  })

  it('fel ser ut som fel, inte som tomt', async () => {
    mock.listaForslag.mockRejectedValue(new Error('RLS nekade'))
    mock.listaPlatser.mockResolvedValue([])
    mock.listaPagaende.mockResolvedValue([])
    rendera(<OversiktFlik org={ORG} />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('RLS nekade')
    expect(screen.queryByText('Här landar förslag från konsulenter')).not.toBeInTheDocument()
  })

  it('laddat: väntande förslag, plats med status-chip, placering med vecka X av Y', async () => {
    mock.listaForslag.mockResolvedValue([forslag(), forslag({ id: 'f2', employer_response: 'interested' })])
    mock.listaPlatser.mockResolvedValue([plats()])
    mock.listaPagaende.mockResolvedValue([pagaende()])
    rendera(<OversiktFlik org={ORG} />)
    expect(await screen.findByText(/Ett förslag väntar på ert svar/)).toBeInTheDocument()
    expect(screen.getByText(/Praktik · Föreslagen av Kim Konsulent/)).toBeInTheDocument()
    expect(screen.getByText(/Anna Andersson har godkänt att presenteras för er/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Läs presentationen' })).toBeInTheDocument()
    expect(screen.getByText('Öppen')).toBeInTheDocument()
    expect(screen.getByText(/20 h\/vecka, lyft, stående, handledning: hög/)).toBeInTheDocument()
    expect(screen.getByText(/vecka \d+ av 12/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skriv till Kim Konsulent' })).toBeInTheDocument()
  })

  it('"Tacka nej" öppnar dialogen och skickar declined med meddelandet', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    mock.listaPlatser.mockResolvedValue([])
    mock.listaPagaende.mockResolvedValue([])
    rendera(<OversiktFlik org={ORG} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tacka nej' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText(/ses bara av konsulenten, inte av Anna/)).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText(/Meddelande till Kim Konsulent/), { target: { value: 'Passar inte just nu' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /vi tackar nej/i }))
    await waitFor(() => expect(mock.svara).toHaveBeenCalledWith('f1', 'declined', 'Passar inte just nu'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
