import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const forklaraBrev = vi.fn()
const delaUppgift = vi.fn()
vi.mock('@/services/sprakStodApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/sprakStodApi')>('@/services/sprakStodApi')
  return {
    ...faktisk,
    forklaraBrev: (...a: unknown[]) => forklaraBrev(...a),
    delaUppgift: (...a: unknown[]) => delaUppgift(...a),
  }
})
const orgSparr = vi.fn()
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => orgSparr() }))

import { SprakStod } from './SprakStod'
import { BrevAvvisatError } from '@/services/sprakStodApi'
import { GOR_MINDRE_NYCKEL, lasListor, sparaLista } from '@/services/gorDetMindreLista'

beforeEach(() => {
  forklaraBrev.mockReset()
  delaUppgift.mockReset()
  orgSparr.mockReturnValue(null)
  localStorage.clear()
})

describe('SprakStod', () => {
  it('visas inte alls när organisationen stängt av AI', () => {
    orgSparr.mockReturnValue({ org_name: 'Kommunen' })
    const { container } = render(<SprakStod />)
    expect(container).toBeEmptyDOMElement()
  })

  it('förklarar ett brev med citat under varje punkt och ansvarsraden', async () => {
    forklaraBrev.mockResolvedValue({
      avsandare: 'Arbetsförmedlingen',
      vad: 'Du är kallad till ett samtal.',
      gor: [{ steg: 'Gå till samtalet', citat: 'Du är kallad' }],
      senast: [{ sak: 'Samtalet', datum: '12 november 2026', citat: 'den 12 november 2026' }],
      vem: [],
    })
    render(<SprakStod />)
    await userEvent.type(screen.getByLabelText('Texten från brevet'), 'Du är kallad till ett samtal den 12 november 2026.')
    await userEvent.click(screen.getByRole('button', { name: 'Förklara brevet' }))
    expect(await screen.findByText('Gå till samtalet')).toBeInTheDocument()
    expect(screen.getByText(/“Du är kallad”/)).toBeInTheDocument()
    expect(screen.getByText('12 november 2026')).toBeInTheDocument()
    expect(screen.getByText(/Förenklat av AI, brevet gäller/)).toBeInTheDocument()
    // Tom sektion: en förklaring, inte en nolla.
    expect(screen.getByText(/Brevet anger ingen kontakt/)).toBeInTheDocument()
  })

  it('knappen är avstängd för en alltför kort text', () => {
    render(<SprakStod />)
    expect(screen.getByRole('button', { name: 'Förklara brevet' })).toBeDisabled()
  })

  it('visar en vänlig avvisning för läkarintyg', async () => {
    forklaraBrev.mockRejectedValue(new BrevAvvisatError())
    render(<SprakStod />)
    await userEvent.type(screen.getByLabelText('Texten från brevet'), 'Läkarintyg: patienten är sjukskriven.')
    await userEvent.click(screen.getByRole('button', { name: 'Förklara brevet' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/läkarintyg eller en journaltext/)
  })

  it('delar upp en uppgift, sparar den och bockrutan överlever omladdning', async () => {
    delaUppgift.mockResolvedValue(['Hitta telefonen', 'Skriv ner frågan', 'Ring numret på brevet'])
    const { unmount } = render(<SprakStod />)
    await userEvent.type(screen.getByLabelText('Vad känns för stort just nu?'), 'Jag måste ringa AF')
    await userEvent.click(screen.getByRole('button', { name: 'Dela upp det' }))
    expect(await screen.findByText(/ett förslag från AI, inte ett krav/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Spara som lista med bockrutor' }))
    const ruta = await screen.findByRole('checkbox', { name: 'Hitta telefonen' })
    expect(ruta).not.toBeChecked()
    await userEvent.click(ruta)
    await waitFor(() => expect(lasListor()[0].steg[0].klar).toBe(true))
    unmount()
    render(<SprakStod />)
    expect(screen.getByRole('checkbox', { name: 'Hitta telefonen' })).toBeChecked()
  })

  it('en tom lista visar en inbjudan, inte en nolla, och en sparad lista går att ta bort', async () => {
    sparaLista('Ringa AF', ['Hitta telefonen', 'Skriv ner frågan'])
    render(<SprakStod />)
    expect(screen.queryByText('Här hamnar de listor du sparar.')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Ta bort listan' }))
    expect(screen.getByText('Här hamnar de listor du sparar.')).toBeInTheDocument()
    expect(lasListor()).toEqual([])
  })

  it('listorna ligger kvar bara lokalt och rensas av utloggningslistan', async () => {
    const { USER_SCOPED_STORAGE_KEYS } = await import('@/utils/safeStorage')
    expect(USER_SCOPED_STORAGE_KEYS).toContain(GOR_MINDRE_NYCKEL)
  })
})
