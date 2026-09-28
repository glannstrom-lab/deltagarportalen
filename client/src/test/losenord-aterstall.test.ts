/**
 * PUB-1 (skarpt test 2026-09-28): glömt lösenord fanns inte. Mejlmallen och edge-
 * funktionens regler vaktas här — mallen laddas på riktigt (fri från Deno-importer).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAterstallEmailTemplate, AMNE } from '../../../supabase/functions/losenord-aterstall/mall.ts'

const funktion = readFileSync(resolve(__dirname, '../../../supabase/functions/losenord-aterstall/index.ts'), 'utf8')

describe('återställningsmejlet', () => {
  it('har länken och eskaperar den', () => {
    const html = getAterstallEmailTemplate({ actionUrl: 'https://www.jobin.se/#/nytt-losenord?th=abc"<x>' })
    expect(html).toContain('https://www.jobin.se/#/nytt-losenord?th=abc&quot;&lt;x&gt;')
    expect(html).not.toContain('"<x>')
    expect(AMNE).toMatch(/lösenord/i)
  })
})

describe('edge-funktionen losenord-aterstall', () => {
  it('använder engångskod (token_hash) — fungerar på alla enheter, till skillnad från PKCE-länken', () => {
    expect(funktion).toMatch(/generateLink\(\{ type: 'recovery'/)
    expect(funktion).toMatch(/nytt-losenord\?th=/)
  })
  it('avslöjar inte om adressen har ett konto: okänd adress och adresstak ger samma svar', () => {
    expect(funktion).toMatch(/if \(error \|\| !hash\) return ok\(\)/)
    expect(funktion).toMatch(/if \(!perAdress\.allowed\) return ok\(\)/)
  })
})
