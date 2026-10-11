/**
 * Beslut 2026-10-11: en registrerad placering hos Rusta och matcha FÖRESLÅR läget
 * Uppföljning. Konsulenten bekräftar — inget ändras utan hennes ja. För kommun
 * (visaAvtalskrav false) föreslås inget och dialogen stänger som förut.
 *
 * Mutationer som ska fälla: sätt läget direkt efter sparningen (utan steget) →
 * test 2 faller (anropet sker före klicket); hoppa över kundtypskontrollen →
 * test 3 faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'

const kundtyp = vi.hoisted(() => ({ visaAvtalskrav: true, visaIvoUnderlag: false }))
vi.mock('@/components/consultant/useRegelverk', () => ({ useOrgTypVisning: () => kundtyp, useRegelverk: () => 'leverantor' }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }) },
    from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }),
  },
}))
const tjanst = vi.hoisted(() => ({ recordPlacement: vi.fn(async () => ({})), updateParticipantStatus: vi.fn(async () => undefined) }))
vi.mock('@/services/consultantService', () => ({ consultantService: tjanst }))

import { PlacementDialog } from './PlacementDialog'

const deltagare = { participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@example.com', status: 'ACTIVE' }

beforeEach(() => {
  kundtyp.visaAvtalskrav = true
  tjanst.recordPlacement.mockClear()
  tjanst.updateParticipantStatus.mockClear()
})
afterEach(cleanup)

function fyllOchSpara() {
  fireEvent.change(document.getElementById('placement-employer') as HTMLInputElement, { target: { value: 'Bageriet AB' } })
  fireEvent.click(screen.getByRole('button', { name: /Spara placering/ }))
}

describe('PlacementDialog — föreslår Uppföljning', () => {
  it('efter sparningen visas förslaget, och Nej ändrar inget', async () => {
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    render(<PlacementDialog isOpen onClose={onClose} onSuccess={onSuccess} preselectedParticipant={deltagare} />)
    fyllOchSpara()
    expect(await screen.findByTestId('foreslag-uppfoljning')).toHaveTextContent('Flytta Anna till Uppföljning?')
    expect(tjanst.recordPlacement).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Nej, behåll som aktiv/ }))
    expect(tjanst.updateParticipantStatus).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalled()
  })

  it('Ja sätter FOLLOW_UP — först när konsulenten bekräftat', async () => {
    const onStatusAndrad = vi.fn()
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} onStatusAndrad={onStatusAndrad} preselectedParticipant={deltagare} />)
    fyllOchSpara()
    await screen.findByTestId('foreslag-uppfoljning')
    expect(tjanst.updateParticipantStatus).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Ja, flytta till Uppföljning/ }))
    await waitFor(() => expect(tjanst.updateParticipantStatus).toHaveBeenCalledWith('p1', 'FOLLOW_UP'))
    expect(onStatusAndrad).toHaveBeenCalledWith('FOLLOW_UP')
  })

  it('kommun: inget förslag, dialogen stänger som förut', async () => {
    kundtyp.visaAvtalskrav = false
    const onSuccess = vi.fn()
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={onSuccess} preselectedParticipant={deltagare} />)
    fyllOchSpara()
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('foreslag-uppfoljning')).toBeNull()
  })

  it('ett misslyckat lägesbyte säger att placeringen ändå är sparad', async () => {
    tjanst.updateParticipantStatus.mockRejectedValueOnce(new Error('42501'))
    const onSuccess = vi.fn()
    render(<PlacementDialog isOpen onClose={vi.fn()} onSuccess={onSuccess} preselectedParticipant={deltagare} />)
    fyllOchSpara()
    await screen.findByTestId('foreslag-uppfoljning')
    fireEvent.click(screen.getByRole('button', { name: /Ja, flytta till Uppföljning/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Placeringen är sparad')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
