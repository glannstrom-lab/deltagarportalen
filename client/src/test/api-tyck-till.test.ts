/**
 * FN15 — /api/tyck-till (2026-10-20).
 *
 * Tre saker som inte får glida: användaren kommer ur den verifierade
 * sessionen och aldrig ur kroppen, personnummer maskeras innan raden sparas
 * och mejlas, och mottagarens e-post följer bara med när användaren själv
 * kryssat i att vi får höra av oss.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const api = require(resolve(__dirname, '../../api/tyck-till.js')) as {
  tolkaInskick: (body: unknown) => { fel?: string; rad?: Record<string, unknown> }
  maskeraPersonnummer: (s: string) => string
  byggMejl: (rad: Record<string, unknown>, epost: string | null) => { subject: string; html: string; text: string }
}

describe('tolkaInskick', () => {
  it('godtar en idé och städar fälten', () => {
    const { rad } = api.tolkaInskick({ typ: 'ide', meddelande: '  Mörkt läge i kalendern  ', sida: '/calendar?id=abc', sprak: 'sv', farKontakta: true })
    expect(rad).toMatchObject({ typ: 'ide', meddelande: 'Mörkt läge i kalendern', sida: '/calendar', sprak: 'sv', far_kontakta: true, klientfel: [] })
  })

  it('tar aldrig user_id, roll eller status ur kroppen', () => {
    const { rad } = api.tolkaInskick({ typ: 'fel', meddelande: 'x', user_id: 'annan', roll: 'SUPERADMIN', status: 'atgardad', mejl_skickat: true })
    expect(rad).not.toHaveProperty('user_id')
    expect(rad).not.toHaveProperty('roll')
    expect(rad).not.toHaveProperty('status')
    expect(rad).not.toHaveProperty('mejl_skickat')
  })

  it('avvisar okänd typ, tom text och för lång text', () => {
    expect(api.tolkaInskick({ typ: 'spam', meddelande: 'x' }).fel).toBeTruthy()
    expect(api.tolkaInskick({ typ: 'ide', meddelande: '   ' }).fel).toBeTruthy()
    expect(api.tolkaInskick({ typ: 'ide', meddelande: 'a'.repeat(4001) }).fel).toBeTruthy()
    expect(api.tolkaInskick(null).fel).toBeTruthy()
  })

  it('maskerar personnummer i texten och i klientfelen', () => {
    const { rad } = api.tolkaInskick({ typ: 'fel', meddelande: 'Mitt nr är 19850312-1234 och 850312-1234', klientfel: ['TypeError 198503121234'] })
    expect(rad?.meddelande).not.toMatch(/1234/)
    expect(String((rad?.klientfel as string[])[0])).not.toMatch(/198503121234/)
  })

  it('behåller högst fem klientfel, de senaste', () => {
    const { rad } = api.tolkaInskick({ typ: 'fel', meddelande: 'x', klientfel: ['1', '2', '3', '4', '5', '6', '7'] })
    expect(rad?.klientfel).toEqual(['3', '4', '5', '6', '7'])
  })
})

describe('byggMejl', () => {
  const rad = { typ: 'fel', meddelande: '<script>x</script>', sida: '/cv', roll: 'USER', sprak: 'sv', webblasare: 'UA', klientfel: [], far_kontakta: false }

  it('eskaperar användarens text', () => {
    expect(api.byggMejl(rad, null).html).not.toContain('<script>')
  })

  it('tar bara med e-posten när användaren sagt ja', () => {
    expect(api.byggMejl(rad, null).text).not.toContain('@')
    expect(api.byggMejl({ ...rad, far_kontakta: true }, 'anna@example.com').text).toContain('anna@example.com')
  })
})

describe('handlern', () => {
  const src = readFileSync(resolve(__dirname, '../../api/tyck-till.js'), 'utf8')

  it('sätter user_id från den verifierade sessionen', () => {
    expect(src).toMatch(/user_id:\s*user\.id/)
    expect(src).toMatch(/auth\.getUser\(/)
  })

  it('läser rollen ur databasen, inte ur klienten', () => {
    expect(src).toMatch(/from\('profiles'\)\.select\('role'\)/)
  })
})
