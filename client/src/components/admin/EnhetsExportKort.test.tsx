import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { EnhetsExportKort } from './EnhetsExportKort'

const myMemberships = vi.fn()
const assurans = vi.fn()
const hamta = vi.fn()

vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: (...a: unknown[]) => myMemberships(...a) } }))
vi.mock('@/services/mfaApi', () => ({ mfaApi: { assurans: (...a: unknown[]) => assurans(...a) } }))
vi.mock('@/services/enhetsExport', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/enhetsExport')>('@/services/enhetsExport')
  return { ...faktisk, enhetsExportApi: { hamta: (...a: unknown[]) => hamta(...a) } }
})

const chef = (is_demo = false) => ({
  id: 'm1',
  org_id: 'o1',
  user_id: 'u1',
  role: 'chef',
  created_at: '',
  organization: { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', is_demo },
})
const tomData = { planer: [], pass: [], underlag: [], overforingar: [], journal: null }
const fullData = { planer: [{ id: 'p1' }], pass: [{ id: 's1' }], underlag: [], overforingar: [], journal: null }

describe('EnhetsExportKort', () => {
  beforeEach(() => {
    myMemberships.mockReset()
    assurans.mockReset()
    hamta.mockReset()
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => cleanup())

  it('visas inte för en konsulent som inte är chef eller admin', async () => {
    myMemberships.mockResolvedValue([{ ...chef(), role: 'konsulent' }])
    const { container } = render(<EnhetsExportKort />)
    await waitFor(() => expect(myMemberships).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    expect(assurans).not.toHaveBeenCalled()
  })

  it('utan aal2 är knappen avstängd och skälet står i klartext', async () => {
    myMemberships.mockResolvedValue([chef()])
    assurans.mockResolvedValue({ nuvarande: 'aal1', nasta: 'aal2' })
    render(<EnhetsExportKort />)
    const knapp = await screen.findByRole('button', { name: /Exportera enhetens data/ })
    expect(knapp).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('tvåstegsinloggning')
  })

  it('journalen frågar efter hämtning med journal: false som standard, och true först efter ikryssning', async () => {
    myMemberships.mockResolvedValue([chef()])
    assurans.mockResolvedValue({ nuvarande: 'aal2', nasta: 'aal2' })
    hamta.mockResolvedValue(fullData)
    render(<EnhetsExportKort />)
    const knapp = await screen.findByRole('button', { name: /Exportera enhetens data/ })
    fireEvent.click(knapp)
    await waitFor(() => expect(hamta).toHaveBeenCalledTimes(1))
    expect(hamta).toHaveBeenLastCalledWith('o1', { journal: false, oro: false })

    fireEvent.click(screen.getByLabelText('Ta med journalen'))
    fireEvent.click(screen.getByLabelText('Ta med orosanteckningar'))
    fireEvent.click(knapp)
    await waitFor(() => expect(hamta).toHaveBeenCalledTimes(2))
    expect(hamta).toHaveBeenLastCalledWith('o1', { journal: true, oro: true })
  })

  it('en helt tom utdragning laddas inte ned som klar — den ger ett fel', async () => {
    myMemberships.mockResolvedValue([chef()])
    assurans.mockResolvedValue({ nuvarande: 'aal2', nasta: 'aal2' })
    hamta.mockResolvedValue(tomData)
    render(<EnhetsExportKort />)
    fireEvent.click(await screen.findByRole('button', { name: /Exportera enhetens data/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ingen fil skapades')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('en demoorganisation behöver inte aal2 (samma undantag som policyn)', async () => {
    myMemberships.mockResolvedValue([chef(true)])
    assurans.mockResolvedValue({ nuvarande: 'aal1', nasta: null })
    render(<EnhetsExportKort />)
    expect(await screen.findByRole('button', { name: /Exportera enhetens data/ })).toBeEnabled()
  })

  it('en lyckad export laddar ned filen och redovisar antalen', async () => {
    myMemberships.mockResolvedValue([chef()])
    assurans.mockResolvedValue({ nuvarande: 'aal2', nasta: 'aal2' })
    hamta.mockResolvedValue(fullData)
    render(<EnhetsExportKort />)
    fireEvent.click(await screen.findByRole('button', { name: /Exportera enhetens data/ }))
    expect(await screen.findByRole('status')).toHaveTextContent('1 planer, 1 pass')
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })
})
