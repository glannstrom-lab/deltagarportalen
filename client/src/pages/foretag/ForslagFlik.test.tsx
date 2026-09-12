/**
 * ForslagFlik — markeraOppnad EN gång per öppning, bara non-null fält visas,
 * rubrikraden om samtycket, svar går genom dialogen till foretagApi.svara,
 * och visningstakets fel visas i stället för att sväljas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ORG, forslag } from './__tests__/fixturer'

const mock = vi.hoisted(() => ({
  listaForslag: vi.fn(),
  markeraOppnad: vi.fn(),
  svara: vi.fn(),
}))
vi.mock('@/services/foretagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/foretagApi')>('@/services/foretagApi')
  return { ...actual, foretagApi: { ...actual.foretagApi, ...mock } }
})

import { ForslagFlik } from './ForslagFlik'

describe('ForslagFlik', () => {
  beforeEach(() => {
    Object.values(mock).forEach((m) => m.mockReset())
    mock.markeraOppnad.mockResolvedValue(undefined)
    mock.svara.mockResolvedValue(undefined)
  })

  it('tomt: invit, ingen lista över personer', async () => {
    mock.listaForslag.mockResolvedValue([])
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag')
    expect(await screen.findByText('Här landar förslag från konsulenter')).toBeInTheDocument()
    expect(mock.markeraOppnad).not.toHaveBeenCalled()
  })

  it('lista utan valt förslag räknar ingen visning', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag')
    expect(await screen.findByText('Välj ett förslag i listan')).toBeInTheDocument()
    expect(mock.markeraOppnad).not.toHaveBeenCalled()
  })

  it('?id= öppnar detaljen: markeraOppnad en gång, rubrikraden, bara delade fält', async () => {
    mock.listaForslag.mockResolvedValue([forslag({ participant_phone: null, participant_experience: null })])
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag?id=f1')
    expect(await screen.findByText(/Det här ser ni för att Anna har godkänt att just de här uppgifterna delas med er/)).toBeInTheDocument()
    expect(screen.getByText(/Ni ser aldrig en lista över personer/)).toBeInTheDocument()
    await waitFor(() => expect(mock.markeraOppnad).toHaveBeenCalledTimes(1))
    expect(mock.markeraOppnad).toHaveBeenCalledWith('f1')
    expect(screen.getByText('Anna är noggrann och vill jobba med händerna.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'anna@example.com' })).toBeInTheDocument()
    expect(screen.getByText('Borås')).toBeInTheDocument()
    expect(screen.getByText('Jag gillar ordning och reda.')).toBeInTheDocument()
    expect(screen.getByText('Truckkort')).toBeInTheDocument()
    expect(screen.queryByText('Erfarenhet')).not.toBeInTheDocument()
    expect(screen.queryByText('Utbildning')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'kim@kommun.se' })).toBeInTheDocument()
    // Klick på samma förslag igen räknar inte en ny visning
    fireEvent.click(screen.getAllByRole('button', { name: /Anna Andersson/ })[0])
    await waitFor(() => expect(mock.markeraOppnad).toHaveBeenCalledTimes(1))
  })

  it('erfarenhet och utbildning ur CV-jsonb visas — även i okänd form utan krasch', async () => {
    mock.listaForslag.mockResolvedValue([
      forslag({
        participant_experience: [{ title: 'Lagerarbetare', company: 'ICA', start_date: '2020', end_date: '2022' }, 'Sommarjobb på camping'],
        participant_education: { oväntad: 'form' },
      }),
    ])
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag?id=f1')
    expect(await screen.findByText('Lagerarbetare')).toBeInTheDocument()
    expect(screen.getByText('ICA · 2020–2022')).toBeInTheDocument()
    expect(screen.getByText('Sommarjobb på camping')).toBeInTheDocument()
    expect(screen.getByText(/format vi inte kan visa här/)).toBeInTheDocument()
  })

  it('visar databasens text när visningstaket är nått', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    mock.markeraOppnad.mockRejectedValue(new Error('Förslaget kan inte visas fler gånger'))
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag?id=f1')
    expect(await screen.findByRole('alert')).toHaveTextContent('Förslaget kan inte visas fler gånger')
  })

  it('"Vi vill gå vidare" går genom dialogen till svara(interested, meddelande)', async () => {
    mock.listaForslag.mockResolvedValue([forslag()])
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag?id=f1')
    fireEvent.click(await screen.findByRole('button', { name: 'Vi vill gå vidare' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Meddelande till Kim Konsulent/), { target: { value: 'Kan ni måndag?' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /vi vill gå vidare$/i }))
    await waitFor(() => expect(mock.svara).toHaveBeenCalledWith('f1', 'interested', 'Kan ni måndag?'))
  })

  it('ett besvarat förslag visar svaret och länken till tråden, inga svarsknappar', async () => {
    mock.listaForslag.mockResolvedValue([forslag({ employer_response: 'interested', employer_message: 'Vi ringer.', employer_responded_at: '2026-09-11T00:00:00Z' })])
    rendera(<ForslagFlik org={ORG} />, '/foretag/forslag?id=f1')
    expect(await screen.findByText('Ert meddelande: Vi ringer.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Öppna tråden med Kim Konsulent/ })).toHaveAttribute('href', '/foretag/meddelanden?forslag=f1')
    expect(screen.queryByRole('button', { name: 'Vi vill gå vidare' })).not.toBeInTheDocument()
  })
})
