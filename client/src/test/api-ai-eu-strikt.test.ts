/**
 * KF8 (beslut Mikael 2026-10-18): konton kopplade till en organisation får bara
 * Bedrock i Irland, utan reserv utanför EU. Fristående deltagare behåller reserven.
 * Den riktiga handlern, stubbat nät — vi läser vad som faktiskt skickas till OpenRouter.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const AI = resolve(__dirname, '../../api/ai.js')
const ladda = () => { delete require.cache[AI]; return require(AI) as ((req: unknown, res: unknown) => Promise<unknown>) & { OPENROUTER_PROVIDER_EU_STRIKT: { allow_fallbacks: boolean; order: string[] } } }

function makeRes() {
  const captured: { status: number } = { status: 0 }
  const res = { statusCode: 200, setHeader: vi.fn(), end: vi.fn(),
    status(c: number) { captured.status = c; res.statusCode = c; return res }, json() { return res } }
  return { res, captured }
}

function stubNetwork(opt: { policy: unknown[]; medlemskap: unknown[]; profil: Record<string, unknown> }) {
  const openrouter: Array<{ provider?: { allow_fallbacks?: boolean; order?: string[] } }> = []
  global.fetch = vi.fn(async (input: unknown, init?: { body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) { openrouter.push(JSON.parse(init?.body || '{}')); return json({ choices: [{ message: { content: 'Svar' } }], usage: { total_tokens: 5 } }) }
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
    if (url.includes('/rest/v1/profiles')) return json(opt.profil)
    if (url.includes('/rest/v1/my_ai_policy')) return json(opt.policy)
    if (url.includes('/rest/v1/organization_members')) return json(opt.medlemskap)
    if (url.includes('/rest/v1/ai_usage_logs')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${url}`)
  }) as unknown as typeof fetch
  return { openrouter }
}

const ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SENTRY_DSN']
const sparat: Record<string, string | undefined> = {}
const orig = global.fetch
beforeEach(() => {
  for (const k of ENV) sparat[k] = process.env[k]
  Object.assign(process.env, { VITE_SUPABASE_URL: 'https://stub.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon', OPENROUTER_API_KEY: 'or', SUPABASE_SERVICE_ROLE_KEY: 'svc' })
  delete process.env.SENTRY_DSN
  vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { for (const k of ENV) { if (sparat[k] === undefined) delete process.env[k]; else process.env[k] = sparat[k] } global.fetch = orig; vi.restoreAllMocks() })

const anrop = (fn: string, data: unknown) => ({ method: 'POST', headers: { authorization: 'Bearer t' }, body: { function: fn, data } })

describe('KF8: AI i EU för organisationers konton', () => {
  it('den strikta inställningen tillåter ingen reserv och bara Irland', () => {
    expect(ladda().OPENROUTER_PROVIDER_EU_STRIKT).toMatchObject({ allow_fallbacks: false, order: ['amazon-bedrock/eu-west-1'] })
  })

  it('deltagare kopplad till en organisation → strikt EU', async () => {
    const { openrouter } = stubNetwork({ policy: [{ org_name: 'Testkommun', ai_enabled: true }], medlemskap: [], profil: { ai_enabled: true, ai_consent_at: '2026-01-01' } })
    const { res, captured } = makeRes()
    await ladda()(anrop('chatbot', { message: 'Hej' }), res)
    expect(captured.status).toBe(200)
    expect(openrouter[0]?.provider).toMatchObject({ allow_fallbacks: false })
  })

  it('fristående deltagare → reserven finns kvar', async () => {
    const { openrouter } = stubNetwork({ policy: [], medlemskap: [], profil: { ai_enabled: true, ai_consent_at: '2026-01-01' } })
    const { res, captured } = makeRes()
    await ladda()(anrop('chatbot', { message: 'Hej' }), res)
    expect(captured.status).toBe(200)
    expect(openrouter[0]?.provider).toMatchObject({ allow_fallbacks: true })
  })

  it('personal i en organisation (konsulentfunktion) → strikt EU', async () => {
    const { openrouter } = stubNetwork({ policy: [], medlemskap: [{ org_id: 'o', organizations: { name: 'Testkommun', ai_enabled: true } }], profil: { role: 'USER', roles: ['USER', 'CONSULTANT'] } })
    const { res, captured } = makeRes()
    await ladda()(anrop('konsulent-rapportutkast', { entries: [{ date: '2026-10-01', content: 'x' }] }), res)
    expect(captured.status).toBe(200)
    expect(openrouter[0]?.provider).toMatchObject({ allow_fallbacks: false })
  })
})
