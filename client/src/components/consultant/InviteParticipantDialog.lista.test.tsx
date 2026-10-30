import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { InviteParticipantDialog } from './InviteParticipantDialog'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) }, from: () => ({}) },
}))

describe('InviteParticipantDialog — FN6 listläge', () => {
  afterEach(() => { cleanup() })

  it('länken byter till uppladdningen och "Bjud in en i taget" tillbaka', async () => {
    render(<InviteParticipantDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: /Ladda upp en deltagarlista/ }))
    expect(await screen.findByRole('heading', { name: 'Ladda upp en deltagarlista' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bjud in en i taget' }))
    expect(await screen.findByRole('heading', { name: 'Bjud in deltagare' })).toBeInTheDocument()
  })
})
