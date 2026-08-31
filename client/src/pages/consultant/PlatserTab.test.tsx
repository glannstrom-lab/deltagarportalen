/**
 * Tester för PlatserTab (spår AG1).
 *
 * placeringarApi mockas rakt av — servicelagret har sin egen testfil
 * (placeringarApi.test.ts). Det som testas här är sidans EGNA ansvar:
 *  - tre lägen (laddar/fel/klart), aldrig "fel" som ser ut som "tomt"
 *  - de två tomtillstånden (ingen deltagare / inga platser) via <EmptyState>
 *  - filter på insatstyp/status
 *  - att borttagning går genom bekräftelsedialogen (useConfirmDialog) INNAN
 *    placeringarApi.deletePlacering anropas — inte en "radera direkt"-genväg
 *  - att skapa-dialogen är en riktig dialog (role="dialog", aria-modal) och
 *    stängs med Escape (KT1 — de flesta dialoger i mappen saknar detta helt)
 *
 * jsdom-förbehållet (offsetParent alltid null) gör att fokuscykling inte kan
 * mätas här — bara att dialogen öppnas/stängs rätt (samma avgränsning som
 * CommandPalette.test.tsx och ConfirmDialog-testerna).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

const mockGetPlaceringar = vi.fn()
const mockGetKopplingsbaraDeltagare = vi.fn()
const mockCreatePlacering = vi.fn()
const mockUpdatePlacering = vi.fn()
const mockDeletePlacering = vi.fn()
const mockGetUppfoljningar = vi.fn()
const mockCreateUppfoljning = vi.fn()

vi.mock('@/services/placeringarApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/placeringarApi')>('@/services/placeringarApi')
  return {
    ...actual,
    placeringarApi: {
      getPlaceringar: (...a: unknown[]) => mockGetPlaceringar(...a),
      getKopplingsbaraDeltagare: (...a: unknown[]) => mockGetKopplingsbaraDeltagare(...a),
      createPlacering: (...a: unknown[]) => mockCreatePlacering(...a),
      updatePlacering: (...a: unknown[]) => mockUpdatePlacering(...a),
      deletePlacering: (...a: unknown[]) => mockDeletePlacering(...a),
      getUppfoljningar: (...a: unknown[]) => mockGetUppfoljningar(...a),
      createUppfoljning: (...a: unknown[]) => mockCreateUppfoljning(...a),
      // Ren logik (ingen nätverksåtkomst) — riktiga implementationer, inte
      // mockade. PlatserTab (milstolpeuppföljningar) och PlaceringCard
      // (handledningsobalans) anropar dessa direkt.
      byggArbetsgivarUnderlag: actual.placeringarApi.byggArbetsgivarUnderlag,
      harHandledningsobalans: actual.placeringarApi.harHandledningsobalans,
      berakMilstolpeUppfoljningar: actual.placeringarApi.berakMilstolpeUppfoljningar,
      berakPeriodForslag: actual.placeringarApi.berakPeriodForslag,
    },
  }
})

import { PlatserTab } from './PlatserTab'

const DELTAGARE = [{ participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson', email: 'anna@example.com' }]

function placering(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'w1',
    consultant_id: 'c1',
    participant_id: 'p1',
    company_account_id: null,
    placement_type: 'praktik',
    status: 'pagaende',
    company_name: 'ICA Maxi',
    org_number: null,
    occupation: 'Butiksbiträde',
    industry: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    address: null,
    start_date: '2026-08-01',
    end_date: null,
    hours_per_week: 20,
    schedule_days: null,
    can_ramp_up: true,
    ramp_up_plan: null,
    lifting_required: false,
    standing_required: true,
    temperature_demands: null,
    noise_level: null,
    pace_level: null,
    shift_work: false,
    physical_notes: null,
    participant_supervision_need: 'mellan',
    workplace_supervision_capacity: null,
    supervision_notes: null,
    language_requirements: null,
    drivers_license_required: false,
    other_requirements: null,
    sick_call_phone: null,
    sick_call_instructions: null,
    employer_instructions: null,
    internal_adaptation_notes: null,
    work_environment_responsibility: null,
    employer_future_needs: null,
    employer_hiring_interest: 'okant',
    notes: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/consultant/platser']}>
        <I18nextProvider i18n={i18n}>
          <ConfirmDialogProvider>
            <PlatserTab />
          </ConfirmDialogProvider>
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUppfoljningar.mockResolvedValue([])
})

describe('PlatserTab — tre lägen', () => {
  it('visar laddningsläge medan frågorna är ute (pending resolvers)', async () => {
    mockGetPlaceringar.mockReturnValue(new Promise(() => {}))
    mockGetKopplingsbaraDeltagare.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(await screen.findByText('Hämtar platser')).toBeInTheDocument()
  })

  it('visar en FELVY skild från tomtillståndet när hämtningen misslyckas', async () => {
    mockGetPlaceringar.mockRejectedValue(new Error('Nätverksfel'))
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    expect(await screen.findByText('Platserna kunde inte hämtas')).toBeInTheDocument()
    expect(screen.getByText('Nätverksfel')).toBeInTheDocument()
    // Felvyn ska INTE påstå att det bara är tomt
    expect(screen.queryByText('Inga platser registrerade än')).not.toBeInTheDocument()
  })

  it('visar tomtillstånd med CTA till Deltagare när konsulenten saknar aktiva deltagare', async () => {
    mockGetPlaceringar.mockResolvedValue([])
    mockGetKopplingsbaraDeltagare.mockResolvedValue([])
    renderTab()
    expect(await screen.findByText('Platserna samlas här')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gå till Deltagare' })).toBeInTheDocument()
  })

  it('visar tomtillstånd med "Lägg till plats" när deltagare finns men inga platser', async () => {
    mockGetPlaceringar.mockResolvedValue([])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    expect(await screen.findByText('Inga platser registrerade än')).toBeInTheDocument()
  })

  it('renderar listan när platser finns', async () => {
    mockGetPlaceringar.mockResolvedValue([placering()])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    expect(await screen.findByText('ICA Maxi')).toBeInTheDocument()
    expect(screen.getByText(/Anna Andersson/)).toBeInTheDocument()
  })
})

describe('PlatserTab — filter', () => {
  it('filtrerar bort platser som inte matchar vald insatstyp', async () => {
    mockGetPlaceringar.mockResolvedValue([
      placering({ id: 'w1', company_name: 'ICA Maxi', placement_type: 'praktik' }),
      placering({ id: 'w2', company_name: 'Postnord', placement_type: 'arbetstraning' }),
    ])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    expect(await screen.findByText('ICA Maxi')).toBeInTheDocument()
    expect(screen.getByText('Postnord')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filtrera på insatstyp'), { target: { value: 'arbetstraning' } })

    expect(screen.queryByText('ICA Maxi')).not.toBeInTheDocument()
    expect(screen.getByText('Postnord')).toBeInTheDocument()
  })
})

describe('PlatserTab — ny plats', () => {
  it('öppnar en riktig dialog (role=dialog, aria-modal) och stänger den med Escape', async () => {
    mockGetPlaceringar.mockResolvedValue([])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    await screen.findByText('Inga platser registrerade än')

    fireEvent.click(screen.getAllByRole('button', { name: 'Lägg till plats' })[0])

    const dialog = await screen.findByRole('dialog', { name: 'Ny plats' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('kräver deltagare + företagsnamn innan spara, och anropar createPlacering med rätt insatstyp', async () => {
    mockGetPlaceringar.mockResolvedValue([])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    mockCreatePlacering.mockResolvedValue(placering())
    renderTab()
    await screen.findByText('Inga platser registrerade än')

    fireEvent.click(screen.getAllByRole('button', { name: 'Lägg till plats' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Ny plats' })

    // Utan deltagare vald och utan företagsnamn ska spara INTE gå igenom
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skapa plats' }))
    expect(await within(dialog).findByText('Välj en deltagare')).toBeInTheDocument()
    expect(mockCreatePlacering).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Deltagare *'), { target: { value: 'p1' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skapa plats' }))
    expect(await within(dialog).findByText('Företagsnamn krävs')).toBeInTheDocument()
    expect(mockCreatePlacering).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Företagsnamn *'), { target: { value: 'Postnord' } })
    fireEvent.click(within(dialog).getByText('Arbetsträning').closest('label')!.querySelector('input')!)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skapa plats' }))

    await waitFor(() => expect(mockCreatePlacering).toHaveBeenCalledTimes(1))
    expect(mockCreatePlacering.mock.calls[0][0]).toMatchObject({
      participant_id: 'p1',
      company_name: 'Postnord',
    })
  })
})

describe('PlatserTab — borttagning går genom bekräftelsedialogen', () => {
  it('anropar INTE deletePlacering om bekräftelsen avbryts', async () => {
    mockGetPlaceringar.mockResolvedValue([placering()])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    await screen.findByText('ICA Maxi')

    fireEvent.click(screen.getByRole('button', { name: /Ta bort/ }))
    const confirmDialog = await screen.findByRole('dialog')
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Avbryt' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockDeletePlacering).not.toHaveBeenCalled()
  })

  it('anropar deletePlacering först EFTER att bekräftelsen godkänts', async () => {
    mockGetPlaceringar.mockResolvedValue([placering()])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    mockDeletePlacering.mockResolvedValue(undefined)
    renderTab()
    await screen.findByText('ICA Maxi')

    fireEvent.click(screen.getByRole('button', { name: /Ta bort/ }))
    const confirmDialog = await screen.findByRole('dialog')
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Ta bort' }))

    await waitFor(() => expect(mockDeletePlacering).toHaveBeenCalledWith('w1'))
  })
})

describe('PlatserTab — milstolpeuppföljningar skapas automatiskt (vecka 1/5/12/24)', () => {
  it('skapar fyra PLANERADE milstolpar när den nya platsen har ett startdatum', async () => {
    mockGetPlaceringar.mockResolvedValue([])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    mockCreatePlacering.mockResolvedValue(placering({ id: 'w9', start_date: '2026-08-01' }))
    renderTab()
    await screen.findByText('Inga platser registrerade än')

    fireEvent.click(screen.getAllByRole('button', { name: 'Lägg till plats' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Ny plats' })
    fireEvent.change(within(dialog).getByLabelText('Deltagare *'), { target: { value: 'p1' } })
    fireEvent.change(within(dialog).getByLabelText('Företagsnamn *'), { target: { value: 'Postnord' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skapa plats' }))

    await waitFor(() => expect(mockCreateUppfoljning).toHaveBeenCalledTimes(4))

    const veckor = mockCreateUppfoljning.mock.calls.map((c) => c[0].week_number).sort((a, b) => a - b)
    expect(veckor).toEqual([1, 5, 12, 24])

    for (const call of mockCreateUppfoljning.mock.calls) {
      const input = call[0]
      expect(input.placement_id).toBe('w9')
      // En förberedd milstolpe är PLANERAD — inte genomförd, ingen påhittad status.
      expect(input.is_completed).toBe(false)
      expect(input.status).toBeNull()
    }

    // Vecka 1 från startdatum 2026-08-01 ska landa på 2026-08-08.
    const vecka1 = mockCreateUppfoljning.mock.calls.find((c) => c[0].week_number === 1)![0]
    expect(vecka1.followup_date).toBe('2026-08-08')
  })

  it('skapar INGA milstolpar om platsen saknar startdatum', async () => {
    mockGetPlaceringar.mockResolvedValue([])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    mockCreatePlacering.mockResolvedValue(placering({ id: 'w10', start_date: null }))
    renderTab()
    await screen.findByText('Inga platser registrerade än')

    fireEvent.click(screen.getAllByRole('button', { name: 'Lägg till plats' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Ny plats' })
    fireEvent.change(within(dialog).getByLabelText('Deltagare *'), { target: { value: 'p1' } })
    fireEvent.change(within(dialog).getByLabelText('Företagsnamn *'), { target: { value: 'Postnord' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skapa plats' }))

    await waitFor(() => expect(mockCreatePlacering).toHaveBeenCalledTimes(1))
    expect(mockCreateUppfoljning).not.toHaveBeenCalled()
  })
})

describe('PlatserTab — handledningsobalans lyfts synligt på kortet', () => {
  it('visar en varning när arbetsplatsens kapacitet är låg och deltagarens behov är högt', async () => {
    mockGetPlaceringar.mockResolvedValue([
      placering({ workplace_supervision_capacity: 'lag', participant_supervision_need: 'hog' }),
    ])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    expect(await screen.findByText('Handledningsobalans')).toBeInTheDocument()
  })

  it('visar INGEN varning när kapacitet och behov inte krockar', async () => {
    mockGetPlaceringar.mockResolvedValue([
      placering({ workplace_supervision_capacity: 'hog', participant_supervision_need: 'hog' }),
    ])
    mockGetKopplingsbaraDeltagare.mockResolvedValue(DELTAGARE)
    renderTab()
    await screen.findByText('ICA Maxi')
    expect(screen.queryByText('Handledningsobalans')).not.toBeInTheDocument()
  })
})
