/**
 * RR25 (rollspelet 2026-09-27): resultatklockan på deltagarsidan — status per
 * uppföljningspunkt väntar → verifierad → fakturerad. Konstanten för
 * PENDING_20260927d_resultat_och_msfa mockad till true.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { PlaceringDeltagareKort } from './PlaceringDeltagareKort'
import type { Placement } from '@/services/consultantService'

vi.mock('@/services/resultatklocka', async (orig) => {
  const riktig = await orig<typeof import('@/services/resultatklocka')>()
  return { ...riktig, RESULTAT_MSFA_FINNS: true, resultatApi: { sattBetalstatus: vi.fn(async () => undefined) } }
})

const placering = (o: Partial<Placement> & Record<string, unknown> = {}) => ({
  id: 'pc1', participant_id: 'p1', consultant_id: 'k1', employer_name: 'Nordfrakt AB', job_title: 'Lagerarbetare', start_date: '2026-06-09',
  placement_type: 'permanent', followup_3m: true, followup_6m: false, created_at: '', outcome_level: 'A',
  followup_3m_date: '2026-09-10', followup_3m_outcome: 'kvar', followup_3m_evidence: 'lonespecifikation', ...o,
}) as Placement

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 8, 27, 10, 0, 0)) })
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

describe('RR25 — resultatklockan', () => {
  it('en gjord uppföljning med skriftligt underlag väntar och kan verifieras', async () => {
    const { resultatApi } = await import('@/services/resultatklocka')
    const andrad = vi.fn()
    render(<PlaceringDeltagareKort lage={{ status: 'klart', placeringar: [placering()] }} onForsokIgen={vi.fn()} onRegistrera={vi.fn()} onBetalstatusAndrad={andrad} />)
    expect(screen.getByTestId('betalstatus-3m')).toHaveTextContent('Ersättning: Väntar på verifiering')
    // 6 månader är inte gjord — ingen status att ha.
    expect(screen.queryByTestId('betalstatus-6m')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Markera verifierad' }))
    await vi.waitFor(() => expect(resultatApi.sattBetalstatus).toHaveBeenCalledWith('pc1', '3m', 'verifierad'))
    await vi.waitFor(() => expect(andrad).toHaveBeenCalled())
  })

  it('muntligt underlag kan inte verifieras, och det sägs varför', () => {
    render(<PlaceringDeltagareKort lage={{ status: 'klart', placeringar: [placering({ followup_3m_evidence: 'deltagaren_muntligt' })] }} onForsokIgen={vi.fn()} onRegistrera={vi.fn()} onBetalstatusAndrad={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Markera verifierad' })).toBeNull()
    expect(screen.getByTestId('betalstatus-3m')).toHaveTextContent(/skriftligt underlag/)
  })

  it('verifierad går vidare till fakturerad med datum', () => {
    render(<PlaceringDeltagareKort lage={{ status: 'klart', placeringar: [placering({ followup_3m_payment_status: 'verifierad', followup_3m_payment_status_at: '2026-09-20T09:00:00Z' })] }} onForsokIgen={vi.fn()} onRegistrera={vi.fn()} onBetalstatusAndrad={vi.fn()} />)
    expect(screen.getByTestId('betalstatus-3m')).toHaveTextContent('Ersättning: Verifierad 20 september 2026')
    expect(screen.getByRole('button', { name: 'Markera fakturerad' })).toBeInTheDocument()
  })

  it('utan callback (vyn som inte kan ladda om) visas ingen statusrad', () => {
    render(<PlaceringDeltagareKort lage={{ status: 'klart', placeringar: [placering()] }} onForsokIgen={vi.fn()} onRegistrera={vi.fn()} />)
    expect(screen.queryByTestId('betalstatus-3m')).toBeNull()
  })
})
