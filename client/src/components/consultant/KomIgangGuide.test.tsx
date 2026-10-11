/**
 * KomIgangGuide (2026-10-11) — i komponenten, med riktig steglogik:
 *   1. Under laddning visas ingenting (guiden påstår inget).
 *   2. Stegen bockas av ur datan; ett klick i guiden bockar inte av något.
 *   3. Kommun och leverantör får olika steg.
 *   4. Stängd → knappen "Så kommer du igång" → öppen igen; stängningen sparas.
 *   5. Klar → visas inte av sig själv, men går att öppna.
 *   6. Läsfel → stegen utan bockar och en rad om felet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/test/utils'
import { KomIgangGuide, KOM_IGANG_GUIDE } from './KomIgangGuide'
import type { GuideLage, KonsulentLage } from './komIgangSteg'

const myMemberships = vi.fn()
vi.mock('@/services/orgApi', () => ({ orgApi: { myMemberships: (...a: unknown[]) => myMemberships(...a) } }))

const hamta = vi.fn()
vi.mock('@/services/komIgangApi', () => ({ komIgangApi: { hamta: (...a: unknown[]) => hamta(...a) } }))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: { user: { id: string } | null }) => unknown) => sel({ user: { id: 'u1' } }),
}))

const navigera = vi.fn()
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigera,
}))

const tomt: KonsulentLage = {
  deltagare: 0, forstaDeltagare: null, planer: 0, forstaPlanDeltagare: null,
  narvaro: 0, journal: 0, underlag: 0, avvikelser: 0, placeringar: 0,
}
const konsulent = (data: Partial<KonsulentLage>): GuideLage => ({ roll: 'konsulent', data: { ...tomt, ...data } })
const medlem = (kind: string, role = 'konsulent') => [{ org_id: 'o1', role, organization: { id: 'o1', kind } }]

beforeEach(() => {
  myMemberships.mockReset()
  hamta.mockReset()
  navigera.mockReset()
  localStorage.clear()
})

const steg = (id: string) => screen.getByTestId(`kom-igang-steg-${id}`)

describe('KomIgangGuide', () => {
  it('visar ingenting medan datan hämtas', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockReturnValue(new Promise(() => {}))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await waitFor(() => expect(hamta).toHaveBeenCalled())
    expect(screen.queryByTestId('kom-igang-guide')).toBeNull()
  })

  it('bockar av ur datan: en deltagare finns men ingen journal', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({ deltagare: 1, forstaDeltagare: 'd1' }))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByTestId('kom-igang-guide')
    expect(steg('bjudIn')).toHaveAttribute('data-klar', 'ja')
    expect(steg('journal')).toHaveAttribute('data-klar', 'nej')
    expect(screen.getByText(/1 av 5 steg gjorda/)).toBeInTheDocument()
  })

  it('ett klick på stegets knapp bockar inte av det — det leder dit', async () => {
    const onBjudIn = vi.fn()
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({ deltagare: 1, forstaDeltagare: 'd1' }))
    render(<KomIgangGuide onBjudIn={onBjudIn} />)
    await screen.findByTestId('kom-igang-guide')
    await userEvent.click(screen.getByTestId('kom-igang-knapp-journal'))
    expect(navigera).toHaveBeenCalledWith('/consultant/participants/d1?flik=journal')
    expect(steg('journal')).toHaveAttribute('data-klar', 'nej')
    await userEvent.click(screen.getByTestId('kom-igang-knapp-bjudIn'))
    expect(onBjudIn).toHaveBeenCalledTimes(1)
  })

  it('kommun: underlag till handläggaren; leverantör: avvikelse och placering', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({}))
    const { unmount } = render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByTestId('kom-igang-guide')
    expect(screen.getByTestId('kom-igang-steg-underlag')).toBeInTheDocument()
    expect(screen.queryByTestId('kom-igang-steg-avvikelse')).toBeNull()
    unmount()

    myMemberships.mockResolvedValue(medlem('leverantor'))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Så kommer du igång som coach' })
    expect(screen.getByTestId('kom-igang-steg-avvikelse')).toBeInTheDocument()
    expect(screen.getByTestId('kom-igang-steg-placering')).toBeInTheDocument()
    expect(screen.queryByTestId('kom-igang-steg-underlag')).toBeNull()
  })

  it('stängs, sparas, och öppnas igen med knappen', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({}))
    const { unmount } = render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByTestId('kom-igang-guide')
    await userEvent.click(screen.getByRole('button', { name: 'Stäng guiden' }))
    expect(screen.queryByTestId('kom-igang-guide')).toBeNull()
    const oppna = screen.getByRole('button', { name: 'Så kommer du igång' })
    expect(oppna).toHaveFocus()
    expect(localStorage.getItem(`jobin-guide:${KOM_IGANG_GUIDE}:u1`)).toBe('stangd')
    unmount()

    // Ny montering: fortfarande stängd, inte automatiskt tillbaka
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByRole('button', { name: 'Så kommer du igång' })
    expect(screen.queryByTestId('kom-igang-guide')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Så kommer du igång' }))
    expect(screen.getByTestId('kom-igang-guide')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Så kommer du igång' })).toHaveFocus()
    expect(localStorage.getItem(`jobin-guide:${KOM_IGANG_GUIDE}:u1`)).toBeNull()
  })

  it('när allt är gjort visas den inte av sig själv, men går att öppna', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({ deltagare: 2, forstaDeltagare: 'd1', planer: 1, narvaro: 1, journal: 1, underlag: 1 }))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    const oppna = await screen.findByRole('button', { name: 'Så kommer du igång' })
    expect(screen.queryByTestId('kom-igang-guide')).toBeNull()
    await userEvent.click(oppna)
    expect(screen.getByText(/Allt är gjort/)).toBeInTheDocument()
  })

  it('ett läsfel påstår ingenting om stegen', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockRejectedValue(new Error('nätfel'))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByText(/Det gick inte att se vad du redan har gjort/)
    expect(steg('bjudIn')).toHaveAttribute('data-klar', 'okant')
    expect(screen.queryByText(/Gjort/)).toBeNull()
  })
})

describe('KomIgangGuide — chef', () => {
  it('chefen ser organisationens steg och kan växla till konsulentens', async () => {
    myMemberships.mockResolvedValue(medlem('kommun', 'chef'))
    hamta.mockImplementation(async (roll: string) =>
      roll === 'chef'
        ? { roll: 'chef', data: { kollegor: 0, mallar: 1, handlaggare: 0 } }
        : konsulent({ deltagare: 1, forstaDeltagare: 'd1' }))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Så kommer din organisation igång' })
    expect(steg('mall')).toHaveAttribute('data-klar', 'ja')
    expect(steg('handlaggare')).toHaveAttribute('data-klar', 'nej')
    await userEvent.click(screen.getByTestId('kom-igang-vaxla'))
    await screen.findByRole('heading', { name: 'Så kommer du igång' })
    await waitFor(() => expect(steg('bjudIn')).toHaveAttribute('data-klar', 'ja'))
  })

  it('bara nästa steg har sin förklaring framme — resten är en rad var', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({ deltagare: 1, forstaDeltagare: 'd1' }))
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    await screen.findByTestId('kom-igang-guide')
    expect(steg('plan')).toHaveTextContent(/Tillämpa schemamall/)
    expect(steg('journal')).not.toHaveTextContent(/Ny anteckning/)
  })
})

/**
 * Omtaget "Kvarter" steg 3 (2026-10-11): för en ny konsulent ÄR guiden nästa
 * steg — fylld knapp, "Nästa steg" överst. Annars står den under listan med en
 * ramad knapp, så Min dag har en enda primärknapp.
 * Motprov (kört): lås variant till 'primary' → andra fallet faller.
 */
describe('KomIgangGuide som nästa steg', () => {
  it('somNastaSteg: etiketten "Nästa steg" och en fylld knapp; annars ramad', async () => {
    myMemberships.mockResolvedValue(medlem('kommun'))
    hamta.mockResolvedValue(konsulent({}))
    const { unmount } = render(<KomIgangGuide somNastaSteg onBjudIn={vi.fn()} />)
    const guide = await screen.findByTestId('kom-igang-guide')
    expect(guide).toHaveAttribute('data-nasta-steg', 'ja')
    expect(guide).toHaveTextContent('Nästa steg')
    expect(guide.querySelectorAll('[data-variant="primary"]')).toHaveLength(1)
    unmount()
    render(<KomIgangGuide onBjudIn={vi.fn()} />)
    const under = await screen.findByTestId('kom-igang-guide')
    expect(under).toHaveAttribute('data-nasta-steg', 'nej')
    expect(under.querySelectorAll('[data-variant="primary"]')).toHaveLength(0)
  })
})
