/**
 * F3 — mejlfunktionen för påminnelser (client/api/pass-paminnelse.js).
 *
 * Testar de rena delarna som exporteras vid sidan av handlern: mallen (inline-
 * färger, kartlänk, HashRouter-länk, eskapering), e-postreglagets tolkning och
 * cron-grinden. Handlern själv kräver Supabase + Resend och verifieras i prod
 * efter att cron-raden finns i vercel.json.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const modul = require(resolve(__dirname, '../../api/pass-paminnelse.js')) as {
  byggMejl: (n: { title: string; message: string; data: Record<string, unknown> }, siteUrl: string) => { html: string; text: string }
  skaMejla: (p: { email_notifications?: boolean | null } | null | undefined) => boolean
  verifyCronSecret: (req: { headers: Record<string, string | undefined> }) => boolean
}

describe('pass-paminnelse — mallen', () => {
  const notis = { title: 'I morgon: Jobbsökarverkstad kl 09:00', message: 'Du har ett pass i morgon 14/09 kl 09:00–12:00 på Hjernet, Malmgatan 4.', data: { location: 'Hjernet, Malmgatan 4' } }

  it('bär färger inline på knappen och länkar till Min vecka med brädgård', () => {
    const { html, text } = modul.byggMejl(notis, 'https://www.jobin.se')
    expect(html).toContain('https://www.jobin.se/#/min-vecka')
    expect(html).toMatch(/<a href="https:\/\/www\.jobin\.se\/#\/min-vecka" style="[^"]*background:#4f46e5;color:#ffffff;/)
    expect(html).not.toContain('<style')
    expect(text).toContain('https://www.jobin.se/#/min-vecka')
  })

  it('lägger en kartlänk när platsen finns, och ingen när den saknas', () => {
    const med = modul.byggMejl(notis, 'https://www.jobin.se')
    expect(med.html).toContain('https://www.google.com/maps/search/?api=1&amp;query=Hjernet%2C%20Malmgatan%204')
    expect(med.text).toContain('Karta: https://www.google.com/maps/search/?api=1&query=Hjernet%2C%20Malmgatan%204')
    const utan = modul.byggMejl({ ...notis, data: {} }, 'https://www.jobin.se')
    expect(utan.html).not.toContain('google.com/maps')
  })

  it('eskaperar HTML i titel och plats', () => {
    const { html } = modul.byggMejl({ title: '<script>x</script>', message: 'm', data: { location: 'A & B' } }, 'https://www.jobin.se')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('A &amp; B')
  })
})

describe('pass-paminnelse — e-postreglaget', () => {
  it('saknad rad = skicka, false = skicka inte, true = skicka', () => {
    expect(modul.skaMejla(null)).toBe(true)
    expect(modul.skaMejla(undefined)).toBe(true)
    expect(modul.skaMejla({ email_notifications: null })).toBe(true)
    expect(modul.skaMejla({ email_notifications: true })).toBe(true)
    expect(modul.skaMejla({ email_notifications: false })).toBe(false)
  })
})

describe('pass-paminnelse — cron-grinden', () => {
  const fore = process.env.CRON_SECRET
  beforeEach(() => { process.env.CRON_SECRET = 'hemlig-123' })
  afterEach(() => { if (fore === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = fore })

  it('släpper Bearer och x-cron-secret, nekar allt annat', () => {
    expect(modul.verifyCronSecret({ headers: { authorization: 'Bearer hemlig-123' } })).toBe(true)
    expect(modul.verifyCronSecret({ headers: { 'x-cron-secret': 'hemlig-123' } })).toBe(true)
    expect(modul.verifyCronSecret({ headers: { authorization: 'Bearer fel' } })).toBe(false)
    expect(modul.verifyCronSecret({ headers: {} })).toBe(false)
  })

  it('nekar allt när CRON_SECRET saknas', () => {
    delete process.env.CRON_SECRET
    expect(modul.verifyCronSecret({ headers: { authorization: 'Bearer ' } })).toBe(false)
  })
})

/**
 * DR1 (2026-09-20): självtestet av felrapporteringskedjan. Ligger bakom
 * CRON_SECRET, skickar inga mejl, och svarar 200 även när kedjan är trasig —
 * svaret ÄR mätvärdet.
 */
describe('DR1: självtest av felrapporteringen', () => {
  // `module.exports` ÄR hanteraren (inslagen i medFelrapport); de rena
  // funktionerna hänger på som egenskaper.
  const handler = modul as unknown as (req: unknown, res: unknown) => Promise<void>

  type Res = { statusCode: number; headersSent: boolean; body?: unknown; headers: Record<string, string>; setHeader(k: string, v: string): void; status(k: number): Res; json(b: unknown): Res }
  const fejkRes = (): Res => {
    const res: Res = {
      statusCode: 200,
      headersSent: false,
      headers: {},
      setHeader(k, v) { res.headers[k] = v },
      status(k) { res.statusCode = k; return res },
      json(b) { res.body = b; res.headersSent = true; return res },
    }
    return res
  }

  const medEnv = async (vars: Record<string, string | undefined>, kor: () => Promise<void>) => {
    const fore: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(vars)) {
      fore[k] = process.env[k]
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    try { await kor() } finally {
      for (const [k, v] of Object.entries(fore)) {
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
      }
    }
  }

  const kor = async (query: Record<string, string>, headers: Record<string, string> = { authorization: 'Bearer hemlig-cron' }) => {
    const res = fejkRes()
    await handler({ method: 'GET', query, headers }, res)
    return res
  }

  it('kräver CRON_SECRET — självtestet är inte publikt', async () => {
    await medEnv({ CRON_SECRET: 'hemlig-cron' }, async () => {
      const res = await kor({ sjalvtest: 'felrapport' }, {})
      expect(res.statusCode).toBe(401)
    })
  })

  it('rapporterar "av" och skickat=false när DSN saknas — inte ett tyst OK', async () => {
    await medEnv({ CRON_SECRET: 'hemlig-cron', SENTRY_DSN: undefined }, async () => {
      const res = await kor({ sjalvtest: 'felrapport' })
      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ dsn: 'av', skickat: false })
    })
  })

  it('går aldrig vidare till mejlutskicket', async () => {
    await medEnv({ CRON_SECRET: 'hemlig-cron', SENTRY_DSN: undefined }, async () => {
      const res = await kor({ sjalvtest: 'felrapport' })
      expect(res.body).not.toHaveProperty('skickade')
      expect(res.body).not.toHaveProperty('kandidater')
    })
  })

  it('utan sjalvtest-parametern körs den vanliga vägen, inte självtestet', async () => {
    await medEnv({ CRON_SECRET: 'hemlig-cron', SENTRY_DSN: undefined }, async () => {
      const res = await kor({})
      expect(res.body).not.toHaveProperty('dsn')
    })
  })
})
