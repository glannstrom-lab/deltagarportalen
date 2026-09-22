/**
 * BulkActionsDialog — dialogsemantik (buggpasset 2026-09-22 kväll).
 *
 * Massåtgärdsrutan var en vanlig `<div>` ovanpå sidan: ingen `role="dialog"`,
 * ingen `aria-modal`, inget namn, Escape gjorde ingenting och fokus kunde
 * tabba rakt ut i deltagarlistan bakom. Stängknappen (X) hade inget namn.
 * Den bygger nu på `components/ui/Dialog`, som ger allt det plus `inert` på
 * bakgrunden.
 *
 * Mutation: byt tillbaka till en vanlig `<div>` → alla tre testen faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { BulkActionsDialog } from './BulkActionsDialog'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(), auth: { getUser: vi.fn() } } }))
vi.mock('@/services/consultantService', () => ({ consultantService: {} }))
vi.mock('@/services/pdfLazyLoad', () => ({ loadJsPDFWithAutoTable: vi.fn() }))

afterEach(() => cleanup())

const deltagare = [
  { participant_id: 'p1', first_name: 'Anna', last_name: 'A', email: 'a@x.se', status: 'active' },
]

function rendera(onClose = vi.fn()) {
  render(
    <BulkActionsDialog isOpen onClose={onClose} actionType="tag" selectedParticipants={deltagare} onComplete={vi.fn()} />
  )
  return onClose
}

describe('BulkActionsDialog — dialogsemantik', () => {
  it('är en modal dialog med namn', () => {
    rendera()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName()
  })

  it('Escape stänger', () => {
    const onClose = rendera()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('stängknappen har ett namn', () => {
    rendera()
    expect(screen.getByRole('button', { name: /stäng|close/i })).toBeInTheDocument()
  })
})
