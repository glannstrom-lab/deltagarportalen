import { describe, it, expect } from 'vitest'
import { beraknaPilotvy, type PilotMedlem } from './pilotvy'

const NU = new Date('2026-10-30T12:00:00Z')
const dagarSedan = (n: number) => new Date(NU.getTime() - n * 24 * 3600 * 1000).toISOString()

const orgs = [
  { id: 'o1', name: 'Hällefors kommun', kind: 'kommun' as const },
  { id: 'o2', name: 'Tom enhet', kind: 'kommun' as const },
]
const medlemmar: PilotMedlem[] = [
  { org_id: 'o1', user_id: 'k1', role: 'konsulent' },
  { org_id: 'o1', user_id: 'k2', role: 'konsulent' },
  { org_id: 'o1', user_id: 'c1', role: 'chef' },
  { org_id: 'o2', user_id: 'x1', role: 'arbetsgivare' },
]
const kopplingar = [
  { consultant_id: 'k1', participant_id: 'd1' },
  { consultant_id: 'k1', participant_id: 'd2' },
  { consultant_id: 'k2', participant_id: 'd2' }, // samma deltagare hos två konsulenter räknas en gång
  { consultant_id: 'annan', participant_id: 'd9' },
]

describe('beraknaPilotvy', () => {
  it('räknar aktiva konsulenter i fönstret och inte utanför det', () => {
    const [r] = beraknaPilotvy(
      orgs,
      medlemmar,
      kopplingar,
      [
        { user_id: 'k1', created_at: dagarSedan(2) },
        { user_id: 'k1', created_at: dagarSedan(3) }, // samma person räknas en gång
        { user_id: 'k2', created_at: dagarSedan(15) }, // utanför 14 dagar
        { user_id: 'okand', created_at: dagarSedan(1) }, // inte personal i organisationen
      ],
      NU,
    )
    expect(r.personal).toBe(3)
    expect(r.aktivaKonsulenter).toBe(1)
    expect(r.kopplade).toBe(2)
  })

  it('en organisation utan personal ger "—" (null), inte 0', () => {
    const [, tom] = beraknaPilotvy(orgs, medlemmar, kopplingar, [], NU)
    expect(tom.personal).toBe(0)
    expect(tom.aktivaKonsulenter).toBeNull()
    expect(tom.kopplade).toBeNull()
  })

  it('mått utan läsrätt (plan, pass, nämndunderlag) är null, aldrig 0', () => {
    const [r] = beraknaPilotvy(orgs, medlemmar, kopplingar, [], NU)
    expect(r.deltagareMedPlan).toBeNull()
    expect(r.loggadePass).toBeNull()
    expect(r.namndunderlag).toBeNull()
  })

  it('resultatet innehåller ingen persondata — inga id eller namn på deltagare eller konsulenter', () => {
    const rader = beraknaPilotvy(orgs, medlemmar, kopplingar, [{ user_id: 'k1', created_at: dagarSedan(1) }], NU)
    const json = JSON.stringify(rader)
    for (const hemlig of ['k1', 'k2', 'c1', 'd1', 'd2', 'd9', 'x1']) {
      expect(json).not.toContain(`"${hemlig}"`)
    }
  })
})
