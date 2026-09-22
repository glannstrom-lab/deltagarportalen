/**
 * Mejl-cronerna (pass-paminnelse.js, aktivitet-mejl.js) mejlade den som
 * stängt av mejl när uppslaget av reglaget föll (2026-09-22).
 *
 * Handlern gjorde
 *   const [{ data: profil }, { data: pref }] = await Promise.all([...])
 * och kastade bort `error`. Gav `user_preferences`-uppslaget fel blev `pref`
 * null — och null betyder i `skaMejla()` "reglaget aldrig rört = skicka". En
 * deltagare som uttryckligen stängt av e-postnotiser fick alltså mejl precis
 * när databasen strulade. Profiluppslaget föll lika tyst: ett fel räknades som
 * "utan e-post", inte som ett fel, så en natt där varje uppslag föll gav 200.
 *
 * Och när `data.mail_sent` inte gick att skriva efter ett lyckat utskick
 * syntes ingenting — nästa körning skickade samma mejl igen.
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

interface Stubval {
  prefFel?: boolean
  profilFel?: boolean
  markeringFel?: boolean
}

function stubNetwork(val: Stubval) {
  const resendAnrop: string[] = []
  global.fetch = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const method = (init?.method || 'GET').toUpperCase()
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    const pgFel = () => json({ code: '57014', message: 'canceling statement due to statement timeout' }, 500)

    if (url.startsWith('https://api.resend.com')) {
      resendAnrop.push(init?.body || '')
      return json({ id: 'r1' })
    }
    if (url.includes('/rest/v1/notifications') && method === 'PATCH') {
      return val.markeringFel ? pgFel() : json([])
    }
    if (url.includes('/rest/v1/notifications')) {
      return json([{ id: 'n1', user_id: 'u1', title: 'I morgon: pass', message: 'm', data: {}, created_at: new Date().toISOString() }])
    }
    if (url.includes('/rest/v1/profiles')) return val.profilFel ? pgFel() : json({ email: 'a@jobin-test.se', first_name: 'A' }) // inte example.com: RFC 2606-domäner hoppas över (api-mejlcron-reserverade-domaner.test.ts)
    if (url.includes('/rest/v1/user_preferences')) return val.prefFel ? pgFel() : json(null)
    throw new Error(`Oväntat nätverksanrop i test: ${method} ${url}`)
  }) as unknown as typeof fetch
  return { resendAnrop }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  process.env.CRON_SECRET = 'hemlig'
  process.env.RESEND_API_KEY = 're_stubnyckel'
  process.env.EMAIL_FROM = 'Jobin <noreply@jobin.se>'
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

const cronReq = { method: 'GET', headers: { authorization: 'Bearer hemlig' }, query: {} }

describe.each(['pass-paminnelse.js', 'aktivitet-mejl.js'])('%s', (fil) => {
  it('skickar INTE när uppslaget av e-postreglaget föll — och räknar det som fel', async () => {
    const { resendAnrop } = stubNetwork({ prefFel: true })
    const { res, captured } = makeRes()

    await ladda(fil)(cronReq, res)

    expect(resendAnrop).toHaveLength(0)
    expect(captured.body).toMatchObject({ fel: 1, skickade: 0 })
    expect(captured.status).toBe(500)
  })

  it('ett fel i profiluppslaget är ett fel, inte "utan e-post"', async () => {
    const { resendAnrop } = stubNetwork({ profilFel: true })
    const { res, captured } = makeRes()

    await ladda(fil)(cronReq, res)

    expect(resendAnrop).toHaveLength(0)
    expect(captured.body).toMatchObject({ fel: 1, utanEpost: 0 })
  })

  it('räknar ett utskick vars mail_sent-markering föll', async () => {
    const { resendAnrop } = stubNetwork({ markeringFel: true })
    const { res, captured } = makeRes()

    await ladda(fil)(cronReq, res)

    expect(resendAnrop).toHaveLength(1)
    expect(captured.body).toMatchObject({ skickade: 1, ejMarkerade: 1 })
  })

  it('lyckovägen är oförändrad', async () => {
    const { resendAnrop } = stubNetwork({})
    const { res, captured } = makeRes()

    await ladda(fil)(cronReq, res)

    expect(resendAnrop).toHaveLength(1)
    expect(captured.status).toBe(200)
    expect(captured.body).toMatchObject({ skickade: 1, fel: 0, ejMarkerade: 0 })
  })
})

describe('avgorSvar larmar om dubbelmejl', () => {
  const { avgorSvar } = require(resolve(__dirname, '../../api/_utils/mejlutfall.js')) as {
    avgorSvar: (u: { skickade: number; fel: number; ejMarkerade?: number }) => { status: number; larm: string | null }
  }

  it('ett skickat men omarkerat mejl ger larm men inte 500', () => {
    const svar = avgorSvar({ skickade: 2, fel: 0, ejMarkerade: 1 })
    expect(svar.status).toBe(200)
    expect(svar.larm).toContain('1 skickade mejl kunde inte markeras')
  })

  it('utan ejMarkerade är regeln oförändrad', () => {
    expect(avgorSvar({ skickade: 2, fel: 0 })).toEqual({ status: 200, larm: null })
  })
})
