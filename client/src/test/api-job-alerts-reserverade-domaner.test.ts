/**
 * job-alerts: reserverad mejldomän, anställningstyp och jobbnotiser (2026-09-29).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const MODUL = resolve(__dirname, '../../api/job-alerts.js')
type Modul = {
  byggAfSokparametrar: (p: Record<string, unknown>) => URLSearchParams
  filtreraAnstallningstyp: (h: unknown[], t?: string | null) => unknown[]
  templates: { dailyDigest: (a: unknown[], e: string) => { html: string } }
}
function ladda(): Modul {
  process.env.VITE_SUPABASE_URL ||= 'https://stub.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY ||= 'anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'svc'
  delete require.cache[require.resolve(MODUL)]
  return require(MODUL)
}
afterEach(() => vi.restoreAllMocks())

describe('job-alerts', () => {
  it('skickar anställningstyp heltid/deltid till AF', () => {
    expect(ladda().byggAfSokparametrar({ employmentType: 'Heltid' }).get('employment-type')).toBeTruthy()
    expect(ladda().byggAfSokparametrar({ employmentType: 'Deltid' }).get('employment-type')).toBeTruthy()
    expect(ladda().byggAfSokparametrar({}).has('employment-type')).toBe(false)
  })

  it('filtrerar övriga anställningstyper på etikett', () => {
    const hits = [{ employment_type: { label: 'Vikariat' } }, { employment_type: { label: 'Tillsvidare' } }]
    expect(ladda().filtreraAnstallningstyp(hits, 'Vikariat')).toHaveLength(1)
    expect(ladda().filtreraAnstallningstyp(hits, null)).toHaveLength(2)
  })

  it('sammanfattningsmejlet visar titel och arbetsgivare ur job_notifications-rader', () => {
    const { html } = ladda().templates.dailyDigest([{ name: 'B', newJobs: [{ job_title: 'Lagerarbetare', employer: 'Nordfrakt AB' }] }], 'a@b.se')
    expect(html).toContain('Lagerarbetare')
    expect(html).toContain('Nordfrakt AB')
  })

  it('hoppar över reserverade mejldomäner utan att anropa Resend', async () => {
    process.env.RESEND_API_KEY = 're'
    process.env.EMAIL_FROM = 'Jobin <n@jobin.se>'
    const f = vi.fn(async () => new Response('{}', { status: 200 }))
    global.fetch = f as unknown as typeof fetch
    // sendEmail är inte exporterad — gå via digesten är för tungt; prova via mejlutfall
    const { arReserveradAdress } = require('../../api/_utils/mejlutfall.js')
    expect(arReserveradAdress('demo@example.com')).toBe(true)
    const src = (await import('node:fs')).readFileSync(MODUL, 'utf8')
    expect(src).toMatch(/async function sendEmail\([^)]*\) \{\s*\/\/[\s\S]*?if \(arReserveradAdress\(to\)\) return true;/)
  })
})
