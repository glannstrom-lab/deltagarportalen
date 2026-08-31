/**
 * Tester för PlacementDialog (AG3/KS1).
 *
 * Bakgrund: `consultantService.recordPlacement()` fanns och var testad på
 * serviceNivå, men hade noll anropare — prod hade 0 rader i
 * `consultant_placements` (2026-08-31). Den här dialogen är den FÖRSTA
 * skrivvägen. Testerna täcker: deltagarval → formulär, att arbetsgivarnamn
 * krävs, att `recordPlacement()` får rätt fält (inklusive `notes`, som
 * saknades i Placement-interfacet innan den här ändringen), och att
 * dialogen är en riktig WCAG 2.1.2-modal — role="dialog", aria-modal och
 * Esc stänger. De två grannmodalerna i den här mappen (GoalCreationDialog,
 * MeetingSchedulerDialog) saknar allt det senare helt (post KT1); den här
 * dialogen ska vara förebilden, så regressionsvakten står här.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { PlacementDialog } from './PlacementDialog'
import { consultantService } from '@/services/consultantService'

vi.mock('@/services/consultantService', () => ({
  consultantService: {
    recordPlacement: vi.fn(),
  },
}))

const deltagare = [
  { participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson', email: 'anna@example.com' },
  { participant_id: 'p2', first_name: 'Bertil', last_name: 'Berg', email: 'bertil@example.com' },
]

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'consultant-1' } } }) },
    from: () => ({
      select: () => ({
        eq: async () => ({ data: deltagare }),
      }),
    }),
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

type Props = React.ComponentProps<typeof PlacementDialog>

function renderDialog(overrides: Partial<Props> = {}) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const utils = render(
    <PlacementDialog isOpen onClose={onClose} onSuccess={onSuccess} {...overrides} />
  )
  return { ...utils, onClose, onSuccess }
}

describe('PlacementDialog — tillgänglighet (WCAG 2.1.2)', () => {
  it('är en riktig modal: role="dialog", aria-modal="true"', async () => {
    renderDialog()
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('Escape stänger dialogen (ingen tangentbordsfälla)', async () => {
    const { onClose } = renderDialog()
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('PlacementDialog — deltagarval', () => {
  it('visar deltagarlistan och går vidare till formuläret vid val', async () => {
    renderDialog()
    const annaButton = await screen.findByText('Anna Andersson')
    fireEvent.click(annaButton)
    expect(await screen.findByLabelText(/Arbetsgivare/)).toBeInTheDocument()
  })

  it('hoppar direkt till formuläret med preselectedParticipant (minst friktion från en känd deltagare)', async () => {
    renderDialog({ preselectedParticipant: deltagare[0] })
    expect(await screen.findByLabelText(/Arbetsgivare/)).toBeInTheDocument()
    expect(screen.getByText('Anna Andersson')).toBeInTheDocument()
  })
})

describe('PlacementDialog — spara placering', () => {
  it('arbetsgivarnamn krävs: knappen är inaktiv och recordPlacement anropas inte utan det', async () => {
    renderDialog({ preselectedParticipant: deltagare[0] })
    const saveButton = await screen.findByRole('button', { name: /Spara placering/i })
    expect(saveButton).toBeDisabled()
    fireEvent.click(saveButton)
    expect(consultantService.recordPlacement).not.toHaveBeenCalled()
  })

  it('sparar med rätt fält — inklusive notes — och anropar onSuccess', async () => {
    vi.mocked(consultantService.recordPlacement).mockResolvedValue({} as never)
    const { onSuccess } = renderDialog({ preselectedParticipant: deltagare[0] })

    fireEvent.change(await screen.findByLabelText(/Arbetsgivare/), { target: { value: 'Volvo Group' } })
    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Lagerarbetare' } })
    fireEvent.change(screen.getByLabelText(/Anteckning/), { target: { value: 'Gick via en tidigare praktikplats.' } })

    fireEvent.click(screen.getByRole('button', { name: /Spara placering/i }))

    await waitFor(() => expect(consultantService.recordPlacement).toHaveBeenCalledTimes(1))
    expect(consultantService.recordPlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        participant_id: 'p1',
        employer_name: 'Volvo Group',
        job_title: 'Lagerarbetare',
        notes: 'Gick via en tidigare praktikplats.',
        placement_type: 'permanent',
        followup_3m: false,
        followup_6m: false,
      })
    )
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('visar ett felmeddelande om sparandet misslyckas — tystnar inte', async () => {
    vi.mocked(consultantService.recordPlacement).mockRejectedValue(new Error('nätverksfel'))
    const { onSuccess } = renderDialog({ preselectedParticipant: deltagare[0] })

    fireEvent.change(await screen.findByLabelText(/Arbetsgivare/), { target: { value: 'Volvo Group' } })
    fireEvent.click(screen.getByRole('button', { name: /Spara placering/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte sparas/i)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
