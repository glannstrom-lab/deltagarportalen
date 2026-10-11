/**
 * Beslut 2026-10-11: meddelanden från konsulenten som SYNS på Min konsulent
 * markeras lästa. Egna meddelanden och sådant som ligger bakom "Visa äldre"
 * markeras inte.
 *
 * Mutation: ta bort filtret på avsändare (markera även egna) → test 1 faller;
 * markera hela listan i stället för de synliga → test 2 faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({}) } }))
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: {} }))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'u1' }, profile: { first_name: 'Anna' } }
  return { useAuthStore: Object.assign(() => state, { getState: () => state }) }
})

import { MessagesSection } from './MyConsultant'

afterEach(cleanup)

const konsulent = { id: 'k1', first_name: 'Demo', last_name: 'Konsulent', email: 'k@example.com', phone: null, avatar_url: null } as never
const msg = (id: string, fran: 'u1' | 'k1', is_read: boolean, min: number) => ({
  id, content: `text ${id}`, sender_id: fran, created_at: `2026-10-11T10:${String(min).padStart(2, '0')}:00Z`, is_read,
})

describe('Min konsulent — synliga meddelanden markeras lästa', () => {
  it('bara olästa från konsulenten, inte egna', async () => {
    const onLasta = vi.fn()
    const messages = [msg('a', 'u1', false, 1), msg('b', 'k1', false, 2), msg('c', 'k1', true, 3)]
    render(<MemoryRouter><MessagesSection messages={messages} consultant={konsulent} onSendMessage={vi.fn()} loading={false} onLasta={onLasta} /></MemoryRouter>)
    await waitFor(() => expect(onLasta).toHaveBeenCalledTimes(1))
    expect(onLasta).toHaveBeenCalledWith(['b'])
  })

  it('ett äldre meddelande bakom "Visa äldre" markeras först när det syns', async () => {
    const onLasta = vi.fn()
    const messages = [
      msg('gammalt', 'k1', false, 1),
      msg('x1', 'u1', true, 2), msg('x2', 'k1', true, 3), msg('x3', 'u1', true, 4), msg('x4', 'k1', true, 5),
    ]
    render(<MemoryRouter><MessagesSection messages={messages} consultant={konsulent} onSendMessage={vi.fn()} loading={false} onLasta={onLasta} /></MemoryRouter>)
    await new Promise((r) => setTimeout(r, 0))
    expect(onLasta).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Visa 1 äldre|Visa äldre|Show/i }))
    await waitFor(() => expect(onLasta).toHaveBeenCalledWith(['gammalt']))
  })

  it('inget anrop medan listan laddar', async () => {
    const onLasta = vi.fn()
    render(<MemoryRouter><MessagesSection messages={[msg('b', 'k1', false, 2)]} consultant={konsulent} onSendMessage={vi.fn()} loading onLasta={onLasta} /></MemoryRouter>)
    await new Promise((r) => setTimeout(r, 0))
    expect(onLasta).not.toHaveBeenCalled()
  })
})
