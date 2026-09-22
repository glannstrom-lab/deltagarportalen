/**
 * SSE-grenen i /api/ai (`ai-team-chat` + `stream: true`) avbröt aldrig
 * uppströms (2026-09-22).
 *
 * Tre fel i samma gren:
 *  1. Kopplade klienten ner — användaren stängde fliken eller bytte sida — läste
 *     funktionen ändå OpenRouter-strömmen till slut. Vi betalade för hela svaret.
 *  2. Därefter kördes ETT ANDRA OpenRouter-anrop (följdfrågorna) till en klient
 *     som inte längre fanns.
 *  3. Ingen tidsgräns: en ström som hängde höll funktionen till Vercels
 *     maxDuration (60 s) och dog då utan `[DONE]`, utan loggrad i
 *     ai_usage_logs — tokentaket såg aldrig anropet.
 *
 * Varför `res.on('close')` och inte `req.on('close')`: sedan Node 16 skickar
 * IncomingMessage 'close' när request-KROPPEN är färdigläst, inte när
 * anslutningen bryts. På Vercel är kroppen redan tolkad när handlern körs, så
 * en lyssnare på req hade antingen aldrig avfyrats eller avbrutit varje ström.
 * ServerResponse 'close' + `!res.writableEnded` är den säkra signalen.
 *
 * Kan inte provas mot dev (501) — därför den riktiga handlern med stubbat nät.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const handler = require('../../api/ai.js') as (req: unknown, res: unknown) => Promise<unknown>

type Res = EventEmitter & {
  statusCode: number
  headersSent: boolean
  writableEnded: boolean
  skrivet: string[]
  setHeader: (...a: unknown[]) => void
  status: (c: number) => Res
  json: (b: unknown) => Res
  write: (s: string) => boolean
  end: () => void
}

function makeRes(): Res {
  const res = new EventEmitter() as Res
  res.statusCode = 200
  res.headersSent = false
  res.writableEnded = false
  res.skrivet = []
  res.setHeader = vi.fn()
  res.status = (c: number) => { res.statusCode = c; return res }
  res.json = (b: unknown) => { res.skrivet.push(JSON.stringify(b)); res.writableEnded = true; return res }
  res.write = (s: string) => { res.headersSent = true; res.skrivet.push(s); return true }
  res.end = () => { res.writableEnded = true; res.emit('close') }
  return res
}

const kodare = new TextEncoder()
const sseRad = (token: string) =>
  kodare.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: token } }] })}\n\n`)

/**
 * OpenRouter-strömmen: en första token direkt, sedan HÄNGER den tills
 * anropets signal avbryts. Utan en signal slutar den av sig själv efter
 * `sjalvslut` ms, så att ett test mot den gamla koden faller på sina
 * påståenden i stället för att hänga.
 */
function stubNetwork(opts: { sjalvslut?: number } = {}) {
  const anrop: Array<{ url: string; body: Record<string, unknown>; signal?: AbortSignal }> = []
  global.fetch = vi.fn(async (input: unknown, init?: { body?: string; signal?: AbortSignal }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('openrouter.ai')) {
      const body = JSON.parse(init?.body || '{}')
      anrop.push({ url, body, signal: init?.signal })
      if (!body.stream) {
        return json({ choices: [{ message: { content: '["a?","b?","c?"]' } }] })
      }
      const signal = init?.signal
      const strom = new ReadableStream<Uint8Array>({
        start(ctrl) {
          ctrl.enqueue(sseRad('Hej'))
          const slut = () => {
            try { ctrl.enqueue(sseRad(' igen')); ctrl.close() } catch { /* redan stängd */ }
          }
          const timer = setTimeout(slut, opts.sjalvslut ?? 50)
          signal?.addEventListener('abort', () => {
            clearTimeout(timer)
            try { ctrl.error(signal.reason ?? new DOMException('Aborted', 'AbortError')) } catch { /* */ }
          })
        },
      })
      return new Response(strom, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
    }
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', user: { id: 'u1' }, aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([])
    if (url.includes('/rest/v1/profiles')) return json({ ai_consent_at: '2026-08-01T10:00:00Z', ai_enabled: true })
    if (url.includes('/rest/v1/my_ai_policy')) return json([])
    if (url.includes('/rest/v1/ai_usage_logs')) return json([])
    throw new Error(`Oväntat nätverksanrop i test: ${url}`)
  }) as unknown as typeof fetch
  return { anrop }
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
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const req = () => ({
  method: 'POST',
  headers: { authorization: 'Bearer tok', origin: 'https://jobin.se' },
  body: { function: 'ai-team-chat', stream: true, data: { meddelande: 'Hur skriver jag ett CV?', agentTyp: 'arbetskonsulent' } },
})

/** Väntar tills första token skrivits till klienten. */
async function vantaPaForstaToken(res: Res) {
  for (let i = 0; i < 200 && !res.skrivet.some((s) => s.includes('Hej')); i++) {
    await new Promise((r) => setImmediate(r))
  }
  expect(res.skrivet.some((s) => s.includes('Hej'))).toBe(true)
}

describe('/api/ai SSE: klientnedkoppling och tidsgräns', () => {
  it('normalfallet: tokens, följdfrågor och [DONE] som förut', async () => {
    const { anrop } = stubNetwork()
    const res = makeRes()

    await handler(req(), res)

    const text = res.skrivet.join('')
    expect(text).toContain('Hej')
    expect(text).toContain('igen')
    expect(text).toContain('suggestions')
    expect(text).toContain('[DONE]')
    expect(anrop).toHaveLength(2)
  })

  it('klienten kopplar ner mitt i strömmen → uppströms avbryts, inga följdfrågor', async () => {
    const { anrop } = stubNetwork({ sjalvslut: 300 })
    const res = makeRes()

    const klar = handler(req(), res)
    await vantaPaForstaToken(res)
    res.emit('close') // anslutningen bröts, svaret är INTE avslutat

    await klar

    expect(anrop[0].signal, 'strömanropet saknar AbortSignal').toBeDefined()
    expect(anrop[0].signal!.aborted).toBe(true)
    // Inget andra OpenRouter-anrop till en klient som inte finns.
    expect(anrop.filter((a) => a.url.includes('openrouter.ai'))).toHaveLength(1)
    expect(res.skrivet.join('')).not.toContain('igen')
  })

  it('en ström som hänger avbryts av tidsgränsen och får ett ärligt slut', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { anrop } = stubNetwork({ sjalvslut: 10 * 60_000 })
    const res = makeRes()

    const klar = handler(req(), res)
    await vantaPaForstaToken(res)
    await vi.advanceTimersByTimeAsync(60_000)
    await klar

    expect(anrop[0].signal, 'strömanropet saknar AbortSignal').toBeDefined()
    expect(anrop[0].signal!.aborted).toBe(true)
    const text = res.skrivet.join('')
    expect(text).toMatch(/"error"/)
    expect(text).toContain('[DONE]')
    expect(res.writableEnded).toBe(true)
  })
})
