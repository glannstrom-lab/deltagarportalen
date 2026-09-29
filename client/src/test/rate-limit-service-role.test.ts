/**
 * RL1 (2026-09-29) — grind: `check_rate_limit` är bara körbar för service_role.
 *
 * Alla sex anropare måste bygga rate-limit-klienten med service-nyckeln. En
 * anon-klient hade efter REVOKE tyst degraderat räknaren till minnes-limitern
 * (på serverless: ingen gräns). Se
 * supabase/migrations/PENDING_20260929_check_rate_limit_service_role.sql.
 *
 * Provet läser källfilerna. Det kan inte köra RPC:n, men det fäller på den
 * regression som faktiskt inträffar: att någon skickar in anon-klienten.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROT = resolve(__dirname, '../../..')
const las = (rel: string) => readFileSync(resolve(ROT, rel), 'utf8').replace(/\r\n/g, '\n')

/** Vercel-funktionerna: anropar checkRateLimit med klient från hjälparen. */
const VERCEL: Array<[string, RegExp]> = [
  ['client/api/ai.js', /checkRateLimit\(\s*getRateLimitClient\(\)/],
  ['client/api/cv-pdf.js', /checkRateLimit\(\s*getRateLimitClient\(\)/],
  ['client/api/upload-image.js', /checkRateLimit\(\s*getRateLimitClient\(\)/],
  ['client/api/job-alerts.js', /\(getRateLimitClient\(\)[^)]*\)\.rpc\('check_rate_limit'/],
]

describe('RL1: check_rate_limit anropas med service-role-klient', () => {
  it.each(VERCEL)('%s bygger rate-limit-klienten via getRateLimitClient()', (fil, monster) => {
    const src = las(fil)
    expect(src).toContain("require('./_utils/rate-limit-client.js')")
    expect(src).toMatch(monster)
  })

  it('hjälparen använder service-nyckeln och är enda stället för klienten', () => {
    const src = las('client/api/_utils/rate-limit-client.js')
    expect(src).toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(src).toContain('[RateLimit]')
    // Service-nyckeln ska väljas FÖRE anon-nyckeln.
    expect(src.indexOf('createClient(url, serviceKey')).toBeGreaterThan(-1)
    expect(src.indexOf('createClient(url, serviceKey')).toBeLessThan(src.indexOf('createClient(url, anonKey'))
  })

  it('ingen Vercel-anropare skickar en anon-klient direkt till checkRateLimit', () => {
    for (const [fil] of VERCEL) {
      const src = las(fil)
      expect(src, fil).not.toMatch(/(?<!function )checkRateLimit\(\s*(supabase|rlSupabase|supabaseAnon)\s*,/)
    }
  })

  it('bolagsverket kör RPC:n via en service-klient', () => {
    const src = las('supabase/functions/bolagsverket/index.ts')
    expect(src).toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(src).toMatch(/rlClient\.rpc\('check_rate_limit'/)
    expect(src).not.toMatch(/\bsupabase\.rpc\('check_rate_limit'/)
  })

  it('_shared/rateLimit.ts bygger klienten med service-nyckeln före anon-nyckeln', () => {
    const src = las('supabase/functions/_shared/rateLimit.ts')
    expect(src).toMatch(/const key = serviceKey \|\| anonKey/)
    expect(src).not.toMatch(/const key = Deno\.env\.get\('SUPABASE_ANON_KEY'\)/)
  })
})
