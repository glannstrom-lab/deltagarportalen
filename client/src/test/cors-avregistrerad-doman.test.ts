/**
 * BS1 (2026-09-24) — `deltagarportalen.se` är avregistrerad.
 *
 * Domänen svarar NXDOMAIN (kontrollerat mot 8.8.8.8 2026-09-24, både apex och www).
 * En avregistrerad domän kan registreras av vem som helst, och den som äger den
 * kan då servera en sida vars `fetch` mot `/api/ai` och `/api/cv-pdf` släpps igenom
 * av CORS. Den stod dessutom FÖRST i listan — alltså det värde ett okänt ursprung
 * fick tillbaka i `Access-Control-Allow-Origin`.
 *
 * VARFÖR DET HÄR ÄR ETT BETEENDETEST OCH INTE BARA EN STRÄNGSÖKNING. Filerna går
 * inte att importera i vitest (de drar in Supabase, rate-limiter och prompter vid
 * import — se `cors-preview.test.ts`). I stället skärs `ALLOWED_ORIGINS` och
 * `getCorsHeaders` ut ur källan och körs med ett påhittat `process.env`. Det prövar
 * vad funktionen faktiskt svarar, inte vilka ord som står i filen.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FILER = ['ai.js', 'cv-pdf.js', 'job-alerts.js'] as const

type Cors = (origin: string) => Record<string, string>

function laddaCors(fil: string, env: Record<string, string | undefined> = {}): Cors {
  const kod = readFileSync(resolve(__dirname, '../../api', fil), 'utf8').replace(/\r\n/g, '\n')

  const listStart = kod.indexOf('const ALLOWED_ORIGINS = [')
  const listSlut = kod.indexOf('].filter(Boolean);', listStart)
  if (listStart < 0 || listSlut < 0) throw new Error(`${fil}: hittar inte ALLOWED_ORIGINS`)
  const lista = kod.slice(listStart, listSlut + '].filter(Boolean);'.length)

  // cv-pdf.js har en hjälpfunktion isAllowedOrigin; ai.js gör includes direkt.
  const hjalpStart = kod.indexOf('function isAllowedOrigin(')
  const hjalp = hjalpStart >= 0 ? kod.slice(hjalpStart, kod.indexOf('\n}\n', hjalpStart) + 3) : ''

  const fnStart = kod.indexOf('function getCorsHeaders(')
  if (fnStart < 0) throw new Error(`${fil}: hittar inte getCorsHeaders`)
  const fn = kod.slice(fnStart, kod.indexOf('\n}\n', fnStart) + 3)

  const process = { env: { NODE_ENV: 'production', ...env } }
  return new Function('process', `${lista}\n${hjalp}\n${fn}\nreturn getCorsHeaders;`)(process) as Cors
}

describe('BS1 — den avregistrerade domänen släpps inte igenom av CORS', () => {
  it.each(FILER)('%s speglar inte tillbaka deltagarportalen.se', (fil) => {
    const cors = laddaCors(fil)
    for (const origin of ['https://deltagarportalen.se', 'https://www.deltagarportalen.se']) {
      expect(cors(origin)['Access-Control-Allow-Origin']).not.toBe(origin)
    }
  })

  it.each(FILER)('%s svarar ett okänt ursprung med produktionsdomänen, inte en död domän', (fil) => {
    const cors = laddaCors(fil)
    // jobin.se svarar 307 till www.jobin.se — www är den kanoniska adressen.
    expect(cors('https://angripare.example')['Access-Control-Allow-Origin']).toBe('https://www.jobin.se')
  })

  it.each(FILER)('%s släpper fortfarande igenom prod och deployens egen URL', (fil) => {
    const cors = laddaCors(fil, { VERCEL_URL: 'deltagarportal-abc123-glannstrom.vercel.app' })
    for (const origin of [
      'https://www.jobin.se',
      'https://jobin.se',
      'https://deltagarportal-abc123-glannstrom.vercel.app',
    ]) {
      expect(cors(origin)['Access-Control-Allow-Origin']).toBe(origin)
    }
  })

  it.each(FILER)('%s har inte kvar domänen som sträng i koden', (fil) => {
    const kod = readFileSync(resolve(__dirname, '../../api', fil), 'utf8')
    // Kodformen med citattecken — kommentarerna får nämna domänen.
    expect(kod).not.toMatch(/['"`]https:\/\/(www\.)?deltagarportalen\.se['"`]/)
  })
})
