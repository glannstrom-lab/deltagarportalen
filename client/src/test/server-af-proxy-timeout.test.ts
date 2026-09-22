/**
 * SÄK2 (2026-09-22) — fem av åtta AF-/utbildningsproxyer hade INGEN timeout
 * på sitt utgående fetch-anrop mot Jobtech/Yrkesbarometern.
 *
 * BAKGRUND. A13 (2026-07-23) satte 8s `AbortController`-timeout på
 * `af-jobsearch` uttryckligen "så en hängande AF-anslutning inte kan hålla
 * serverless-instansen till Vercels maxDuration" (samma kommentar upprepas i
 * `client/api/job-alerts.js`). `education-search` fick samma skydd. Men fem
 * andra proxyer mot exakt samma familj av externa API:er —
 * `af-trends`, `af-historical`, `af-jobed`, `af-enrichments`, `af-prognos` —
 * gjorde aldrig samma sak: ett rått `fetch(url, { headers: {...} })` utan
 * `signal`. En hängande extern anslutning hade hållit den Supabase-edge-
 * instansen upptagen tills plattformens egen (mycket längre) maxtid, i
 * stället för att svara med ett kontrollerat fel efter 8 sekunder som resten
 * av portalen gör. `af-taxonomy` har tre sekventiella sådana anrop i
 * `getOccupations()` — värsta fallet där var tre hängande anslutningar efter
 * varandra.
 *
 * Den här filen läser källkoden (samma grepp som `edge-cors.test.ts` och
 * `ai-sanningsregel.test.ts` — funktionerna kör `Deno.serve` vid import och
 * går inte att exekvera meningsfullt under vitest) och kräver att varje
 * proxyfunktions utgående `fetch()`-anrop mot en extern källa har ett
 * `AbortController`-baserat timeout, i linje med `af-jobsearch`.
 *
 * `af-taxonomy` är MEDVETET UTELÄMNAD här: den har tre separata
 * fallback-anrop (JobSearch/search → taxonomy.api → JobSearch/complete) och
 * en egen catch-och-fortsätt-struktur som gör en enhetlig sweep mindre
 * självklar. Kvarstår som separat fynd — se granskningsrapporten.
 * `bolagsverket` (OAuth + tre datauppslag) är av samma skäl kvar som fynd,
 * inte fixat här.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FUNKTIONER = [
  'af-trends',
  'af-historical',
  'af-jobed',
  'af-enrichments',
  'af-prognos',
]

function kalla(funktion: string): string {
  return readFileSync(
    resolve(__dirname, `../../../supabase/functions/${funktion}/index.ts`),
    'utf-8',
  )
}

describe('AF-proxyer aborterar hängande externa anrop i stället för att hålla instansen upptagen', () => {
  it.each(FUNKTIONER)('%s har minst ett AbortController-timeout på sitt fetch mot en extern källa', (funktion) => {
    const src = kalla(funktion)
    expect(src, `${funktion}: saknar AbortController`).toMatch(/new AbortController\(\)/)
    expect(src, `${funktion}: saknar setTimeout(() => controller.abort()`).toMatch(
      /setTimeout\(\(\) => controller\.abort\(\)/,
    )
    // Signalen måste faktiskt skickas med i fetch-anropet — annars är
    // AbortController-koden dekoration utan effekt.
    expect(src, `${funktion}: skickar inte signal: controller.signal till fetch`).toMatch(
      /signal:\s*controller\.signal/,
    )
  })

  it('af-jobsearch (referensmönstret) har fortfarande sitt timeout', () => {
    const src = kalla('af-jobsearch')
    expect(src).toMatch(/new AbortController\(\)/)
    expect(src).toMatch(/signal:\s*controller\.signal/)
  })
})
