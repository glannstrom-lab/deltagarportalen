/**
 * DE2 — reservvärden i mejlkoden får inte peka fel.
 *
 * BAKGRUND (projektgenomgången 2026-09-07). Tre reservvärden ljög tyst:
 *   · `EMAIL_FROM` saknad → `onboarding@resend.dev`, Resends sandlåda som bara
 *     levererar till kontoägaren. Mejlet såg skickat ut och nådde ingen.
 *   · `VITE_APP_URL` saknad → `https://deltagarportalen.se` (staging) i alla
 *     fyra länkar i jobbevakningsmejlet — och utan `#`, så även rätt värd
 *     hade landat på startsidan (HashRouter).
 *   · `SITE_URL` saknad → `http://localhost:5173/#/invite/…` i inbjudan.
 *
 * Nu: produktionsdomänen som reserv för URL:er, och saknad avsändaradress
 * är ett fel som svarar 500 i stället för att gå till sandlådan.
 *
 * VARFÖR EN KÄLLKODSVAKT. `job-alerts.js` bygger Supabase-klienter vid
 * import och `send-invite-email` är Deno. Vakten matchar KODFORMEN
 * (`|| '…'`), inte ordet — sandlådeadressen står kvar i förklarande
 * kommentarer, och en vakt som matchar sin egen förklaring kan aldrig bli
 * grön (lärdomen 2026-08-21). `saknarAvsandare` är exporterad och prövas
 * på riktigt.
 *
 * Mutationstestad 2026-09-08: återinförd `|| 'Jobin <onboarding@resend.dev>'`
 * i job-alerts.js fällde testet.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function las(rel: string): string {
  return readFileSync(resolve(__dirname, rel), 'utf8').replace(/\r\n/g, '\n')
}

const JOB_ALERTS = () => las('../../api/job-alerts.js')
const SEND_INVITE = () => las('../../../supabase/functions/send-invite-email/index.ts')

describe('DE2 — ingen sandlådeadress som reserv för avsändaren', () => {
  it.each([
    ['client/api/job-alerts.js', JOB_ALERTS],
    ['supabase/functions/send-invite-email/index.ts', SEND_INVITE],
  ])('%s faller inte tillbaka på resend.dev', (_namn, kod) => {
    // Kodformen: ett reservvärde efter `||`. Kommentarer nämner adressen
    // utan `||` framför.
    expect(kod()).not.toMatch(/\|\|\s*['"`][^'"`]*resend\.dev/)
  })

  it('job-alerts.js svarar 500 för send-digest när Resend-nyckel finns men EMAIL_FROM saknas', () => {
    const kod = JOB_ALERTS()
    expect(kod).toContain('saknarAvsandare(process.env)')
    // Grinden sitter i handlern och svarar 500 för den action som bara
    // finns för att mejla — inte bara loggar.
    const grind = kod.match(/if \(emailConfigError && action === 'send-digest'\) \{[\s\S]*?\n {2}\}/)?.[0]
    expect(grind).toBeDefined()
    expect(grind).toContain('res.status(500)')
    expect(kod).toMatch(/if \(emailConfigError\) \{\s*console\.error\(/)
  })

  it('job-alerts.js låter check/check-user köra vidare (portalnotiserna) men bär felet i svaret', () => {
    // DE1: mejl når ändå inte fram i dag; portalnotisen är den enda kanalen.
    // Ett 500 före `check` hade tystat den också.
    const kod = JOB_ALERTS()
    expect(kod).not.toMatch(/if \(saknarAvsandare\(process\.env\)\) \{[\s\S]*?res\.status\(500\)/)
    expect((kod.match(/\{ emailConfigError \}/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('send-invite-email svarar 500 i samma läge', () => {
    const kod = SEND_INVITE()
    const grind = kod.match(/if \(resendApiKey && !emailFrom\) \{[\s\S]*?\n {4}\}/)?.[0]
    expect(grind).toBeDefined()
    expect(grind).toContain('500')
    expect(grind).toContain('console.error(')
  })
})

describe('DE2 — URL-reserver pekar på produktionen, med brädgård', () => {
  it('job-alerts.js faller tillbaka på www.jobin.se, inte staging', () => {
    const kod = JOB_ALERTS()
    expect(kod).not.toMatch(/\|\|\s*['"`]https:\/\/(www\.)?deltagarportalen\.se/)
    expect(kod).toContain("process.env.VITE_APP_URL || 'https://www.jobin.se'")
  })

  it('mejllänkarna går genom HashRouter-vägar (/#/…), inte råa sökvägar', () => {
    const kod = JOB_ALERTS()
    // Alla href/text-länkar in i portalen använder de två konstanterna.
    expect(kod).toContain("`${APP_URL}/#/job-search`")
    expect(kod).toContain("`${APP_URL}/#/job-search/alerts`")
    // Den gamla formen, som landade på startsidan.
    expect(kod).not.toContain("}/job-search?tab=alerts")
    expect(kod).not.toMatch(/\$\{process\.env\.VITE_APP_URL[^}]*\}\/job-search/)
  })

  it('send-invite-email faller tillbaka på www.jobin.se, inte localhost', () => {
    const kod = SEND_INVITE()
    expect(kod).not.toMatch(/\|\|\s*['"`]http:\/\/localhost/)
    expect(kod).toContain("Deno.env.get('SITE_URL') || 'https://www.jobin.se'")
  })
})

describe('DE2 — saknarAvsandare avgör rätt', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  // job-alerts.js bygger Supabase-klienter vid import; utan URL/nyckel kastar
  // createClient. Sätt attrapper innan modulen laddas.
  process.env.VITE_SUPABASE_URL ||= 'https://test.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY ||= 'test-anon'
  const { saknarAvsandare } = require('../../api/job-alerts.js') as {
    saknarAvsandare: (env: Record<string, string | undefined>) => boolean
  }
  /* eslint-enable @typescript-eslint/no-require-imports */

  it('nyckel utan adress = fel', () => {
    expect(saknarAvsandare({ RESEND_API_KEY: 're_x' })).toBe(true)
    expect(saknarAvsandare({ RESEND_API_KEY: 're_x', EMAIL_FROM: '' })).toBe(true)
  })

  it('nyckel med adress = ok', () => {
    expect(saknarAvsandare({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'Jobin <noreply@jobin.se>' })).toBe(false)
  })

  it('ingen nyckel alls = inte det här felet (mejlen köas som pending, som förut)', () => {
    expect(saknarAvsandare({})).toBe(false)
    expect(saknarAvsandare({ EMAIL_FROM: 'Jobin <noreply@jobin.se>' })).toBe(false)
  })
})
