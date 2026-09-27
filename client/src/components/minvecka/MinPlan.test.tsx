/**
 * RD25 (rollspelet 2026-09-27): "Din plan" för R&M-deltagaren, och motsvarande
 * sann text för kommunens. Fem beteenden som kan falla:
 *   1. Leverantör: leverantörens namn, Arbetsförmedlingens beslut och aktivitetsrapporten.
 *   2. Kommun: socialnämnden, aldrig Arbetsförmedlingen eller aktivitetsrapporten.
 *   3. Okänt regelverk: ingen myndighet alls (samma regel som RD3).
 *      Mutation: låt `null` falla till kommunens text → testet faller.
 *   4. Praktikplatsen med kontakt, telefon och sjukanmälan.
 *   5. Ett läsfel på platsen säger det, i stället för att tiga.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@/test/utils'
import type { ReactElement } from 'react'
import { MinPlan } from './MinPlan'
import type { MinPraktik } from '@/services/minPraktikApi'

const hamtaAktuell = vi.fn()
vi.mock('@/services/minPraktikApi', () => ({ minPraktikApi: { hamtaAktuell: () => hamtaAktuell() } }))

// test/utils ger en egen QueryClient (retry: false) per rendering.
const medKlient = (ui: ReactElement) => render(ui)

const plats: MinPraktik = {
  id: 'w1', placement_type: 'praktik', status: 'pagaende', company_name: 'Demobageriet', occupation: 'Bagare',
  address: 'Storgatan 1', contact_name: 'Lena Handledare', contact_phone: '070-123 45 67', start_date: '2026-09-01',
  end_date: null, hours_per_week: 20, schedule_days: 'Tisdag–torsdag 07–13', sick_call_phone: null,
  sick_call_instructions: 'Ring Lena före kl 7.',
}

beforeEach(() => { hamtaAktuell.mockReset() })
afterEach(cleanup)

describe('MinPlan (RD25)', () => {
  it('leverantör: vem hon är hos, att Arbetsförmedlingen beslutat, och aktivitetsrapporten', async () => {
    hamtaAktuell.mockResolvedValue(null)
    medKlient(<MinPlan regelverk="leverantor" orgNamn="Demo Coach AB" />)
    expect(screen.getByText('Du är hos Demo Coach AB. Det är en leverantör i Rusta och matcha.')).toBeInTheDocument()
    expect(screen.getByText(/Det är Arbetsförmedlingen som har bestämt/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aktivitetsrapporten' })).toBeInTheDocument()
    expect(screen.getByText(/i början av varje månad för månaden innan/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Så gör du med aktivitetsrapporten' })).toHaveAttribute('href', '/guider/aktivitetsrapport-guide/')
    expect(screen.queryByText(/socialnämnden|försörjningsstöd/)).toBeNull()
  })

  it('kommun: socialnämnden, aldrig Arbetsförmedlingen', () => {
    hamtaAktuell.mockResolvedValue(null)
    const { container } = medKlient(<MinPlan regelverk="kommun" orgNamn="Demokommun" />)
    expect(screen.getByText('Du har din plan hos Demokommun.')).toBeInTheDocument()
    expect(screen.getByText(/socialnämnden i kommunen/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Arbetsförmedlingen|aktivitetsrapport/i)
  })

  it('okänt regelverk: ingen myndighet', () => {
    hamtaAktuell.mockResolvedValue(null)
    const { container } = medKlient(<MinPlan regelverk={null} orgNamn="Någon organisation" />)
    expect(container.textContent).not.toMatch(/Arbetsförmedlingen|socialnämnden|försörjningsstöd|Rusta och matcha/)
    expect(screen.getByText(/Det som räknas här är passen i din plan/)).toBeInTheDocument()
  })

  it('visar praktikplatsen med kontakt och vad hon gör om hon blir sjuk', async () => {
    hamtaAktuell.mockResolvedValue(plats)
    medKlient(<MinPlan regelverk="leverantor" orgNamn="Demo Coach AB" />)
    expect(await screen.findByRole('heading', { name: 'Din praktikplats' })).toBeInTheDocument()
    expect(screen.getByText('Demobageriet · Bagare')).toBeInTheDocument()
    expect(screen.getByText(/Din kontakt på arbetsplatsen: Lena Handledare/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /070-123 45 67/ })).toHaveAttribute('href', 'tel:070-1234567')
    expect(screen.getByText('Om du blir sjuk: Ring Lena före kl 7.')).toBeInTheDocument()
    expect(screen.getByText(/Tisdag–torsdag 07–13 · 20 timmar i veckan/)).toBeInTheDocument()
  })

  it('ett läsfel på platsen säger det', async () => {
    hamtaAktuell.mockImplementation(async () => { throw new Error('500') })
    medKlient(<MinPlan regelverk="kommun" orgNamn={null} />)
    expect(await screen.findByText(/Din arbetsplats kunde inte hämtas just nu/)).toBeInTheDocument()
  })
})
