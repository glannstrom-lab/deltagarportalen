/**
 * KSL25 (beslut Mikael 2026-10-11): varje anrop från /api/ai till OpenRouter ska
 * begära leverantörer som varken sparar eller tränar på datan
 * (`provider: { data_collection: 'deny' }`). Ett nytt anrop utan det är ett tyst
 * dataskyddsfel — därför räknas anropen mot modellraden.
 * Mutation: ta bort en `provider: OPENROUTER_PROVIDER` → faller.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const kalla = fs.readFileSync(path.resolve(__dirname, '../../api/ai.js'), 'utf8')

describe('/api/ai → OpenRouter: data_collection deny', () => {
  it('konstanten nekar datainsamling och styr till EU först, med reserv', () => {
    const konst = kalla.match(/const OPENROUTER_PROVIDER = \{([\s\S]*?)\};/)?.[1] ?? ''
    expect(konst).toMatch(/data_collection: 'deny'/)
    expect(konst).toMatch(/order: \['amazon-bedrock\/eu-west-1'\]/)
    // Reserven får inte stängas av av misstag — då slutar AI fungera när Bedrock är nere.
    expect(konst).toMatch(/allow_fallbacks: true/)
  })

  it('varje modellrad har provider-raden direkt efter sig', () => {
    const modellrader = kalla.match(/model: resolveModel\(\),/g) ?? []
    const medProvider = kalla.match(/model: resolveModel\(\),\s*\r?\n\s*provider: OPENROUTER_PROVIDER,/g) ?? []
    expect(modellrader.length).toBeGreaterThan(0)
    expect(medProvider.length).toBe(modellrader.length)
  })
})
