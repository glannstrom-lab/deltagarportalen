/**
 * DagensPass — vägen till gruppnärvaron (RK36, rollspelet 2026-09-27).
 * Motprov (kört): låt gemensammaPass godta en enda deltagare (`>= 1`) →
 * testet "ett ensamt pass får ingen grupplänk" faller.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PassIdag } from '@/lib/dagensPass'

const hamta = vi.hoisted(() => vi.fn())
vi.mock('@/lib/dagensPass', async () => {
  const faktisk = await vi.importActual<typeof import('@/lib/dagensPass')>('@/lib/dagensPass')
  return { ...faktisk, hamtaDagensPass: hamta }
})
vi.mock('@/services/aktivitetApi', () => ({ aktivitetsplanApi: { markAttendance: vi.fn() } }))
vi.mock('@/lib/toast', () => ({ notifications: { error: vi.fn(), success: vi.fn() } }))

import { DagensPass } from './DagensPass'

const pass = (o: Partial<PassIdag>): PassIdag => ({
  id: 's', participant_id: 'anna', plan_id: 'p', date: '2026-09-28', start_time: '09:00:00', end_time: '12:00:00',
  title: 'Jobbsökarverkstad', attendance: null, self_checkin_at: null, ...o,
})

beforeEach(() => hamta.mockReset())
afterEach(() => cleanup())

describe('DagensPass → gruppnärvaro', () => {
  it('ett pass med flera deltagare får "Markera hela passet" med länk till gruppvyn', async () => {
    hamta.mockResolvedValue([pass({ id: '1', participant_id: 'anna' }), pass({ id: '2', participant_id: 'lisa' })])
    render(<MemoryRouter><DagensPass namnFor={(id) => id} /></MemoryRouter>)
    const lank = await screen.findByRole('link', { name: /Markera hela passet: Jobbsökarverkstad 09:00–12:00 \(2 deltagare\)/ })
    expect(lank.getAttribute('href')).toBe('/consultant/pass/grupp?datum=2026-09-28&start=09%3A00&slut=12%3A00&titel=Jobbs%C3%B6karverkstad')
    expect(screen.getByRole('link', { name: 'Närvaro per pass' })).toHaveAttribute('href', '/consultant/pass/grupp')
  })

  it('ett ensamt pass får ingen grupplänk', async () => {
    hamta.mockResolvedValue([pass({ id: '1' }), pass({ id: '2', title: 'Motivationsgrupp' })])
    render(<MemoryRouter><DagensPass namnFor={(id) => id} /></MemoryRouter>)
    await screen.findByText('Motivationsgrupp', { exact: false })
    expect(screen.queryByRole('link', { name: /Markera hela passet/ })).not.toBeInTheDocument()
  })
})
