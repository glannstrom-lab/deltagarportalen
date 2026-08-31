/**
 * Tester för BulkActionsDialog (KS5).
 *
 * Bakgrund: `handleApplyTags`/`handleUpdateStatus` räknade rätt antal
 * misslyckade `Promise.allSettled`-anrop, skrev ett felmeddelande till
 * `error` — och satte `setSuccess(true)` två rader senare ändå. Rendervillkoret
 * visade bara success-vyn eller formuläret, aldrig felet, och dialogen
 * autostängde sig efter 1,5 s med grön bock. En konsulent som taggade 20
 * deltagare där 6 misslyckades fick beskedet att allt gick bra.
 *
 * Testerna täcker tre utfall för `handleApplyTags` (samma kodväg som
 * `handleUpdateStatus`, se komponentens kommentarer):
 *  1. Alla lyckas → success-vyn, med autostängning.
 *  2. Några misslyckas → en delvis-vy som namnger deltagarna och INTE
 *     autostänger — kräver ett aktivt klick på "Stäng".
 *  3. Alla misslyckas → felet syns i formulärvyn (ingen success, ingen
 *     tystnad).
 *
 * `consultantService` mockas i sin helhet — vi testar dialogens eget
 * tillstånd, inte Supabase-anropen bakom den.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BulkActionsDialog } from './BulkActionsDialog'
import { consultantService } from '@/services/consultantService'

vi.mock('@/services/consultantService', () => ({
  consultantService: {
    addParticipantTags: vi.fn(),
    updateParticipantStatus: vi.fn(),
  },
}))

const deltagare = [
  {
    participant_id: 'p1',
    first_name: 'Anna',
    last_name: 'Andersson',
    email: 'anna@example.com',
    status: 'ACTIVE',
  },
  {
    participant_id: 'p2',
    first_name: 'Bertil',
    last_name: 'Berg',
    email: 'bertil@example.com',
    status: 'ACTIVE',
  },
]

function renderaDialog(overrides: Partial<React.ComponentProps<typeof BulkActionsDialog>> = {}) {
  const onClose = vi.fn()
  const onComplete = vi.fn()
  const utils = render(
    <BulkActionsDialog
      isOpen
      onClose={onClose}
      actionType="tag"
      selectedParticipants={deltagare}
      onComplete={onComplete}
      {...overrides}
    />
  )
  return { ...utils, onClose, onComplete }
}

/** Väljer en tagg och klickar på "Tillämpa" — den gemensamma vägen i alla tre fall. */
async function valjTaggOchSkicka() {
  fireEvent.click(screen.getByText('Behöver uppföljning'))
  fireEvent.click(screen.getByRole('button', { name: /Tillämpa/i }))
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.clearAllMocks()
  cleanup()
})

describe('BulkActionsDialog — delvis-utfall vid batch-taggning (KS5)', () => {
  it('alla lyckas → visar success-vyn och stänger sig själv efter 1,5 s', async () => {
    vi.mocked(consultantService.addParticipantTags).mockResolvedValue(undefined)

    const { onClose, onComplete } = renderaDialog()

    await valjTaggOchSkicka()

    await waitFor(() => expect(screen.getByText('Åtgärd slutförd!')).toBeInTheDocument())

    // Ingen namngiven-lista och inget fel ska synas vid full framgång.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1500)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('några misslyckas → delvis-vy som namnger deltagarna och INTE autostänger', async () => {
    vi.mocked(consultantService.addParticipantTags).mockImplementation(participantId =>
      participantId === 'p1' ? Promise.resolve() : Promise.reject(new Error('nej'))
    )

    const { onClose, onComplete } = renderaDialog()

    await valjTaggOchSkicka()

    const larm = await waitFor(() => screen.getByRole('alert'))
    expect(larm).toHaveTextContent('1 av 2')
    expect(larm).toHaveTextContent('Bertil Berg')
    // Den som gick igenom ska INTE stå med bland de misslyckade.
    expect(larm).not.toHaveTextContent('Anna Andersson')

    // Success-vyn och formuläret ska vara borta.
    expect(screen.queryByText('Åtgärd slutförd!')).not.toBeInTheDocument()

    // Ingen autostängning — även efter gott om tid ska dialogen stå kvar öppen.
    await vi.advanceTimersByTimeAsync(5000)
    expect(onClose).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()

    // Stängningen kräver ett aktivt klick.
    fireEvent.click(screen.getByRole('button', { name: /Stäng/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('alla misslyckas → felet syns, ingen success och ingen tystnad', async () => {
    vi.mocked(consultantService.addParticipantTags).mockRejectedValue(new Error('nej'))

    const { onClose, onComplete } = renderaDialog()

    await valjTaggOchSkicka()

    await waitFor(() =>
      expect(screen.getByText('Det gick inte att lägga till taggar')).toBeInTheDocument()
    )

    expect(screen.queryByText('Åtgärd slutförd!')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5000)
    expect(onClose).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
