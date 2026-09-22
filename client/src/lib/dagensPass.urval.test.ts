/**
 * hamtaDagensPass — urvalet får inte lämnas åt RLS (drift-genomgången 2026-09-22).
 *
 * `activity_sessions` har tre SELECT-vägar: deltagaren, planens konsulent och
 * "Organisationens chef läser pass". En chef/admin fick därför hela
 * organisationens pass i "Min dag" — deltagare utanför hennes lista ("okänd")
 * med närvaroknappar som skrivpolicyn sedan nekar.
 *
 * Mutation (kontrollerad): ta bort `.in('plan_id', planIds)` → test 1 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Rad = Record<string, unknown>
const PASS: Rad[] = [
  { id: 's-egen', plan_id: 'plan-egen', participant_id: 'd1', date: '2026-09-22' },
  { id: 's-kollega', plan_id: 'plan-kollega', participant_id: 'd9', date: '2026-09-22' },
]
const PLANER: Rad[] = [
  { id: 'plan-egen', consultant_id: 'konsulent-1' },
  { id: 'plan-kollega', consultant_id: 'kollega-2' },
]
let egnaPlaner: Rad[] = PLANER

vi.mock('@/lib/supabase', () => {
  const fraga = (tabell: string) => {
    let rader = tabell === 'activity_plans' ? egnaPlaner : PASS
    const b: Record<string, unknown> = {}
    b.select = () => b
    b.eq = (k: string, v: unknown) => { rader = rader.filter(r => !(k in r) || r[k] === v); return b }
    b.in = (k: string, v: unknown[]) => { rader = rader.filter(r => v.includes(r[k])); return b }
    b.order = () => b
    b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve({ data: rader, error: null }).then(res, rej)
    return b
  }
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }) },
      from: (t: string) => fraga(t),
    },
  }
})

import { hamtaDagensPass } from './dagensPass'

beforeEach(() => {
  egnaPlaner = PLANER
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-22T10:00:00') })
})

describe('hamtaDagensPass', () => {
  it('visar bara pass i den inloggades egna planer — inte hela organisationens', async () => {
    const pass = await hamtaDagensPass()
    expect(pass.map(p => p.id)).toEqual(['s-egen'])
    vi.useRealTimers()
  })

  it('utan egna planer: tom lista, ingen fråga som släpper igenom allt', async () => {
    egnaPlaner = []
    await expect(hamtaDagensPass()).resolves.toEqual([])
    vi.useRealTimers()
  })
})
