/**
 * KM10-resten — mejlfunktionen för aktivitetsnotiser (client/api/aktivitet-mejl.js).
 *
 * Testar de rena delarna som exporteras vid sidan av handlern: mallen (inline-
 * färger, HashRouter-länk, eskapering), e-postreglagets tolkning och
 * cron-grinden — samma tre grupper som api-pass-paminnelse.test.ts. Handlern
 * själv kräver Supabase + Resend och verifieras i prod efter att cron-raden
 * finns i vercel.json.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const modul = require(resolve(__dirname, '../../api/aktivitet-mejl.js')) as {
  byggMejl: (n: { title: string; message: string }, siteUrl: string) => { html: string; text: string }
  skaMejla: (p: { email_notifications?: boolean | null } | null | undefined) => boolean
  verifyCronSecret: (req: { headers: Record<string, string | undefined> }) => boolean
}

describe('aktivitet-mejl — mallen', () => {
  const notis = { title: 'Din vecka är planerad', message: 'Din konsulent har lagt upp ett veckoschema som börjar 14 september, 15 timmar i veckan.' }

  it('bär färger inline på knappen och länkar till Min vecka med brädgård', () => {
    const { html, text } = modul.byggMejl(notis, 'https://www.jobin.se')
    expect(html).toContain('https://www.jobin.se/#/min-vecka')
    expect(html).toMatch(/<a href="https:\/\/www\.jobin\.se\/#\/min-vecka" style="[^"]*background:#4f46e5;color:#ffffff;/)
    expect(html).not.toContain('<style')
    expect(text).toContain('https://www.jobin.se/#/min-vecka')
  })

  it('eskaperar HTML i titel och meddelande', () => {
    const { html } = modul.byggMejl({ title: '<script>x</script>', message: 'A & B' }, 'https://www.jobin.se')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('A &amp; B')
  })
})

describe('aktivitet-mejl — e-postreglaget', () => {
  it('saknad rad = skicka, false = skicka inte, true = skicka', () => {
    expect(modul.skaMejla(null)).toBe(true)
    expect(modul.skaMejla(undefined)).toBe(true)
    expect(modul.skaMejla({ email_notifications: null })).toBe(true)
    expect(modul.skaMejla({ email_notifications: true })).toBe(true)
    expect(modul.skaMejla({ email_notifications: false })).toBe(false)
  })
})

describe('aktivitet-mejl — cron-grinden', () => {
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
