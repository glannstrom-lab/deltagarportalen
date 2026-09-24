/**
 * Personalens AI-funktion gick att anropa för vem som helst (2026-09-24).
 *
 * `konsulent-rapportutkast` står i AI_ENABLED_EXEMPT_FUNCTIONS: den slipper
 * den inloggades egen AI-brytare och deltagarens organisationsspärr
 * (`my_ai_policy`), eftersom den behandlar en ANNAN persons data på uppdrag av
 * en konsulent. I stället gäller personalens organisationsspärr, som läser
 * `organization_members`. Men servern kontrollerade aldrig att anroparen VAR
 * personal. En deltagare — som inte står i `organization_members` — kunde
 * POSTa funktionen direkt och skicka text till OpenRouter trots att hennes
 * kommun stängt av AI och trots att hon själv pausat AI.
 *
 * Den riktiga handlern, stubbat nät.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const AI = resolve(__dirname, '../../api/ai.js')

function laddaHandler() {
  delete require.cache[AI]
  return require(AI) as (req: unknown, res: unknown) => Promise<unknown>
}

function makeRes() {
  const captured: { status: number; body: Record<string, unknown> | null } = { status: 0, body: null }
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    status(code: number) { captured.status = code; res.statusCode = code; return res },
    json(body: Record<string, unknown>) { captured.body = body; return res },
    end: vi.fn(),
  }
  return { res, captured }
}

function stubNetwork(profil: Record<string, unknown>) {
  const openrouter: unknown[] = []
  global.fetch = vi.fn(async (input: unknown, init?: { body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) {
      openrouter.push(JSON.parse(init?.body || '{}'))
      return json({ choices: [{ message: { content: 'Utkast' } }], usage: { total_tokens: 10 } })
    }
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
    if (url.includes('/rest/v1/profiles')) return json(profil)
    // Deltagarens kommun har stängt av AI.
    if (url.includes('/rest/v1/my_ai_policy')) return json([{ org_name: 'Testkommun', ai_enabled: false }])
    // Deltagare står inte i organization_members.
    if (url.includes('/rest/v1/organization_members')) return json([])
    if (url.includes('/rest/v1/ai_usage_logs')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${url}`)
  }) as unknown as typeof fetch
  return { openrouter }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.OPENROUTER_API_KEY = 'or-stub'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  delete process.env.SUPABASE_SERVICE_KEY
  delete process.env.SENTRY_DSN
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

const req = () => ({
  method: 'POST',
  headers: { authorization: 'Bearer tok' },
  body: { function: 'konsulent-rapportutkast', data: { entries: [{ date: '2026-09-01', content: 'Min egen text' }] } },
})

describe('/api/ai: konsulent-rapportutkast kräver personalroll', () => {
  it('en deltagare (USER) nekas — ingenting går till OpenRouter', async () => {
    const { openrouter } = stubNetwork({ role: 'USER', roles: ['USER'], ai_enabled: false })
    const { res, captured } = makeRes()

    await laddaHandler()(req(), res)

    expect(captured.status).toBe(403)
    expect(captured.body).toMatchObject({ reason: 'not_staff' })
    expect(openrouter).toHaveLength(0)
  })

  it('uppslagsfel → nekas (fail closed)', async () => {
    const { openrouter } = stubNetwork({})
    global.fetch = vi.fn(async (input: unknown) => {
      const url = String(input)
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
      if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
      if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
      if (url.includes('/rest/v1/profiles')) return json({ message: 'nere' }, 500)
      throw new Error(`Oväntat nätverksanrop i test: ${url}`)
    }) as unknown as typeof fetch
    const { res, captured } = makeRes()

    await laddaHandler()(req(), res)

    expect(captured.status).toBe(403)
    expect(openrouter).toHaveLength(0)
  })

  it('en konsulent släpps igenom (roll i roles-arrayen räcker)', async () => {
    const { openrouter } = stubNetwork({ role: 'USER', roles: ['USER', 'CONSULTANT'] })
    const { res, captured } = makeRes()

    await laddaHandler()(req(), res)

    expect(captured.status).toBe(200)
    expect(openrouter).toHaveLength(1)
  })
})
