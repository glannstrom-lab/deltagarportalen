/**
 * cv-pdf.js skickade `error.message` rått i 500-svaret (2026-09-22).
 *
 * catch-blocket svarade `{ error: error.message }` för allt som kastades i
 * try-blocket: PostgREST-fel (tabell- och kolumnnamn, RLS-texter), puppeteer
 * (interna URL:er, timeouttexter) och Chromium-nedladdningen (paket-URL:en i
 * Vercel Blob). PDFExportButton visar texten för användaren rakt av.
 *
 * Nu: bara fel som hanteraren själv formulerat för användaren visas; allt
 * annat blir ett allmänt meddelande, och detaljen stannar i serverloggen.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const handler = require(resolve(__dirname, '../../api/cv-pdf.js')) as (req: unknown, res: unknown) => Promise<void>

const ALLMANT = 'PDF-generering misslyckades. Försök igen om en stund.'
const HEMLIGT = 'permission denied for table cvs (policy cvs_select_own) at https://intern.supabase.co'

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

function stubNetwork(cvs: () => Response) {
  global.fetch = vi.fn(async (input: unknown) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 4 }])
    if (url.includes('/rest/v1/cvs')) return cvs()
    throw new Error(`Oväntat nätverksanrop: ${url}`)
  }) as unknown as typeof fetch
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
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

const req = { method: 'POST', headers: { authorization: 'Bearer tok', origin: 'https://jobin.se' }, body: { template: 'sidebar' } }

describe('cv-pdf: 500-svaret läcker inte interna detaljer', () => {
  it('ett databasfel når inte användaren', async () => {
    stubNetwork(() => new Response(JSON.stringify({ code: '42501', message: HEMLIGT, details: null, hint: null }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    }))
    const { res, captured } = makeRes()

    await handler(req, res)

    expect(captured.status).toBe(500)
    const text = JSON.stringify(captured.body)
    expect(text).not.toContain('permission denied')
    expect(text).not.toContain('intern.supabase.co')
    expect(captured.body?.error).toBe(ALLMANT)
  })

  it('ett fel från Chromium-starten når inte användaren (konfiguration, URL:er)', async () => {
    // Simulerar Vercel utan paket-URL: getChromium kastar ett Error vars text
    // namnger miljövariabeln och paketet. Det var exakt den texten som
    // tidigare gick rakt ut i svaret.
    process.env.VERCEL = '1'
    const forePack = process.env.CHROMIUM_PACK_URL
    delete process.env.CHROMIUM_PACK_URL
    try {
      stubNetwork(() => new Response(JSON.stringify({ first_name: 'Anna', last_name: 'Berg', skills: [] }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
      const { res, captured } = makeRes()

      await handler(req, res)

      expect(captured.status).toBe(500)
      const text = JSON.stringify(captured.body)
      expect(text).not.toContain('CHROMIUM_PACK_URL')
      expect(text).not.toContain('sparticuz')
      expect(text).not.toContain('chromium-pack')
      // Beroende på maskinen faller starten på paket-URL:en eller på själva
      // processen — båda är interna. Svaret ska vara det allmänna, exakt.
      expect(captured.body?.error).toBe(ALLMANT)
    } finally {
      delete process.env.VERCEL
      if (forePack !== undefined) process.env.CHROMIUM_PACK_URL = forePack
    }
  })

  it('ett fel som hanteraren formulerat för användaren visas fortfarande', async () => {
    stubNetwork(() => new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const { res, captured } = makeRes()

    await handler(req, res)

    expect(captured.body?.error).toBe('Inget CV hittades — fyll i ditt CV först')
    // Ett saknat CV är inget serverfel. Som 500 larmade det dessutom i Sentry
    // (medFelrapport rapporterar varje svar ≥ 500) för varje ny användare som
    // tryckte på knappen innan hen fyllt i något.
    expect(captured.status).toBe(404)
  })
})
