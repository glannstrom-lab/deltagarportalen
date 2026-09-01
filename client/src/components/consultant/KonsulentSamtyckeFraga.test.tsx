/**
 * KS3 — efterhandsfrågan om konsulentkopplingen.
 *
 * Testerna är skrivna för att kunna FALLA. Två av dem är mutationsprövade:
 * tas kravet på båda kryssrutorna bort faller "Ja är låst tills båda är i-kryssade",
 * och skickas texten inte med i RPC-anropet faller "samtyckestexten sparas".
 *
 * Det senare är inte en formalitet: ett samtycke utan sin text är ingen bevisning
 * enligt art. 7.1, bara en tidsstämpel som påstår något. RPC:n avvisar tom text —
 * det här testet vaktar att klienten inte skickar den.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

let profilMock: Record<string, unknown> | null = null
const rpcMock = vi.fn(async (_namn: string, _args?: Record<string, unknown>) => ({
  data: 'consent-id',
  error: null as { message: string } | null,
}))
const getActiveMock = vi.fn(async (_konsulentId: string) => null as { id: string } | null)
const revokeMock = vi.fn(async (_konsulentId: string, _skal?: string) => ({
  success: true,
  cancelled_enrollments: 0,
  drafts_deleted: 0,
  consents_revoked: 0,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (namn: string, args?: Record<string, unknown>) => rpcMock(namn, args),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector?: (s: { profile: unknown }) => unknown) => {
      const state = { profile: profilMock }
      return selector ? selector(state) : state
    },
    { getState: () => ({ profile: profilMock }) }
  ),
}))

vi.mock('@/services/staApi', () => ({
  consultantConsentsApi: { getActive: (id: string) => getActiveMock(id) },
  staEnrollmentsApi: { revokeConsultantLink: (id: string, skal?: string) => revokeMock(id, skal) },
}))

import { KonsulentSamtyckeFraga } from './KonsulentSamtyckeFraga'

const KOPPLAD_UTAN_SAMTYCKE = { role: 'USER', consultant_id: 'k1' }

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  profilMock = { ...KOPPLAD_UTAN_SAMTYCKE }
  rpcMock.mockImplementation(async (namn: string) =>
    namn === 'get_my_consultant'
      ? { data: { first_name: 'Anna', last_name: 'Ek' } as never, error: null }
      : { data: 'consent-id' as never, error: null }
  )
  getActiveMock.mockResolvedValue(null)
})

describe('KS3 — vem som får frågan', () => {
  it('frågar inte den som saknar konsulentkoppling', async () => {
    profilMock = { role: 'USER', consultant_id: null }
    render(<KonsulentSamtyckeFraga />)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('frågar inte den som redan har ett aktivt samtycke', async () => {
    getActiveMock.mockResolvedValue({ id: 'befintligt' })
    render(<KonsulentSamtyckeFraga />)
    await waitFor(() => expect(getActiveMock).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('frågar inte konsulenten själv', async () => {
    profilMock = { role: 'CONSULTANT', consultant_id: 'k1' }
    render(<KonsulentSamtyckeFraga />)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(getActiveMock).not.toHaveBeenCalled()
  })

  it('frågar den som är kopplad utan samtycke, och namnger konsulenten', async () => {
    render(<KonsulentSamtyckeFraga />)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    // Namnet ska stå på flera ställen — intro, vad hen ser, och uppsägningen.
    expect(screen.getAllByText(/Anna Ek/).length).toBeGreaterThanOrEqual(3)
  })

  it('tiger resten av sessionen efter "Jag vill tänka på det"', async () => {
    const anvandare = userEvent.setup()
    const { unmount } = render(<KonsulentSamtyckeFraga />)
    await screen.findByRole('dialog')
    await anvandare.click(screen.getByRole('button', { name: /tänka på det/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    unmount()
    render(<KonsulentSamtyckeFraga />)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('KS3 — svaret', () => {
  it('Ja är låst tills båda kryssrutorna är i-kryssade', async () => {
    const anvandare = userEvent.setup()
    render(<KonsulentSamtyckeFraga />)
    await screen.findByRole('dialog')

    const ja = screen.getByRole('button', { name: /det är okej/i })
    expect(ja).toBeDisabled()

    const rutor = screen.getAllByRole('checkbox')
    await anvandare.click(rutor[0])
    expect(ja).toBeDisabled()

    await anvandare.click(rutor[1])
    expect(ja).toBeEnabled()
  })

  it('samtyckestexten sparas med samtycket — inte bara en tidsstämpel', async () => {
    const anvandare = userEvent.setup()
    render(<KonsulentSamtyckeFraga />)
    await screen.findByRole('dialog')

    for (const ruta of screen.getAllByRole('checkbox')) await anvandare.click(ruta)
    await anvandare.click(screen.getByRole('button', { name: /det är okej/i }))

    await waitFor(() => {
      const anrop = rpcMock.mock.calls.find(([namn]) => namn === 'grant_consultant_consent')
      expect(anrop).toBeDefined()
      const text = (anrop?.[1] as { p_consent_text: string }).p_consent_text
      // Texten ska bära det personen faktiskt läste: vad konsulenten ser,
      // vad hen inte ser, och att kopplingen går att säga upp.
      expect(text).toMatch(/ATS-poäng/)
      expect(text).toMatch(/dagbok/i)
      expect(text).toMatch(/säga upp/i)
      expect(text.length).toBeGreaterThan(200)
    })
  })

  it('Nej säger upp kopplingen i stället för att spara ett samtycke', async () => {
    const anvandare = userEvent.setup()
    // jsdom saknar navigation; komponenten laddar om sidan efter uppsägningen.
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })

    render(<KonsulentSamtyckeFraga />)
    await screen.findByRole('dialog')
    await anvandare.click(screen.getByRole('button', { name: /avsluta kopplingen/i }))

    await waitFor(() => expect(revokeMock).toHaveBeenCalledWith('k1', expect.stringMatching(/KS3/)))
    expect(rpcMock.mock.calls.some(([namn]) => namn === 'grant_consultant_consent')).toBe(false)
  })

  it('visar felet i stället för att låtsas ha sparat', async () => {
    const anvandare = userEvent.setup()
    rpcMock.mockImplementation(async (namn: string) =>
      namn === 'get_my_consultant'
        ? { data: { first_name: 'Anna', last_name: 'Ek' } as never, error: null }
        : { data: null as never, error: { message: 'permission denied' } }
    )

    render(<KonsulentSamtyckeFraga />)
    await screen.findByRole('dialog')
    for (const ruta of screen.getAllByRole('checkbox')) await anvandare.click(ruta)
    await anvandare.click(screen.getByRole('button', { name: /det är okej/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/permission denied/)
    // Dialogen står kvar — ett misslyckat sparande får aldrig se ut som ett lyckat.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
