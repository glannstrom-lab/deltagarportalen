/**
 * BL6 (2026-09-12): backendens felrapportering till Sentry — saneringen och wrappen.
 *
 * Testar `client/api/_utils/sentry.js` (CommonJS, samma logik som
 * `supabase/functions/_shared/sentry.ts`, som inte går att köra utan Deno).
 * Mutationstestat: tas e-postmaskeringen bort faller "maskerar e-postadress".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sentry = require('../../api/_utils/sentry.js') as {
  sanera: (t: unknown) => string
  tolkaDsn: (d: string) => { url: string; nyckel: string } | null
  skickaHandelse: (h: { funktion: string; typ: string; meddelande: string; stack?: string; status?: number }, dsn?: string) => Promise<boolean>
  medFelrapport: (namn: string, h: (req: unknown, res: unknown) => unknown) => (req: unknown, res: unknown) => Promise<void>
}

const DSN = 'https://abc123publik@o4500.ingest.de.sentry.io/4500123'

type FejkRes = { statusCode: number; headersSent: boolean; body?: unknown; status(code: number): FejkRes; json(b: unknown): FejkRes }
function fejkRes(): FejkRes {
  const res: FejkRes = {
    statusCode: 200,
    headersSent: false,
    status(code: number) { res.statusCode = code; return res },
    json(b: unknown) { res.body = b; res.headersSent = true; return res },
  }
  return res
}

describe('sanera — inget PII lämnar portalen', () => {
  it('maskerar e-postadress', () => {
    expect(sentry.sanera('RLS nekade anna.svensson@gmail.com på profiles')).toBe('RLS nekade [e-post] på profiles')
  })
  it('maskerar personnummer i tre former', () => {
    expect(sentry.sanera('pnr 19850312-1234 och 850312-1234 och 198503121234')).toBe('pnr [personnummer] och [personnummer] och [personnummer]')
  })
  it('maskerar Bearer-token, JWT och API-nycklar', () => {
    const s = sentry.sanera('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc-DEF_123 nyckel sk-or-v1-abcdefghijkl resend re_abcdefgh1234')
    expect(s).not.toMatch(/eyJ/)
    expect(s).not.toMatch(/sk-or/)
    expect(s).not.toMatch(/re_abc/)
    expect(s).toContain('Bearer [token]')
  })
  it('låter vanliga tal och ord vara', () => {
    expect(sentry.sanera('OpenRouter svarade 502 efter 30000 ms')).toBe('OpenRouter svarade 502 efter 30000 ms')
  })
})

describe('tolkaDsn', () => {
  it('bygger envelope-URL och plockar nyckeln', () => {
    expect(sentry.tolkaDsn(DSN)).toEqual({ url: 'https://o4500.ingest.de.sentry.io/api/4500123/envelope/', nyckel: 'abc123publik' })
  })
  it('ger null för tom eller trasig DSN', () => {
    expect(sentry.tolkaDsn('')).toBeNull()
    expect(sentry.tolkaDsn('inte en url')).toBeNull()
    expect(sentry.tolkaDsn('https://host/')).toBeNull()
  })
})

describe('skickaHandelse', () => {
  const fetchMock = vi.fn()
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('gör ingenting utan DSN — no-op, inget nätverksanrop', async () => {
    expect(await sentry.skickaHandelse({ funktion: 'x', typ: 'Error', meddelande: 'm' }, '')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skickar ett kuvert med sanerat meddelande och sanerad stack, aldrig body', async () => {
    fetchMock.mockResolvedValue({ ok: true })
    const ok = await sentry.skickaHandelse({
      funktion: 'cv-pdf', typ: 'TypeError', meddelande: 'kunde inte rendera för kalle@example.se',
      stack: 'TypeError: kunde inte rendera för kalle@example.se\n    at handler (cv-pdf.js:12)',
    }, DSN)
    expect(ok).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string; headers: Record<string, string> }]
    expect(url).toBe('https://o4500.ingest.de.sentry.io/api/4500123/envelope/')
    expect(init.headers['X-Sentry-Auth']).toContain('sentry_key=abc123publik')
    expect(init.body).not.toContain('kalle@example.se')
    expect(init.body).toContain('[e-post]')
    const rader = init.body.trim().split('\n')
    expect(rader).toHaveLength(3)
    const event = JSON.parse(rader[2])
    expect(event.tags.funktion).toBe('cv-pdf')
    expect(event.exception.values[0].type).toBe('TypeError')
    expect(event).not.toHaveProperty('request')
    expect(event).not.toHaveProperty('user')
  })

  it('kastar aldrig när nätverket fallerar', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'))
    expect(await sentry.skickaHandelse({ funktion: 'x', typ: 'Error', meddelande: 'm' }, DSN)).toBe(false)
  })
})

describe('medFelrapport — Vercel-wrappen', () => {
  const fetchMock = vi.fn()
  beforeEach(() => { fetchMock.mockReset(); fetchMock.mockResolvedValue({ ok: true }); vi.stubGlobal('fetch', fetchMock); process.env.SENTRY_DSN = DSN })
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.SENTRY_DSN })

  it('släpper igenom ett normalt svar utan att rapportera', async () => {
    const res = fejkRes()
    const w = sentry.medFelrapport('cv-pdf', async (_req: unknown, r: unknown) => { (r as ReturnType<typeof fejkRes>).status(200).json({ ok: true }) })
    await w({ method: 'POST', url: '/api/cv-pdf' }, res)
    expect(res.statusCode).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rapporterar ett 5xx-svar från hanterarens eget catch-block', async () => {
    const res = fejkRes()
    const w = sentry.medFelrapport('job-alerts', async (_req: unknown, r: unknown) => { (r as ReturnType<typeof fejkRes>).status(500).json({ error: 'x' }) })
    await w({ method: 'GET', url: '/api/job-alerts?action=check&secret=hemlig' }, res)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = (fetchMock.mock.calls[0][1] as { body: string }).body
    expect(body).toContain('svarade 500')
    expect(body).not.toContain('hemlig') // querystringen skickas aldrig
  })

  it('fångar ett fel som slinker ut, svarar 500 JSON och rapporterar maskerat', async () => {
    const res = fejkRes()
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = sentry.medFelrapport('upload-image', async () => { throw new Error('blob nekade 19900101-1234 (anna@x.se)') })
    await w({ method: 'POST', url: '/api/upload-image' }, res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Internt fel' })
    const body = (fetchMock.mock.calls[0][1] as { body: string }).body
    expect(body).not.toContain('19900101-1234')
    expect(body).not.toContain('anna@x.se')
    expect(body).toContain('[personnummer]')
    expect(err.mock.calls[0].join(' ')).not.toContain('anna@x.se')
    err.mockRestore()
  })

  it('skriver inte över ett svar som redan gått iväg', async () => {
    const res = fejkRes()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = sentry.medFelrapport('cv-pdf', async (_req: unknown, r: unknown) => { (r as ReturnType<typeof fejkRes>).status(200).json({ ok: true }); throw new Error('efteråt') })
    await w({ method: 'POST', url: '/api/cv-pdf' }, res)
    expect(res.statusCode).toBe(200)
  })
})
