import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const foresla = vi.fn()
vi.mock('@/services/vardagApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/vardagApi')>('@/services/vardagApi')
  return { ...faktisk, foreslaFranVardag: (...a: unknown[]) => foresla(...a) }
})
const orgSparr = vi.fn()
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => orgSparr() }))

import { VadHarJagMedMig } from './VadHarJagMedMig'

const FORSLAG = {
  titel: 'Trädgårdshjälp åt granne',
  organisation: '',
  beskrivning: 'Hjälpte en granne med trädgården.',
  citat: 'Jag hjälpte grannen med trädgården',
}

async function skrivOchHitta(onAdd = vi.fn()) {
  render(<VadHarJagMedMig onAdd={onAdd} />)
  await userEvent.click(screen.getByText(/Vad har jag med mig/))
  const falt = screen.getAllByRole('textbox')[0]
  await userEvent.type(falt, 'Jag hjälpte grannen med trädgården')
  await userEvent.click(screen.getByRole('button', { name: /Hitta förslag/ }))
  return onAdd
}

describe('VadHarJagMedMig', () => {
  beforeEach(() => {
    foresla.mockReset()
    orgSparr.mockReset()
    orgSparr.mockReturnValue(null)
  })

  it('visas inte alls när organisationen stängt av AI', () => {
    orgSparr.mockReturnValue({ org_name: 'Kommunen' })
    const { container } = render(<VadHarJagMedMig onAdd={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('knappen är avstängd tills något är skrivet', () => {
    render(<VadHarJagMedMig onAdd={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Hitta förslag/ })).toBeDisabled()
  })

  it('visar personens egen mening som citat bredvid varje förslag', async () => {
    foresla.mockResolvedValue({ typ: 'forslag', forslag: [FORSLAG] })
    await skrivOchHitta()
    expect(await screen.findByText('Trädgårdshjälp åt granne')).toBeInTheDocument()
    expect(document.querySelector('q')).toHaveTextContent('Jag hjälpte grannen med trädgården')
    expect(screen.getByText(/Du skrev:/)).toBeInTheDocument()
  })

  it('lägger INTE till något i CV:t förrän personen klickat på raden', async () => {
    foresla.mockResolvedValue({ typ: 'forslag', forslag: [FORSLAG] })
    const onAdd = await skrivOchHitta()
    await screen.findByText('Trädgårdshjälp åt granne')
    expect(onAdd).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Lägg till i mitt CV' }))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      title: 'Trädgårdshjälp åt granne',
      company: '',
      description: 'Hjälpte en granne med trädgården.',
      startDate: '',
    })
    // En rad läggs till en gång; knappen byts mot en bekräftelse.
    expect(screen.queryByRole('button', { name: 'Lägg till i mitt CV' })).not.toBeInTheDocument()
    expect(screen.getByText(/Tillagd under Arbetslivserfarenhet/)).toBeInTheDocument()
  })

  it('förklarar varför när svaren nämner hälsa, och lägger inget till', async () => {
    foresla.mockResolvedValue({ typ: 'halsa', ord: ['sjuk'] })
    const onAdd = await skrivOchHitta()
    expect(await screen.findByText(/verkar handla om hälsa/)).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('säger det rakt när inget kunde föreslås, utan en nolla', async () => {
    foresla.mockResolvedValue({ typ: 'forslag', forslag: [] })
    await skrivOchHitta()
    expect(await screen.findByText(/Vi hittade inga rader att föreslå/)).toBeInTheDocument()
  })

  it('visar ett vänligt fel och behåller det som skrivits', async () => {
    foresla.mockRejectedValue(new Error('nere'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await skrivOchHitta()
    expect(await screen.findByRole('alert')).toHaveTextContent(/Det du skrivit finns kvar/)
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('Jag hjälpte grannen med trädgården')
  })
})
