/**
 * O13 (2026-10-18): deltagarens förslag på tid syns för konsulenten, som bekräftar
 * (→ scheduled) eller tackar nej (→ cancelled). Ett förslag vars tid passerat visas inte,
 * och ett förslag räknas aldrig som ett bokat möte.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const bekraftaMote = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/services/moteskadens', async (orig) => ({ ...(await orig<typeof import('@/services/moteskadens')>()), bekraftaMote }))
vi.mock('./useRegelverk', () => ({ useOrgTypVisning: () => ({ visaAvtalskrav: false }) }))

import { MotesKort } from './MotesKort'
import type { DeltagarMote } from '@/services/moteskadens'

const om = (dagar: number) => new Date(Date.now() + dagar * 86_400_000).toISOString()
const mote = (o: Partial<DeltagarMote>): DeltagarMote =>
  ({ id: 'm', participant_id: 'p', scheduled_at: om(2), meeting_type: 'video', status: 'proposed', duration_minutes: 30, location: null, proposed_note: null, ...o }) as DeltagarMote

describe('MotesKort — mötesförslag (O13)', () => {
  beforeEach(() => bekraftaMote.mockClear())

  it('ett framtida förslag visas med deltagarens rad och kan bekräftas', async () => {
    const onAndrat = vi.fn()
    render(<MotesKort lage={{ status: 'klart', moten: [mote({ id: 'f1', proposed_note: 'Helst förmiddag' })] }} onBoka={() => {}} onAndrat={onAndrat} onForsokIgen={() => {}} />)
    expect(screen.getByText('Deltagaren föreslår en tid')).toBeInTheDocument()
    expect(screen.getByText('"Helst förmiddag"')).toBeInTheDocument()
    // ett förslag är inget bokat möte
    expect(screen.getByText('Inget möte bokat framåt.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Bekräfta tiden' }))
    expect(bekraftaMote).toHaveBeenCalledWith('f1', 'scheduled')
    expect(onAndrat).toHaveBeenCalledWith('f1', 'scheduled')
  })

  it('"Passar inte" sätter förslaget till inställt', async () => {
    render(<MotesKort lage={{ status: 'klart', moten: [mote({ id: 'f2' })] }} onBoka={() => {}} onAndrat={() => {}} onForsokIgen={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Passar inte' }))
    expect(bekraftaMote).toHaveBeenCalledWith('f2', 'cancelled')
  })

  it('ett förslag vars tid passerat visas inte', () => {
    render(<MotesKort lage={{ status: 'klart', moten: [mote({ scheduled_at: om(-1) })] }} onBoka={() => {}} onAndrat={() => {}} onForsokIgen={() => {}} />)
    expect(screen.queryByText('Deltagaren föreslår en tid')).not.toBeInTheDocument()
  })
})
