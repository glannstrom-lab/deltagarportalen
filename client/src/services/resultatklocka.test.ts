/**
 * RR25 (resultatklockan) och RR24 ("förd över till MSFA"), rollspelet 2026-09-27.
 */
import { describe, it, expect, vi } from 'vitest'

const from = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (t: string) => from(t), auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'k1' } }, error: null })) } },
}))

import { arManad, betalKolumner, betalstatus, betalstatusDatum, msfaApi, nastaBetalsteg, resultatApi } from './resultatklocka'

const p = (o: Record<string, unknown> = {}) => ({ followup_3m: false, followup_6m: false, ...o })

describe('RR25: status per uppföljningspunkt', () => {
  it('ingen status innan uppföljningen är registrerad', () => {
    expect(betalstatus(p(), '3m')).toBeNull()
    expect(nastaBetalsteg(p(), '3m')).toEqual({ steg: null, skal: null })
  })

  it('registrerad uppföljning utan status väntar', () => {
    expect(betalstatus(p({ followup_3m: true }), '3m')).toBe('vantar')
    expect(betalstatus(p({ followup_3m: true, followup_3m_payment_status: 'okänt' }), '3m')).toBe('vantar')
  })

  it('verifiering kräver skriftligt underlag', () => {
    const muntligt = nastaBetalsteg(p({ followup_3m: true, followup_3m_evidence: 'deltagaren_muntligt' }), '3m')
    expect(muntligt.steg).toBeNull()
    if (muntligt.steg === null) expect(muntligt.skal).toMatch(/skriftligt underlag/)
    expect(nastaBetalsteg(p({ followup_3m: true }), '3m').steg).toBeNull()
    expect(nastaBetalsteg(p({ followup_3m: true, followup_3m_evidence: 'lonespecifikation' }), '3m')).toEqual({ steg: 'verifierad', knapp: 'Markera verifierad' })
  })

  it('stegen tas i ordning och tar slut vid fakturerad', () => {
    expect(nastaBetalsteg(p({ followup_6m: true, followup_6m_payment_status: 'verifierad' }), '6m')).toEqual({ steg: 'fakturerad', knapp: 'Markera fakturerad' })
    expect(nastaBetalsteg(p({ followup_6m: true, followup_6m_payment_status: 'fakturerad' }), '6m')).toEqual({ steg: null, skal: null })
    // Punkterna är oberoende: 6 mån säger inget om 3 mån.
    expect(betalstatus(p({ followup_3m: true, followup_6m: true, followup_6m_payment_status: 'fakturerad' }), '3m')).toBe('vantar')
  })

  it('datumet för statusen läses per punkt', () => {
    expect(betalstatusDatum(p({ followup_3m_payment_status_at: '2026-10-10T09:00:00Z' }), '3m')).toBe('2026-10-10T09:00:00Z')
    expect(betalstatusDatum(p(), '6m')).toBeNull()
  })

  it('kolumnerna är tomma före migrationen', () => {
    const nu = new Date('2026-10-10T09:00:00Z')
    expect(betalKolumner('3m', 'verifierad', 'k1', nu, false)).toEqual({})
    expect(betalKolumner('6m', 'fakturerad', 'k1', nu, true)).toEqual({
      followup_6m_payment_status: 'fakturerad', followup_6m_payment_status_at: '2026-10-10T09:00:00.000Z', followup_6m_payment_status_by: 'k1',
    })
  })

  it('sedan migrationen går skrivningarna till databasen', async () => {
    await resultatApi.sattBetalstatus('pl1', '3m', 'verifierad').catch(() => undefined)
    await msfaApi.markera({ id: 'plan', participant_id: 'p1', org_id: null }, '2026-09').catch(() => undefined)
    expect(from).toHaveBeenCalled()
  })

  it('månaden valideras', () => {
    expect(arManad('2026-09')).toBe(true)
    expect(arManad('2026-13')).toBe(false)
    expect(arManad('2026-9')).toBe(false)
  })
})
