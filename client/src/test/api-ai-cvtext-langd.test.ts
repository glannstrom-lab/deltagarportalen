/**
 * CV-importen såg bara första halvan av ett normallångt CV (2026-09-24).
 *
 * `cv-import` och `cv-import-erfarenhet` läser `cvText.substring(0, 10000)`.
 * Men handlern sanerar all indata först, och saneringen kapade VARJE sträng
 * vid 5 000 tecken. Ett CV på två sidor är 5 000–9 000 tecken, och det som
 * föll bort var slutet — äldre tjänster och hela utbildningsavsnittet. Prompten
 * förbjuder (med rätta) modellen att gissa, så utbildningen kom tillbaka tom.
 *
 * Testet kör den riktiga handlern och läser vad som faktiskt gick till
 * OpenRouter.
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

function stubNetwork() {
  const prompter: string[] = []
  global.fetch = vi.fn(async (input: unknown, init?: { body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) {
      const body = JSON.parse(init?.body || '{}')
      prompter.push(body.messages?.[1]?.content || '')
      return json({ choices: [{ message: { content: '{"w":[],"e":[]}' } }], usage: { total_tokens: 10 } })
    }
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 9 }])
    if (url.includes('/rest/v1/profiles')) return json({ ai_consent_at: null, ai_enabled: true })
    if (url.includes('/rest/v1/my_ai_policy')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${url}`)
  }) as unknown as typeof fetch
  return { prompter }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.OPENROUTER_API_KEY = 'or-stub'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
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

describe('/api/ai: CV-importen får hela CV:t upp till promptens tak', () => {
  // Utbildningen står sist i ett CV — på tecken 8 000 i ett tvåsidigt CV.
  const cvText = 'Erfarenhet. '.repeat(650) + '\nUTBILDNING: Komvux Malmö 2015\n'

  it('text efter tecken 5 000 når modellen', async () => {
    expect(cvText.length).toBeGreaterThan(7000)
    const { prompter } = stubNetwork()
    const { res, captured } = makeRes()

    await laddaHandler()(
      { method: 'POST', headers: { authorization: 'Bearer tok' }, body: { function: 'cv-import-erfarenhet', data: { cvText } } },
      res,
    )

    expect(captured.status).toBe(200)
    expect(prompter[0]).toContain('UTBILDNING: Komvux Malmö 2015')
  })

  it('andra fält har kvar taket på 5 000 tecken', async () => {
    const { prompter } = stubNetwork()
    const { res } = makeRes()
    const annons = 'a'.repeat(5500) + 'SLUTMARKOR'

    await laddaHandler()(
      { method: 'POST', headers: { authorization: 'Bearer tok' }, body: { function: 'cv-jobbmatchning', data: { jobDescription: annons, cvText: 'kort' } } },
      res,
    )

    expect(prompter[0]).not.toContain('SLUTMARKOR')
  })
})
