import { describe, it, expect, vi, beforeEach } from 'vitest'

const insert = vi.fn<(rad: Record<string, unknown>) => Promise<{ error: unknown }>>(async () => ({ error: null }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(() => ({ insert })) },
}))

import { langtDatum, notisOgiltigFranvaro, notisPassAndrat, notisPlanSkapad } from './aktivitetNotiser'
import type { ActivityPlan, ActivitySession } from './aktivitetApi'

const plan = (o: Partial<ActivityPlan> = {}): ActivityPlan => ({
  id: 'plan1', participant_id: 'delt', consultant_id: 'kons', org_id: null, template_id: null, template_name: 'Verkstad',
  start_date: '2026-09-07', end_date: null, weekly_hours_target: 30, jobsearch_hours_per_week: 5, target_reason: null,
  status: 'active', plan_text: null, decided_at: null, forsorjningshinder: null, nedsattning_underlag_lamnat_at: null,
  af_registered_at: null, created_at: '', updated_at: '', ...o,
})
const pass = (o: Partial<ActivitySession> = {}): ActivitySession => ({
  id: 's1', plan_id: 'plan1', participant_id: 'delt', date: '2026-09-07', start_time: '09:00', end_time: '12:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null, attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
})

beforeEach(() => { insert.mockClear(); insert.mockResolvedValue({ error: null }) })

describe('aktivitetNotiser', () => {
  it('langtDatum tolkar strängen utan Date', () => {
    expect(langtDatum('2026-09-07')).toBe('7 september')
    expect(langtDatum('2026-12-31')).toBe('31 december')
  })

  it('planskapad-notisen går till deltagaren med rätt typ, länk utan # och veckomålet i texten', async () => {
    await notisPlanSkapad(plan())
    expect(insert).toHaveBeenCalledTimes(1)
    const rad = insert.mock.calls[0][0]
    expect(rad).toMatchObject({ user_id: 'delt', type: 'aktivitet_plan', title: 'Din vecka är planerad', action_url: '/min-vecka' })
    expect(rad.message).toContain('7 september')
    expect(rad.message).toContain('30 timmar')
    expect(rad.data).toEqual({ plan_id: 'plan1', date: '2026-09-07' })
  })

  it('passändring skiljer på tillagt, borttaget och ändrat', async () => {
    await notisPassAndrat(pass(), { typ: 'tillagt' })
    await notisPassAndrat(pass(), { typ: 'borttaget' })
    await notisPassAndrat(pass({ start_time: '13:00', end_time: '15:00' }), { typ: 'andrat' })
    const texter = insert.mock.calls.map((c) => String(c[0].message))
    expect(texter[0]).toMatch(/nytt pass.*Jobbsökarverkstad.*7 september kl 09:00–12:00/)
    expect(texter[1]).toMatch(/borttaget/)
    expect(texter[2]).toMatch(/ändrat.*13:00–15:00/)
    expect(insert.mock.calls.every((c) => c[0].type === 'aktivitet_pass')).toBe(true)
  })

  it('ogiltig frånvaro skrivs som uppgift med uppmaning, inte dom', async () => {
    await notisOgiltigFranvaro(pass({ date: '2026-09-08' }))
    const rad = insert.mock.calls[0][0]
    expect(rad.type).toBe('aktivitet_franvaro')
    expect(rad.message).toBe('Ett pass den 8 september är markerat som frånvaro utan giltigt skäl. Prata med din konsulent om du har ett skäl.')
  })

  it('kastar när databasen svarar med fel — anroparen avgör', async () => {
    insert.mockResolvedValueOnce({ error: { message: '42501' } })
    await expect(notisPlanSkapad(plan())).rejects.toBeTruthy()
  })
})
