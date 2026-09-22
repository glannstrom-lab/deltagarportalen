/**
 * /api/ai tappade rader i ai_usage_logs och loggade aldrig ett misslyckande
 * (2026-09-22, loggagentens fynd).
 *
 *  1. `void logAiUsage(...)` följt av `res.json(...)`: Vercel kan frysa eller
 *     återvinna instansen när svaret gått iväg, innan insertet hunnit ut.
 *     I kväll: 8 lyckade svar i funktionsloggen, 3 rader i tabellen.
 *  2. `success`/`error_message` fylldes aldrig — kolumnen har default true,
 *     så alla 149 rader i prod sa "lyckat".
 *  3. Felvägarna (502 från OpenRouter, tomt svar efter resonemang, strömmens
 *     felgren) loggade ingenting alls — fast ett tomt svar efter resonemang
 *     har bränt tokens som taket (`checkDailyTokenCap`) ska se.
 *
 * Testet kör den riktiga handlern och kräver att insertet är KLART när
 * handlern returnerar — det är så "awaitat" ser ut utifrån.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const AI = resolve(__dirname, '../../api/ai.js')
const LOGG = resolve(__dirname, '../../api/_utils/ai-usage-log.js')

function laddaHandler() {
  // ai-usage-log läser env vid laddning — ladda båda färskt efter att env satts.
  delete require.cache[LOGG]
  delete require.cache[AI]
  return require(AI) as (req: unknown, res: unknown) => Promise<unknown>
}

function makeRes() {
  const captured: { status: number; body: Record<string, unknown> | null; skrivet: string[] } = { status: 0, body: null, skrivet: [] }
  const res = {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    setHeader: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    status(code: number) { captured.status = code; res.statusCode = code; return res },
    json(body: Record<string, unknown>) { captured.body = body; res.writableEnded = true; return res },
    write(s: string) { captured.skrivet.push(s); return true },
    end() { res.writableEnded = true },
  }
  return { res, captured }
}

type Insert = Record<string, unknown> & { klar: boolean }

function stubNetwork(openRouter: (body: Record<string, unknown>) => Response) {
  const inserts: Insert[] = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) return openRouter(JSON.parse(init?.body || '{}'))
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
    if (url.includes('/rest/v1/profiles')) return json({ ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true })
    if (url.includes('/rest/v1/my_ai_policy')) return json([])
    if (url.includes('/rest/v1/organization_members') || url.includes('/rest/v1/organization')) return json([])
    if (url.includes('/rest/v1/ai_usage_logs') && method === 'POST') {
      const rad: Insert = { ...JSON.parse(init?.body || '{}'), klar: false }
      inserts.push(rad)
      // Databasen svarar inte omedelbart. Ett `void`-anrop hinner inte hit
      // innan handlern returnerat.
      await new Promise((r) => setTimeout(r, 30))
      rad.klar = true
      return new Response(null, { status: 201 })
    }
    if (url.includes('/rest/v1/ai_usage_logs')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { inserts }
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

const req = (fn: string, data: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  method: 'POST',
  headers: { authorization: 'Bearer tok', origin: 'https://jobin.se' },
  body: { function: fn, data, ...extra },
})

const okSvar = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('/api/ai loggar varje anrop — awaitat och med utfall', () => {
  it('lyckat svar: raden är skriven INNAN handlern returnerar, success=true', async () => {
    const { inserts } = stubNetwork(() => okSvar({ choices: [{ message: { content: 'svar' } }], usage: { total_tokens: 321 } }))
    const handler = laddaHandler()
    const { res, captured } = makeRes()

    await handler(req('chatbot', { meddelande: 'Hej' }), res)

    expect(captured.status).toBe(200)
    expect(inserts).toHaveLength(1)
    expect(inserts[0].klar, 'insertet var inte klart när handlern returnerade (void i stället för await)').toBe(true)
    expect(inserts[0]).toMatchObject({ function_name: 'chatbot', tokens_used: 321, success: true, error_message: null })
  })

  it('tomt svar efter resonemang: 502, men tokens räknas och success=false', async () => {
    const { inserts } = stubNetwork(() =>
      okSvar({ choices: [{ message: { content: '' }, finish_reason: 'length' }], usage: { total_tokens: 800 } })
    )
    const handler = laddaHandler()
    const { res, captured } = makeRes()

    await handler(req('chatbot', { meddelande: 'Hej' }), res)

    expect(captured.status).toBe(502)
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ tokens_used: 800, success: false })
    expect(String(inserts[0].error_message)).toContain('length')
  })

  it('OpenRouter 400: 502 och en rad med success=false', async () => {
    const { inserts } = stubNetwork(() => new Response('bad', { status: 400 }))
    const handler = laddaHandler()
    const { res, captured } = makeRes()

    await handler(req('chatbot', { meddelande: 'Hej' }), res)

    expect(captured.status).toBe(502)
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ success: false, tokens_used: 0 })
  })

  it('strömmens felgren (OpenRouter svarar inte ok) loggas också', async () => {
    const { inserts } = stubNetwork(() => new Response('upstream', { status: 503 }))
    const handler = laddaHandler()
    const { res, captured } = makeRes()

    await handler(req('ai-team-chat', { meddelande: 'Hej', agentTyp: 'arbetskonsulent' }, { stream: true }), res)

    expect(captured.skrivet.join('')).toContain('error')
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ success: false, function_name: 'ai-team-chat' })
    expect(inserts[0].klar).toBe(true)
  })
})
