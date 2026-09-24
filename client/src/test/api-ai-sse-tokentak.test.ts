/**
 * SSE-grenen i /api/ai (`ai-team-chat` + `stream: true`) — tokentaket och
 * strömfel (2026-09-24).
 *
 *  1. Tokentaket (`checkDailyTokenCap`) summerar ai_usage_logs. Strömgrenen
 *     loggade bara SVARETS längd / 4 — prompten (systemtext, användarkontext
 *     på upp till 4 000 tecken, historiken) räknades aldrig. Den enda
 *     strömmande funktionen var alltså i praktiken utanför dygnstaket.
 *  2. Historiken hade inget tak på antal poster. En direkt POST kunde bygga en
 *     prompt på över hundra tusen tokens i ett enda anrop. En historik som inte
 *     var en array gav TypeError och 500.
 *  3. OpenRouter skickar fel MITT I strömmen som en SSE-rad med `error`.
 *     Raden hoppades över, och klienten fick följdfrågor + [DONE] som om det
 *     avhuggna svaret vore helt.
 *
 * Kan inte provas mot dev (501) — den riktiga handlern med stubbat nät.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const AI = resolve(__dirname, '../../api/ai.js')
const LOGG = resolve(__dirname, '../../api/_utils/ai-usage-log.js')

function laddaAi() {
  // ai-usage-log läser env vid laddning — ladda båda färskt efter att env satts.
  delete require.cache[LOGG]
  delete require.cache[AI]
  return require(AI) as ((req: unknown, res: unknown) => Promise<unknown>) & {
    PROMPTS: Record<string, (d: unknown) => { system: string; user: string }>
  }
}

function makeRes() {
  const skrivet: string[] = []
  const res = {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    setHeader: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    status(code: number) { res.statusCode = code; return res },
    json(body: unknown) { skrivet.push(JSON.stringify(body)); res.writableEnded = true; return res },
    write(s: string) { res.headersSent = true; skrivet.push(s); return true },
    end() { res.writableEnded = true },
  }
  return { res, skrivet }
}

const kodare = new TextEncoder()
const rad = (obj: unknown) => kodare.encode(`data: ${JSON.stringify(obj)}\n\n`)

function stubNetwork(stromRader: unknown[]) {
  const loggrader: Array<Record<string, unknown>> = []
  const openrouter: Array<Record<string, unknown>> = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) {
      const body = JSON.parse(init?.body || '{}')
      openrouter.push(body)
      if (!body.stream) return json({ choices: [{ message: { content: '["a?","b?","c?"]' } }], usage: { total_tokens: 40 } })
      const strom = new ReadableStream<Uint8Array>({
        start(ctrl) {
          for (const r of stromRader) ctrl.enqueue(rad(r))
          ctrl.close()
        },
      })
      return new Response(strom, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
    }
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
    if (url.includes('/rest/v1/profiles')) return json({ ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true })
    if (url.includes('/rest/v1/my_ai_policy')) return json([])
    if (url.includes('/rest/v1/ai_usage_logs') && method === 'POST') {
      loggrader.push(JSON.parse(init?.body || '{}'))
      return new Response(null, { status: 201 })
    }
    if (url.includes('/rest/v1/ai_usage_logs')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { loggrader, openrouter }
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

const token = (t: string) => ({ choices: [{ delta: { content: t } }] })

const req = (data: Record<string, unknown>) => ({
  method: 'POST',
  headers: { authorization: 'Bearer tok', origin: 'https://jobin.se' },
  body: { function: 'ai-team-chat', stream: true, data },
})

describe('/api/ai SSE: tokentaket ser prompten', () => {
  it('loggar promptens storlek, inte bara svarets', async () => {
    const { loggrader } = stubNetwork([token('Kort svar.')])
    const { res } = makeRes()
    const kontext = 'x'.repeat(4000)

    await laddaAi()(req({ meddelande: 'Hej', userDataContext: kontext }), res)

    expect(loggrader).toHaveLength(1)
    // 4 000 tecken kontext ≈ 1 000 tokens. Det gamla värdet var ceil(10/4) = 3.
    expect(Number(loggrader[0].tokens_used)).toBeGreaterThanOrEqual(1000)
  })

  it('använder OpenRouters usage när strömmen bär den, plus följdfrågornas anrop', async () => {
    const { loggrader } = stubNetwork([token('Svar'), { choices: [], usage: { total_tokens: 2345 } }])
    const { res } = makeRes()

    await laddaAi()(req({ meddelande: 'Hej' }), res)

    expect(loggrader[0].tokens_used).toBe(2345 + 40)
  })
})

describe('/api/ai SSE: fel mitt i strömmen', () => {
  it('ett error-event från OpenRouter blir ett fel till klienten, inga följdfrågor', async () => {
    const { openrouter, loggrader } = stubNetwork([token('Början av ett'), { error: { code: 502, message: 'Provider returned error' } }])
    const { res, skrivet } = makeRes()

    await laddaAi()(req({ meddelande: 'Hej' }), res)

    const text = skrivet.join('')
    expect(text).toContain('Början av ett')
    expect(text).toMatch(/"error"/)
    expect(text).not.toContain('suggestions')
    expect(text).toContain('[DONE]')
    expect(openrouter).toHaveLength(1)
    expect(loggrader[0].success).toBe(false)
  })
})

describe('ai-team-chat/chatbot: historiken har ett tak', () => {
  const lang = Array.from({ length: 200 }, (_, i) => ({ roll: 'användare', innehall: `post-${i}-slut` }))

  it('ai-team-chat tar bara med de senaste 20 posterna', () => {
    const p = laddaAi().PROMPTS['ai-team-chat']({ meddelande: 'Hej', historik: lang })
    expect(p.user).toContain('post-199-slut')
    expect(p.user).toContain('post-180-slut')
    expect(p.user).not.toContain('post-179-slut')
  })

  it('chatbot tar bara med de senaste 20 posterna', () => {
    const p = laddaAi().PROMPTS['chatbot']({ meddelande: 'Hej', historik: lang })
    expect(p.user).toContain('post-199-slut')
    expect(p.user).not.toContain('post-179-slut')
  })

  it('en historik som inte är en array kastar inte', () => {
    const ai = laddaAi()
    expect(() => ai.PROMPTS['ai-team-chat']({ meddelande: 'Hej', historik: 'skräp' })).not.toThrow()
    expect(() => ai.PROMPTS['chatbot']({ meddelande: 'Hej', historik: { a: 1 } })).not.toThrow()
  })
})
