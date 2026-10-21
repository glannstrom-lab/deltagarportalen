/**
 * KC6 (2026-10-21): inloggning med engångskod via e-post. Mejlmallen laddas på
 * riktigt (fri från Deno-importer); edge-funktionens regler läses ur källan.
 *
 * Den viktiga regeln: funktionen skapar ALDRIG ett konto. generateLink med
 * typen magiclink registrerar en okänd adress, så profilkontrollen måste stå
 * före. Kan falla: flytta generateLink före profiluppslaget, eller ta bort
 * `if (!profil) return ok()`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getEngangskodEmailTemplate, AMNE } from '../../../supabase/functions/engangskod/mall.ts'

const funktion = readFileSync(resolve(__dirname, '../../../supabase/functions/engangskod/index.ts'), 'utf8')
const kod = funktion.replace(/^\s*\/\/.*$/gm, '')

describe('engångskodsmejlet', () => {
  it('har koden och länken, och eskaperar båda', () => {
    const html = getEngangskodEmailTemplate({ kod: '123456', actionUrl: 'https://www.jobin.se/#/logga-in-med-kod?th=abc"<x>' })
    expect(html).toContain('123456')
    expect(html).toContain('https://www.jobin.se/#/logga-in-med-kod?th=abc&quot;&lt;x&gt;')
    expect(html).not.toContain('"<x>')
    expect(AMNE).toMatch(/kod/i)
  })
})

describe('edge-funktionen engangskod', () => {
  it('skapar aldrig ett konto: profilen kontrolleras före generateLink, okänd adress svarar ok utan mejl', () => {
    const profil = kod.indexOf(".from('profiles').select('id').eq('email', epost)")
    const lank = kod.indexOf("generateLink({ type: 'magiclink'")
    expect(profil).toBeGreaterThan(-1)
    expect(lank).toBeGreaterThan(profil)
    expect(kod.slice(profil, lank)).toMatch(/if \(!profil\) return ok\(\)/)
    // Ett uppslagsfel får inte falla igenom till generateLink.
    expect(kod.slice(profil, lank)).toMatch(/if \(profilFel\) throw/)
  })

  it('avslöjar inte om adressen har ett konto: adresstak och misslyckad länk ger samma svar', () => {
    expect(kod).toMatch(/if \(!perAdress\.allowed\) return ok\(\)/)
    expect(kod).toMatch(/if \(error \|\| !hash \|\| !kod\) return ok\(\)/)
  })

  it('länken pekar på sidan som löser in token_hash', () => {
    expect(kod).toMatch(/logga-in-med-kod\?th=/)
  })

  it('rate limit finns för båda nycklarna', () => {
    const rl = readFileSync(resolve(__dirname, '../../../supabase/functions/_shared/rateLimit.ts'), 'utf8')
    expect(rl).toContain("'engangskod-ip'")
    expect(rl).toContain("'engangskod-epost'")
  })
})
