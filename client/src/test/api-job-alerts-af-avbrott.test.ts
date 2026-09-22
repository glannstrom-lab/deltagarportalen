/**
 * Jobbevakningen flyttade fram sitt fönster när Arbetsförmedlingen inte svarade
 * (2026-09-22).
 *
 * `searchJobs()` i client/api/job-alerts.js fångade varje fel — timeout,
 * 5xx, nätverksfel — och returnerade `{ hits: [] }`. `checkUserAlerts()` kunde
 * då inte skilja "AF svarade inte" från "inga nya jobb", och tog else-grenen:
 * `last_checked_at = nu`. Nästa körning frågar AF efter jobb publicerade EFTER
 * den tidpunkten, så varje annons som publicerades under avbrottet föll bort
 * för gott. Cron-körningen svarade dessutom 200 "found 0 new jobs".
 *
 * Samma felklass som CLAUDE.md-lärdomen "searchJobs KASTAR nu (AF-avbrott ≠
 * noll jobb)" — rättad i klienten 2026-08-18, men aldrig i cron-vägen.
 *
 * Testet kör den riktiga handlern med nätverket stubbat.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const MODUL = resolve(__dirname, '../../api/job-alerts.js')

type Handler = (req: unknown, res: unknown) => Promise<void>

function laddaHandler(): Handler {
  delete require.cache[require.resolve(MODUL)]
  return require(MODUL) as Handler
}

function makeRes() {
  const captured: { status: number; body: Record<string, unknown> | null } = { status: 200, body: null }
  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader: vi.fn(),
    status(code: number) {
      captured.status = code
      res.statusCode = code
      return res
    },
    json(body: Record<string, unknown>) {
      captured.body = body
      return res
    },
    end: vi.fn(),
  }
  return { res, captured }
}

const ALERT = { id: 'a1', user_id: 'u1', name: 'Lager', query: 'lagerarbetare', is_active: true, last_checked_at: '2026-09-21T06:00:00+00:00', notification_frequency: 'daily' }

function stubNetwork(af: () => Response | Promise<Response>) {
  const patchar: Array<{ url: string; body: Record<string, unknown> }> = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string; headers?: Record<string, string> }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const accept = JSON.stringify(init?.headers || {})
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

    if (url.startsWith('https://jobsearch.api.jobtechdev.se')) return af()
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 4, reset_at: null }])
    if (url.includes('/rest/v1/job_alerts') && method === 'PATCH') {
      patchar.push({ url, body: JSON.parse(init?.body || '{}') })
      return json([])
    }
    if (url.includes('/rest/v1/job_alerts')) return json(url.includes('select=user_id') ? [{ user_id: 'u1' }] : [ALERT])
    if (url.includes('/rest/v1/profiles')) return accept.includes('vnd.pgrst.object') ? json({ email: 'a@example.com' }) : json([{ email: 'a@example.com' }])
    if (url.includes('/rest/v1/user_preferences')) return accept.includes('vnd.pgrst.object') ? json(null) : json([])
    if (url.includes('/rest/v1/job_notifications') || url.includes('/rest/v1/notifications') || url.includes('/rest/v1/email_notifications')) return json([], 201)
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { patchar }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  process.env.CRON_SECRET = 'hemlig'
  delete process.env.RESEND_API_KEY
  delete process.env.EMAIL_FROM
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

const cronReq = { method: 'GET', headers: { authorization: 'Bearer hemlig' }, query: { action: 'check' } }

describe('job-alerts: ett AF-avbrott är inte noll nya jobb', () => {
  it('flyttar INTE fram last_checked_at när AF svarar 503', async () => {
    const { patchar } = stubNetwork(() => new Response('nere', { status: 503 }))
    const { res } = makeRes()

    await laddaHandler()(cronReq, res)

    expect(patchar.filter((p) => 'last_checked_at' in p.body)).toHaveLength(0)
  })

  it('cron-körningen syns som misslyckad när varje sökning föll', async () => {
    stubNetwork(() => { throw new TypeError('fetch failed') })
    const { res, captured } = makeRes()

    await laddaHandler()(cronReq, res)

    expect(captured.status).toBeGreaterThanOrEqual(500)
    expect(captured.body).toMatchObject({ afFel: 1 })
  })

  it('flyttar fram fönstret när AF faktiskt svarade med noll träffar', async () => {
    const { patchar } = stubNetwork(() => new Response(JSON.stringify({ hits: [] }), { status: 200 }))
    const { res, captured } = makeRes()

    await laddaHandler()(cronReq, res)

    expect(captured.status).toBe(200)
    expect(patchar.filter((p) => 'last_checked_at' in p.body)).toHaveLength(1)
  })
})
