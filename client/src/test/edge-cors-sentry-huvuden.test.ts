/**
 * Edge-funktionernas CORS måste släppa igenom Sentrys spårningshuvuden.
 *
 * Upptäckt 2026-10-19 när Mikael fick "Failed to fetch" i Admin → Visa som.
 * lib/sentry.ts sätter `tracePropagationTargets` till bland annat *.supabase.co
 * (effektivt sedan 2026-09-22, då inställningen flyttades till toppnivån), så
 * för varje användare som godkänt felspårning lägger Sentry `sentry-trace` och
 * `baggage` på anropen. Preflighten nekade dem, webbläsaren stoppade anropet,
 * och det enda som syntes var "Failed to fetch" — i varje edge-funktion:
 * jobbsökningen, AI-funktionerna, Bolagsverket, Visa som. Användare utan
 * samtycke märkte ingenting, och därför larmade inget test eller röktest.
 *
 * Grinden läser varje Access-Control-Allow-Headers under supabase/functions —
 * även de funktioner som har en egen lista i stället för _shared/cors.ts.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const FUNKTIONER = path.resolve(__dirname, '../../../supabase/functions')
const SENTRY = path.resolve(__dirname, '../lib/sentry.ts')

function tsFiler(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return tsFiler(p)
    return d.name.endsWith('.ts') ? [p] : []
  })
}

const listor = tsFiler(FUNKTIONER).flatMap((fil) =>
  [...fs.readFileSync(fil, 'utf8').matchAll(/['"]Access-Control-Allow-Headers['"]\s*:\s*['"]([^'"]*)['"]/gi)].map(
    (m) => ({ fil: path.relative(FUNKTIONER, fil), huvuden: m[1].toLowerCase().split(',').map((h) => h.trim()) })
  )
)

describe('edge-funktionernas CORS och Sentry', () => {
  it('hittar listorna (grinden får inte bli tom tyst)', () => {
    expect(listor.length).toBeGreaterThanOrEqual(6)
  })

  it('Sentry propagerar fortfarande till Supabase — annars behövs inte grinden', () => {
    expect(fs.readFileSync(SENTRY, 'utf8')).toMatch(/supabase\\\.co/)
  })

  it.each(listor.map((l) => [l.fil, l.huvuden] as const))('%s släpper igenom sentry-trace och baggage', (_fil, huvuden) => {
    expect(huvuden).toContain('sentry-trace')
    expect(huvuden).toContain('baggage')
  })
})
