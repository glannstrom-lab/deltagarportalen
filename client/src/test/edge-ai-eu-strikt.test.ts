/**
 * KC1 (2026-10-21): KF8:s regel — organisationers AI-anrop bara till Bedrock i
 * Irland, utan reserv — satt bara i client/api/ai.js. De fem edge-funktionerna som
 * anropar OpenRouter skickade organisationers anrop utan `provider`, så OpenRouter
 * valde fritt bland gpt-oss-120b:s leverantörer, även utanför EU. Kommunsidan
 * lovade ändå "AI-data stannar i EU".
 *
 * Grinden läser källan (edge-funktionerna är Deno och går inte att importera här):
 * varje OpenRouter-anrop i en edge-funktion ska sprida `openRouterRouting(modell)`,
 * och den delade konstanten ska vara samma som i api/ai.js.
 *
 * Testet kan falla: ta bort `...openRouterRouting(modell),` ur ett av anropen, eller
 * byt `allow_fallbacks: false` mot `true` i aiGate.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const FUNKTIONER = resolve(__dirname, '../../../supabase/functions')
const las = (p: string) => readFileSync(p, 'utf-8').replace(/\r\n/g, '\n')

const anropare = readdirSync(FUNKTIONER)
  .filter((d) => !d.startsWith('_'))
  .map((d) => join(FUNKTIONER, d, 'index.ts'))
  .filter((p) => existsSync(p) && /openrouter\.ai|OPENROUTER_API_URL/.test(las(p)))

describe('KC1: edge-funktionernas AI-anrop följer KF8', () => {
  it('hittar OpenRouter-anroparna (annars mäter grinden ingenting)', () => {
    expect(anropare.length).toBeGreaterThanOrEqual(5)
  })

  it.each(anropare.map((p) => [p.split(/[\\/]/).slice(-2, -1)[0], p]))(
    '%s: varje anrop sprider openRouterRouting(modell)',
    (_namn, p) => {
      const kod = las(p as string)
      const anrop = (kod.match(/\n\s*messages:\s*\[/g) || []).length
      const routing = (kod.match(/\.\.\.openRouterRouting\(modell\),/g) || []).length
      expect(anrop).toBeGreaterThan(0)
      expect(routing).toBe(anrop)
    },
  )

  it('aiGate.ts: bara Irland, ingen reserv, och bara för organisationskonton', () => {
    const gate = las(join(FUNKTIONER, '_shared/aiGate.ts'))
    const block = gate.match(/export const OPENROUTER_PROVIDER_EU_STRIKT = \{([\s\S]*?)\}/)?.[1] ?? ''
    expect(block).toContain("order: ['amazon-bedrock/eu-west-1']")
    expect(block).toContain('allow_fallbacks: false')
    expect(gate).toMatch(/return modell\.orgKonto \? \{ provider: OPENROUTER_PROVIDER_EU_STRIKT \} : \{\}/)
    // Uppslagsfel i modellvalet ska ge den strikta vägen (fail closed).
    expect(gate).toMatch(/const bas: ModellVal = \{ model: BASMODELL, webbsokning: false, orgKonto: true \}/)
  })

  it('samma regel som i api/ai.js', () => {
    const api = las(resolve(__dirname, '../../api/ai.js'))
    const block = api.match(/const OPENROUTER_PROVIDER_EU_STRIKT = \{([\s\S]*?)\};/)?.[1] ?? ''
    expect(block).toContain("order: ['amazon-bedrock/eu-west-1']")
    expect(block).toContain('allow_fallbacks: false')
  })
})
