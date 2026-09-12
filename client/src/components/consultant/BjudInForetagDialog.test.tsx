/**
 * BjudInForetagDialog — databasens fel ska synas, inte tystas (AG6).
 * Supabase mockas på klientnivå så att den RIKTIGA placeringarApi.bjudInForetag
 * körs: insert i vyn employer_invitations, sedan mejlet via fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BjudInForetagDialog } from './BjudInForetagDialog'
import type { Placering } from '@/services/placeringarApi'

const mockInsert = vi.fn()
const mockFrom = vi.fn()
let insertResultat: { data: unknown; error: unknown } = { data: null, error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }),
      getSession: async () => ({ data: { session: { access_token: 'tok' } } }),
    },
    from: (tabell: string) => {
      mockFrom(tabell)
      return {
        insert: (rad: unknown) => {
          mockInsert(rad)
          return { select: () => ({ single: async () => insertResultat }) }
        },
      }
    },
  },
}))

const plats = {
  id: 'w1',
  consultant_id: 'konsulent-1',
  participant_id: 'p1',
  company_account_id: null,
  place_id: null,
  company_name: 'Provbolaget',
  org_number: '5566778899',
  contact_name: 'Kim Chef',
  contact_email: 'kim@provbolaget.se',
  placement_type: 'praktik',
  status: 'planerad',
} as unknown as Placering

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })
  insertResultat = {
    data: { id: 'inv-1', org_id: 'org-1', company_name: 'Provbolaget', org_number: '556677-8899', email: 'kim@provbolaget.se', contact_name: 'Kim Chef', existing_account: false },
    error: null,
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDialog() {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  render(<BjudInForetagDialog open placering={plats} onClose={onClose} onSuccess={onSuccess} />)
  return { onClose, onSuccess }
}

describe('BjudInForetagDialog', () => {
  it('visar demokontots 42501-fel från databasen ordagrant — ingen tyst succé', async () => {
    insertResultat = { data: null, error: { message: 'Demokontot kan inte bjuda in. Personerna i demot är påhittade.', code: '42501' } }
    const { onSuccess, onClose } = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Skicka inbjudan' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Demokontot kan inte bjuda in. Personerna i demot är påhittade.')
    expect(mockFrom).toHaveBeenCalledWith('employer_invitations')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText(/Inbjudan skickad/)).not.toBeInTheDocument()
  })

  it('visar mejlfelet när raden skapades men edge-funktionen svarade fel (inte console.warn)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Could not send email automatically', details: 'Resend 422' }),
    })
    const { onSuccess } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Skicka inbjudan' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Inbjudan är registrerad men mejlet kunde inte skickas')
    expect(alert).toHaveTextContent('Resend 422')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('förifyller från platsen, skickar insert + mejl och visar bekräftelsen', async () => {
    const { onSuccess } = renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Bjud in företaget' })
    expect(within(dialog).getByLabelText('Organisationsnummer *')).toHaveValue('5566778899')
    expect(within(dialog).getByLabelText('Företagsnamn *')).toHaveValue('Provbolaget')
    expect(within(dialog).getByLabelText('Kontaktpersonens e-post *')).toHaveValue('kim@provbolaget.se')
    expect(within(dialog).getByLabelText('Kontaktpersonens namn')).toHaveValue('Kim Chef')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Skicka inbjudan' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(mockInsert).toHaveBeenCalledWith({
      org_number: '5566778899',
      company_name: 'Provbolaget',
      email: 'kim@provbolaget.se',
      contact_name: 'Kim Chef',
      placement_id: 'w1',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/functions\/v1\/send-invite-email$/)
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ invitationId: 'inv-1' })
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' })
    expect(screen.getByText(/Inbjudan skickad till kim@provbolaget.se/)).toBeInTheDocument()
  })

  it('säger "hade redan ett konto" när existing_account är true', async () => {
    insertResultat = { data: { ...(insertResultat.data as object), existing_account: true }, error: null }
    renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Skicka inbjudan' }))
    expect(await screen.findByText(/hade redan ett konto/)).toBeInTheDocument()
  })

  it('kräver org.nr, företagsnamn och e-post innan något skickas', async () => {
    renderDialog()
    fireEvent.change(screen.getByLabelText('Kontaktpersonens e-post *'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skicka inbjudan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('krävs')
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
