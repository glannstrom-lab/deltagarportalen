/**
 * consentApi — portalens ENDA väg till samtycken (MV1, 2026-08-21). Filen
 * hade inga egna tester fram till 2026-09-22 (kvalitetsgenomgången).
 *
 * Klienten är mockad i PROD-FORM, mätt mot pg_proc 2026-09-22:
 *   grant_consent(p_consent_type text) → boolean, withdraw_consent(consent_type text) → boolean.
 * Båda returnerar TRUE eller kastar (RAISE EXCEPTION vid okänd typ). PostgREST
 * ger alltså `{ data: true, error: null }` eller `{ data: null, error }`.
 *
 * Det som vaktas: att ett fel ALDRIG sväljs. Ett återkallat samtycke som ser
 * återkallat ut men inte är det betyder fortsatt behandling av hälsodata utan
 * grund (art. 7.3); ett givet som inte registrerats saknar bevis (art. 7.1).
 *
 * Mutationer (kontrollerade): svälj felet i aterkallaSamtycke (`if (error)
 * return`) → tre tester faller; svälj i beviljaSamtycke → två faller; skicka
 * `p_consent_type` till withdraw_consent → två faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type RpcSvar = { data: boolean | null; error: { code: string; message: string } | null }
const rpc = vi.fn(async (_namn: string, _args: Record<string, unknown>): Promise<RpcSvar> => ({ data: true, error: null }))

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: (namn: string, args: Record<string, unknown>) => rpc(namn, args) },
}))

import {
  beviljaSamtycke,
  aterkallaSamtycke,
  vaxlaSamtycke,
  SamtyckesFel,
  SAMTYCKESKOLUMN,
} from './consentApi'

const OK: RpcSvar = { data: true, error: null }
const RLS: RpcSvar = { data: null, error: { code: '42501', message: 'permission denied for function withdraw_consent' } }

beforeEach(() => {
  rpc.mockReset()
  rpc.mockResolvedValue(OK)
})

describe('beviljaSamtycke', () => {
  it('anropar grant_consent med p_consent_type', async () => {
    await expect(beviljaSamtycke('wellness_data')).resolves.toBeUndefined()
    expect(rpc).toHaveBeenCalledWith('grant_consent', { p_consent_type: 'wellness_data' })
  })

  it('KASTAR SamtyckesFel när databasen nekar — ett samtycke utan registrering får inte se givet ut', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } })
    const fel = await beviljaSamtycke('health_data').catch((e: unknown) => e)
    expect(fel).toBeInstanceOf(SamtyckesFel)
    expect((fel as SamtyckesFel).typ).toBe('health_data')
  })
})

describe('aterkallaSamtycke', () => {
  it('anropar withdraw_consent med consent_type (inte p_consent_type — så heter parametern i databasen)', async () => {
    await aterkallaSamtycke('ai_processing')
    expect(rpc).toHaveBeenCalledWith('withdraw_consent', { consent_type: 'ai_processing' })
  })

  it('KASTAR när återkallelsen nekas — den får aldrig se genomförd ut', async () => {
    rpc.mockResolvedValue(RLS)
    const fel = await aterkallaSamtycke('health_data').catch((e: unknown) => e)
    expect(fel).toBeInstanceOf(SamtyckesFel)
    expect((fel as SamtyckesFel).typ).toBe('health_data')
    expect((fel as SamtyckesFel).orsak).toEqual(RLS.error)
  })

  it('KASTAR på okänd typ från databasen (RAISE EXCEPTION)', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'Invalid consent type: x' } })
    await expect(aterkallaSamtycke('marketing')).rejects.toBeInstanceOf(SamtyckesFel)
  })
})

describe('vaxlaSamtycke', () => {
  it('med ett nuvarande värde återkallas samtycket; ett fel propagerar i stället för att ge null', async () => {
    rpc.mockResolvedValue(RLS)
    await expect(vaxlaSamtycke('wellness_data', '2026-08-01T10:00:00Z')).rejects.toBeInstanceOf(SamtyckesFel)
    expect(rpc).toHaveBeenCalledWith('withdraw_consent', { consent_type: 'wellness_data' })
  })

  it('utan nuvarande värde ges samtycket; ett fel propagerar i stället för att ge en tidsstämpel', async () => {
    rpc.mockResolvedValue(RLS)
    await expect(vaxlaSamtycke('wellness_data', null)).rejects.toBeInstanceOf(SamtyckesFel)
    expect(rpc).toHaveBeenCalledWith('grant_consent', { p_consent_type: 'wellness_data' })
  })

  it('lyckade växlingar: null efter återkallelse, en tidsstämpel efter givande', async () => {
    await expect(vaxlaSamtycke('health_data', '2026-08-01T10:00:00Z')).resolves.toBeNull()
    await expect(vaxlaSamtycke('health_data', null)).resolves.toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('SAMTYCKESKOLUMN speglar CASE-satsen i grant_consent/withdraw_consent (prod 2026-09-22)', () => {
  it('samma sex typer och kolumner', () => {
    expect(SAMTYCKESKOLUMN).toEqual({
      terms: 'terms_accepted_at',
      privacy: 'privacy_accepted_at',
      ai_processing: 'ai_consent_at',
      marketing: 'marketing_consent_at',
      health_data: 'health_consent_at',
      wellness_data: 'wellness_consent_at',
    })
  })
})
