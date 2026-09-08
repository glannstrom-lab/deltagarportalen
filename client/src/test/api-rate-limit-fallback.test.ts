/**
 * SD2 — rate-limit i `client/api/` får aldrig falla öppet.
 *
 * BAKGRUND. `cv-pdf.js` och `upload-image.js` svarade `{ allowed: true }` på
 * tre ställen vardera när Supabase-RPC:n `check_rate_limit` gav fel, kastade
 * eller kom tillbaka utan rad. Dörren stod alltså öppen exakt när databasen
 * strulade — och CV-PDF startar Chromium (1 024 MB) per anrop. `ai.js` och
 * `job-alerts.js` hade redan en per-instans-räknare i minnet för samma fall.
 * Nu delar de två första `_utils/rate-limit-fallback.js`.
 *
 * VARFÖR EN KÄLLKODSVAKT. Handlers i `client/api/` drar in Supabase-klient,
 * Vercel Blob och puppeteer vid import; att köra dem i vitest hade prövat
 * allt utom felvägen. Samma grepp som `cors-preview.test.ts`. Fallback-
 * modulen själv är beroendefri och prövas därför på riktigt.
 *
 * VAKTEN MATCHAR KODFORMEN: `allowed: true` med kolon, inne i
 * `checkRateLimit`. Ordet förekommer i kommentarer och i den lyckade vägen
 * (`allowed: r.allowed`) — de matchar inte.
 *
 * Mutationstestad 2026-09-08: ett återinfört
 * `return { allowed: true, … }` i catch-grenen i cv-pdf.js fällde testet.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/* eslint-disable @typescript-eslint/no-require-imports */
const { rateLimitFallback } = require('../../api/_utils/rate-limit-fallback.js') as {
  rateLimitFallback: (
    identifier: string,
    endpoint: string,
    config: { limit: number; windowMinutes: number },
  ) => { allowed: boolean; remaining: number; resetIn: number }
}
/* eslint-enable @typescript-eslint/no-require-imports */

/** Importerar den delade fallbacken. */
const DELAD = ['cv-pdf.js', 'upload-image.js']
/** Har en egen kopia av samma mönster (orörda i SD2). */
const EGEN = ['ai.js', 'job-alerts.js']

function las(fil: string): string {
  return readFileSync(resolve(__dirname, '../../api', fil), 'utf8').replace(/\r\n/g, '\n')
}

/** Funktionskroppen från `async function checkRateLimit(` till första `}` i kolumn 0. */
function checkRateLimitKropp(kod: string, fil: string): string {
  const m = kod.match(/async function checkRateLimit\([^)]*\) \{[\s\S]*?\n\}/)
  if (!m) throw new Error(`${fil}: hittar ingen checkRateLimit — har den bytt namn?`)
  return m[0]
}

function felgrenar(kropp: string, fil: string): { error: string; katt: string } {
  const error = kropp.match(/if \(error\) \{[\s\S]*?\n\s*\}/)?.[0]
  const katt = kropp.match(/catch \(err\) \{[\s\S]*$/)?.[0]
  if (!error || !katt) throw new Error(`${fil}: checkRateLimit saknar if (error)/catch (err)`)
  return { error, katt }
}

describe('SD2 — ingen serverlös funktion släpper igenom allt när rate-limit-RPC:n fallerar', () => {
  it.each([...DELAD, ...EGEN])('%s: felgrenarna i checkRateLimit går till minnesfallbacken', (fil) => {
    const { error, katt } = felgrenar(checkRateLimitKropp(las(fil), fil), fil)
    expect(error).toContain('rateLimitFallback(')
    expect(error).not.toContain('allowed: true')
    expect(katt).toContain('rateLimitFallback(')
    expect(katt).not.toContain('allowed: true')
  })

  it.each(DELAD)('%s: inget `allowed: true` alls i checkRateLimit — även tomt RPC-svar är ett fel', (fil) => {
    const kropp = checkRateLimitKropp(las(fil), fil)
    expect(kropp).not.toContain('allowed: true')
    // Tre vägar in i fallbacken: RPC-fel, tomt svar, kastat undantag.
    expect(kropp.match(/rateLimitFallback\(/g)?.length).toBe(3)
  })

  it.each(DELAD)('%s importerar den delade modulen i stället för en egen kopia', (fil) => {
    expect(las(fil)).toContain("require('./_utils/rate-limit-fallback')")
  })

  it('den döda root-kopian api/_utils/rate-limiter.js är borta och kommer inte tillbaka', () => {
    // Hade noll importörer (mätt 2026-09-07) och fail open-semantik i sin
    // egen fallback. En kopia att "kopiera mönstret från" är precis vad
    // som inte ska finnas.
    expect(existsSync(resolve(__dirname, '../../../api/_utils/rate-limiter.js'))).toBe(false)
  })
})

describe('SD2 — minnesfallbacken räknar på riktigt', () => {
  afterEach(() => vi.useRealTimers())

  it('släpper igenom upp till gränsen och stänger sedan, med resetIn > 0', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T10:00:00Z'))
    const config = { limit: 3, windowMinutes: 15 }
    const id = `test-${Math.random()}`

    expect(rateLimitFallback(id, 'cv-pdf', config)).toMatchObject({ allowed: true, remaining: 2 })
    expect(rateLimitFallback(id, 'cv-pdf', config)).toMatchObject({ allowed: true, remaining: 1 })
    expect(rateLimitFallback(id, 'cv-pdf', config)).toMatchObject({ allowed: true, remaining: 0 })

    const stangd = rateLimitFallback(id, 'cv-pdf', config)
    expect(stangd.allowed).toBe(false)
    expect(stangd.remaining).toBe(0)
    expect(stangd.resetIn).toBeGreaterThan(0)
    expect(stangd.resetIn).toBeLessThanOrEqual(15 * 60 * 1000)
  })

  it('öppnar igen när fönstret gått ut', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T10:00:00Z'))
    const config = { limit: 1, windowMinutes: 15 }
    const id = `test-${Math.random()}`

    expect(rateLimitFallback(id, 'upload-image', config).allowed).toBe(true)
    expect(rateLimitFallback(id, 'upload-image', config).allowed).toBe(false)

    vi.setSystemTime(new Date('2026-09-08T10:15:01Z'))
    expect(rateLimitFallback(id, 'upload-image', config).allowed).toBe(true)
  })

  it('håller isär användare och endpoints', () => {
    const config = { limit: 1, windowMinutes: 15 }
    const a = `test-${Math.random()}`
    const b = `test-${Math.random()}`
    expect(rateLimitFallback(a, 'cv-pdf', config).allowed).toBe(true)
    expect(rateLimitFallback(a, 'cv-pdf', config).allowed).toBe(false)
    // Annan endpoint, samma användare — eget fönster
    expect(rateLimitFallback(a, 'upload-image', config).allowed).toBe(true)
    // Annan användare, samma endpoint — eget fönster
    expect(rateLimitFallback(b, 'cv-pdf', config).allowed).toBe(true)
  })
})
