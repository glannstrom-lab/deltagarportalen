/**
 * Mejl-cronerna skickade till reserverade testadresser (2026-09-22,
 * loggagentens fynd).
 *
 * Demodeltagaren har en `@example.com`-adress. Resend svarar 422 på den varje
 * kväll, `pass-paminnelse` räknar det som ett fel och larmar i Sentry — och en
 * kväll då demot är den enda med ett pass i morgon blir det "samtliga utskick
 * misslyckades", HTTP 500, alltså ett falskt driftlarm om att vägen ut är trasig.
 *
 * RFC 2606 / 6761 reserverar example.com/.org/.net och toppdomänerna .test,
 * .example, .invalid och .localhost. Ingen av dem kan någonsin ta emot post.
 * De räknas nu som överhoppade, inte som fel, och Resend anropas inte alls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
type Handler = (req: unknown, res: unknown) => Promise<void>

function ladda(fil: string): Handler {
  const p = resolve(__dirname, '../../api', fil)
  delete require.cache[require.resolve(p)]
  return require(p) as Handler
}

function makeRes() {
  const captured: { status: number; body: Record<string, unknown> | null } = { status: 200, body: null }
  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader: vi.fn(),
    status(code: number) { captured.status = code; res.statusCode = code; return res },
    json(body: Record<string, unknown>) { captured.body = body; return res },
    end: vi.fn(),
  }
  return { res, captured }
}

function stubNetwork(epost: string) {
  const resendAnrop: string[] = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.startsWith('https://api.resend.com')) {
      resendAnrop.push(init?.body || '')
      // Så svarar Resend på en reserverad domän.
      return json({ statusCode: 422, message: 'Invalid `to` field.' }, 422)
    }
    if (url.includes('/rest/v1/notifications') && method === 'PATCH') return json([])
    if (url.includes('/rest/v1/notifications')) {
      return json([{ id: 'n1', user_id: 'u1', type: 'aktivitet_paminnelse', title: 'I morgon: pass', message: 'm', data: {}, created_at: new Date().toISOString() }])
    }
    if (url.includes('/rest/v1/profiles')) return json({ email: epost, first_name: 'Demo' })
    if (url.includes('/rest/v1/user_preferences')) return json(null)
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { resendAnrop }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'EMAIL_FROM', 'CRON_SECRET', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  process.env.RESEND_API_KEY = 're_stub'
  process.env.EMAIL_FROM = 'Jobin <hej@jobin.se>'
  process.env.CRON_SECRET = 'hemligt'
  delete process.env.SENTRY_DSN
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

const cronReq = { method: 'GET', url: '/api/x', query: {}, headers: { authorization: 'Bearer hemligt' } }

describe.each(['pass-paminnelse.js', 'aktivitet-mejl.js'])('%s hoppar över reserverade domäner', (fil) => {
  it.each(['demo@example.com', 'x@EXAMPLE.org', 'y@sub.example.net', 'z@portal.test', 'q@a.invalid', 'w@demo.example'])(
    '%s → inget Resend-anrop, räknas som överhoppad, inte fel',
    async (epost) => {
      const { resendAnrop } = stubNetwork(epost)
      const { res, captured } = makeRes()

      await ladda(fil)(cronReq, res)

      expect(resendAnrop).toHaveLength(0)
      expect(captured.status).toBe(200)
      expect(captured.body).toMatchObject({ fel: 0, skickade: 0, reserverade: 1 })
    }
  )

  it('en riktig adress som råkar innehålla ordet går fortfarande iväg', async () => {
    const { resendAnrop } = stubNetwork('anna@example.com.se')
    const { res } = makeRes()

    await ladda(fil)(cronReq, res)

    expect(resendAnrop).toHaveLength(1)
  })
})
