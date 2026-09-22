/**
 * upload-image.js läste HELA kroppen till minnet innan storleken kontrollerades
 * (2026-09-22).
 *
 * `for await (const chunk of req) chunks.push(chunk)` och först därefter
 * `buffer.length > MAX_FILE_SIZE`. En för stor uppladdning lästes alltså
 * färdigt och lades i minnet i sin helhet, bara för att avvisas. Nu:
 * Content-Length avvisas före läsningen, och läsningen avbryts vid gränsen
 * oavsett vad headern påstod (den kan saknas vid chunked överföring).
 *
 * Obs: Vercel avvisar själv request-kroppar över 4,5 MB (413) innan
 * funktionen körs, så i drift var minnestoppen begränsad. Kontrollen hör
 * ändå hemma i funktionen — gränsen är plattformens, inte vår.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const handler = require(resolve(__dirname, '../../api/upload-image.js')) as (req: unknown, res: unknown) => Promise<void>

const MB = 1024 * 1024

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

/** En request som räknar hur många chunkar handlern faktiskt drog ut. */
function makeReq(chunkar: number, headers: Record<string, string> = {}) {
  const lasta = { antal: 0 }
  const req = {
    method: 'POST',
    query: { filename: 'bild.png' },
    headers: { authorization: 'Bearer tok', origin: 'https://jobin.se', 'content-type': 'image/png', ...headers },
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < chunkar; i++) {
        lasta.antal++
        yield Buffer.alloc(MB, 0x89)
      }
    },
  }
  return { req, lasta }
}

const ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'BLOB_READ_WRITE_TOKEN', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-stub'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-stub'
  delete process.env.SENTRY_DSN
  global.fetch = vi.fn(async (input: unknown) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return json({ id: 'u1', aud: 'authenticated' })
    if (url.includes('/rest/v1/rpc/check_rate_limit')) return json([{ allowed: true, remaining: 4 }])
    throw new Error(`Oväntat nätverksanrop: ${url}`)
  }) as unknown as typeof fetch
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('upload-image: storleken kontrolleras innan kroppen ligger i minnet', () => {
  it('utan Content-Length: läsningen avbryts vid gränsen, inte efter 50 MB', async () => {
    const { req, lasta } = makeReq(50)
    const { res, captured } = makeRes()

    await handler(req, res)

    expect(captured.status).toBe(400)
    expect(captured.body?.error).toMatch(/too large|för stor/i)
    expect(lasta.antal).toBeLessThanOrEqual(6)
  })

  it('en Content-Length över gränsen avvisas utan att en enda byte läses', async () => {
    const { req, lasta } = makeReq(50, { 'content-length': String(50 * MB) })
    const { res, captured } = makeRes()

    await handler(req, res)

    expect(captured.status).toBe(400)
    expect(lasta.antal).toBe(0)
  })
})
