/**
 * Delningsforslag — deltagarens svar på konsulentens delningsförslag (AG5/AG8).
 *
 * Det som vaktas här är det som kostar om det glider:
 *   - bara de fält som är TRUE listas som "det företaget får se" (opt-in per fält);
 *   - "Ja, dela" och "Nej tack" går genom delningsforslagApi.svara med rätt beslut
 *     och meddelande — inte via någon egen UPDATE;
 *   - "Sluta dela" går via ConfirmDialog, aldrig window.confirm;
 *   - tom lista renderar ingenting, fel visas ärligt.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { render } from '@/test/utils'
import { Delningsforslag } from './Delningsforslag'
import type { DelningsforslagMedPlats } from '@/services/delningsforslagApi'

const confirmMock = vi.fn(async (_alternativ?: unknown) => true)

vi.mock('@/services/delningsforslagApi', () => ({
  delningsforslagApi: { listaMina: vi.fn(), svara: vi.fn(async () => undefined) },
  DELNINGSFALT: ['show_contact', 'show_summary', 'show_skills', 'show_experience', 'show_education'],
}))
vi.mock('@/services/konsulentMeddelandeApi', () => ({
  konsulentMeddelandeApi: { minKonsulent: vi.fn(async () => ({ id: 'k1', namn: 'Karin Berg' })) },
}))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: confirmMock }) }))

function forslag(o: Partial<DelningsforslagMedPlats> = {}): DelningsforslagMedPlats {
  return {
    id: 'p1', placement_id: 'pl1', participant_id: 'd1', consultant_id: 'k1', company_account_id: 'org1',
    show_contact: false, show_summary: true, show_skills: true, show_experience: false, show_education: false, show_documents: false,
    presentation_text: 'Anna är noggrann och gillar att jobba med händerna.',
    status: 'pending', participant_message: null, decided_at: null,
    expires_at: '2026-10-01T00:00:00Z', max_views: null, view_count: 0, last_viewed_at: null,
    employer_response: 'pending', employer_message: null, employer_responded_at: null,
    created_at: '2026-09-13T08:00:00Z', updated_at: '2026-09-13T08:00:00Z',
    consultant_work_placements: {
      company_name: 'Bilverkstan AB', occupation: 'Lagerarbetare', placement_type: 'praktik',
      start_date: '2026-10-05', end_date: '2026-11-01', hours_per_week: 20, schedule_days: 'mån–ons',
    },
    ...o,
  }
}

async function api() {
  return (await import('@/services/delningsforslagApi')).delningsforslagApi
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 13, 10, 0, 0))
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('Delningsforslag', () => {
  it('renderar ingenting när det aldrig funnits förslag', async () => {
    vi.mocked((await api()).listaMina).mockResolvedValue([])
    const { container } = render(<Delningsforslag />)
    await waitFor(() => expect((container.textContent ?? '')).toBe(''))
    expect(screen.queryByTestId('delningsforslag')).toBeNull()
  })

  it('visar ett ärligt fel när hämtningen går sönder', async () => {
    vi.mocked((await api()).listaMina).mockRejectedValue(new Error('boom'))
    render(<Delningsforslag />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Vi kunde inte hämta dina förfrågningar')
  })

  it('pending-kortet listar bara de fält som är true, plus namnet', async () => {
    vi.mocked((await api()).listaMina).mockResolvedValue([forslag()])
    render(<Delningsforslag />)
    expect(await screen.findByText('Karin Berg vill föreslå dig för Lagerarbetare hos Bilverkstan AB')).toBeInTheDocument()
    expect(screen.getByText('Ditt namn (visas alltid)')).toBeInTheDocument()
    expect(screen.getByText('Din sammanfattning ur CV:t')).toBeInTheDocument()
    expect(screen.getByText('Dina kompetenser')).toBeInTheDocument()
    expect(screen.queryByText('Dina kontaktuppgifter')).toBeNull()
    expect(screen.queryByText('Din arbetslivserfarenhet')).toBeNull()
    expect(screen.queryByText('Din utbildning')).toBeNull()
    expect(screen.getByText(/Det här ser företaget aldrig/)).toBeInTheDocument()
    expect(screen.getByText('Anna är noggrann och gillar att jobba med händerna.')).toBeInTheDocument()
    expect(screen.getByText('Praktik')).toBeInTheDocument()
    expect(screen.getByText(/Frågan gäller till/)).toBeInTheDocument()
  })

  it('"Ja, dela" anropar svara(id, accepted) och bekräftar lugnt', async () => {
    const a = await api()
    vi.mocked(a.listaMina).mockResolvedValue([forslag()])
    render(<Delningsforslag />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ja, dela' }))
    await waitFor(() => expect(a.svara).toHaveBeenCalledWith('p1', 'accepted', undefined))
    expect(await screen.findByRole('status')).toHaveTextContent('Karin Berg kan nu visa förslaget för Bilverkstan AB')
    // Kortet är besvarat: det ligger nu under "Det du delat", inte som en fråga
    expect(screen.queryByRole('button', { name: 'Ja, dela' })).toBeNull()
    expect(screen.getByText('Det du delat')).toBeInTheDocument()
    expect(screen.getByText('Väntar på företaget')).toBeInTheDocument()
  })

  it('"Nej tack" med meddelande anropar svara(id, declined, text)', async () => {
    const a = await api()
    vi.mocked(a.listaMina).mockResolvedValue([forslag()])
    render(<Delningsforslag />)
    const ruta = await screen.findByLabelText(/Vill du skriva något till Karin Berg/)
    fireEvent.change(ruta, { target: { value: 'Jag vill vänta lite till.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nej tack' }))
    await waitFor(() => expect(a.svara).toHaveBeenCalledWith('p1', 'declined', 'Jag vill vänta lite till.'))
    expect(await screen.findByRole('status')).toHaveTextContent('Du sa nej, och det är helt okej')
  })

  it('visar databasens fel i kortet när svaret nekas', async () => {
    const a = await api()
    vi.mocked(a.listaMina).mockResolvedValue([forslag()])
    vi.mocked(a.svara).mockRejectedValueOnce(new Error('Förslaget har gått ut'))
    render(<Delningsforslag />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ja, dela' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Förslaget har gått ut')
    expect(screen.getByRole('button', { name: 'Ja, dela' })).toBeEnabled()
  })

  it('accepterade förslag: företagets status, mild ton vid nej, och "Sluta dela" via ConfirmDialog', async () => {
    const a = await api()
    vi.mocked(a.listaMina).mockResolvedValue([
      forslag({ id: 'p2', status: 'accepted', decided_at: '2026-09-10T09:00:00Z', employer_response: 'declined' }),
    ])
    render(<Delningsforslag />)
    expect(await screen.findByText('Det du delat')).toBeInTheDocument()
    expect(screen.getByText('Inga nya förfrågningar just nu.')).toBeInTheDocument()
    expect(screen.getByText('Företaget tackade nej')).toBeInTheDocument()
    expect(screen.getByText(/Det betyder inte något om dig/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sluta dela' }))
    await waitFor(() => expect(confirmMock).toHaveBeenCalledTimes(1))
    expect(confirmMock.mock.calls[0][0]).toMatchObject({ title: 'Sluta dela med Bilverkstan AB?', variant: 'warning' })
    await waitFor(() => expect(a.svara).toHaveBeenCalledWith('p2', 'withdrawn'))
    expect(await screen.findByRole('status')).toHaveTextContent('Du delar inte längre med Bilverkstan AB')
  })

  it('avbrutet ConfirmDialog skriver ingenting', async () => {
    const a = await api()
    confirmMock.mockResolvedValueOnce(false)
    vi.mocked(a.listaMina).mockResolvedValue([forslag({ id: 'p2', status: 'accepted', decided_at: '2026-09-10T09:00:00Z' })])
    render(<Delningsforslag />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sluta dela' }))
    await waitFor(() => expect(confirmMock).toHaveBeenCalled())
    expect(a.svara).not.toHaveBeenCalled()
    expect(screen.getByText('Väntar på företaget')).toBeInTheDocument()
  })

  it('historik utan nya frågor: kort rad + hopfälld lista, och ett utgånget pending visas som utgånget', async () => {
    vi.mocked((await api()).listaMina).mockResolvedValue([
      forslag({ id: 'p3', status: 'declined', decided_at: '2026-09-01T09:00:00Z' }),
      forslag({ id: 'p4', status: 'pending', expires_at: '2026-09-01T00:00:00Z' }),
    ])
    render(<Delningsforslag />)
    expect(await screen.findByText('Inga nya förfrågningar just nu.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ja, dela' })).toBeNull()
    const knapp = screen.getByRole('button', { name: /Tidigare förfrågningar \(2\)/ })
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Du sa nej/)).toBeNull()
    fireEvent.click(knapp)
    expect(screen.getByText(/Du sa nej/)).toBeInTheDocument()
    expect(screen.getByText(/Gick ut utan svar/)).toBeInTheDocument()
  })

  it('säger "din konsulent" när ingen koppling finns längre', async () => {
    const { konsulentMeddelandeApi } = await import('@/services/konsulentMeddelandeApi')
    vi.mocked(konsulentMeddelandeApi.minKonsulent).mockResolvedValueOnce(null)
    vi.mocked((await api()).listaMina).mockResolvedValue([forslag({ consultant_work_placements: { ...forslag().consultant_work_placements!, occupation: null } })])
    render(<Delningsforslag />)
    expect(await screen.findByText('din konsulent vill föreslå dig för en plats hos Bilverkstan AB')).toBeInTheDocument()
  })
})
