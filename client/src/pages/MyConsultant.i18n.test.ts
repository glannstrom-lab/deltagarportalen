/**
 * UX24 — `/my-consultant` renderade råa i18n-nycklar och i18next-felmeddelanden.
 *
 * Sidan anropade platta namn (`myConsultant.yourConsultant`, `myConsultant.messages`)
 * medan locale-filerna har dem nästlade (`myConsultant.consultant.yourConsultant`,
 * `myConsultant.messages.title`). Följden i produktion:
 *
 *   - 30 nycklar saknades helt  → i18next skrev ut själva nyckeln som text,
 *     bl.a. "myConsultant.bookMeeting" som knapptext.
 *   - 3 pekade på OBJEKT-noder  → i18next skrev ut sitt felmeddelande som RUBRIK:
 *     "key 'myConsultant.messages (sv)' returned an object instead of string."
 *
 * Det syntes bara för konton som HAR en tilldelad konsulent (31 deltagare i prod),
 * vilket är varför inget tidigare i18n-svep fångade det — de kördes på ett
 * testkonto utan konsulent. Två oberoende granskare hittade det 2026-08-04.
 *
 * Vakten läser sidans källa och kräver att varje `t('myConsultant.…')` löser ut
 * till en STRÄNG i BÅDA språken. Den kan alltså inte gå grön mot en mock — samma
 * skäl som A19-vakten i aiServerConsentGate.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

import sv from '../i18n/locales/sv.json'
import en from '../i18n/locales/en.json'

const source = readFileSync(join(__dirname, 'MyConsultant.tsx'), 'utf8')

/** Alla `t('myConsultant.…')` i sidan — utan träffar inne i kommentarer. */
function usedKeys(): string[] {
  const utanKommentarer = source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // JSX-kommentarer
    .replace(/\/\*[\s\S]*?\*\//g, '') // blockkommentarer
    .replace(/^\s*\/\/.*$/gm, '') // radkommentarer

  return [
    ...new Set(
      [...utanKommentarer.matchAll(/t\('(myConsultant\.[a-zA-Z0-9_.]+)'/g)].map((m) => m[1])
    ),
  ]
}

function lookup(bundle: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, bundle)
}

describe('UX24: /my-consultant får inte rendera råa i18n-nycklar', () => {
  const keys = usedKeys()

  it('hittar sidans nycklar (skyddar vakten mot att bli tom och därmed meningslös)', () => {
    expect(keys.length).toBeGreaterThan(50)
  })

  describe.each([
    ['sv', sv],
    ['en', en],
  ])('%s.json', (lang, bundle) => {
    it('har ett värde för varje nyckel sidan använder', () => {
      const saknas = keys.filter((k) => lookup(bundle, k) === undefined)
      expect(saknas, `Nycklar som saknas i ${lang}.json → renderas som rå nyckel i UI`).toEqual([])
    })

    it('pekar aldrig på en objekt-nod (då skriver i18next ut sitt felmeddelande som text)', () => {
      const objekt = keys.filter((k) => {
        const v = lookup(bundle, k)
        return typeof v === 'object' && v !== null
      })
      expect(
        objekt,
        `Nycklar som pekar på objekt i ${lang}.json → "returned an object instead of string" i UI`
      ).toEqual([])
    })
  })

  it('använder samma interpolationsvariabler som koden skickar in', () => {
    // `goalsCompleted` fick {completed, total} från koden men hade {{count}} i
    // JSON:en — texten hade renderats utan siffror även när nyckeln fanns.
    expect(lookup(sv, 'myConsultant.goals.goalsCompleted')).toContain('{{completed}}')
    expect(lookup(sv, 'myConsultant.goals.goalsCompleted')).toContain('{{total}}')
    expect(lookup(en, 'myConsultant.goals.goalsCompleted')).toContain('{{completed}}')
    expect(lookup(en, 'myConsultant.goals.goalsCompleted')).toContain('{{total}}')

    expect(source).toContain("t('myConsultant.goals.goalsCompleted', { completed:")
  })

  it('sv och en har samma nyckeluppsättning under myConsultant', () => {
    const flat = (o: unknown, p = ''): string[] =>
      o && typeof o === 'object'
        ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
            v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]
          )
        : []

    const svKeys = flat(lookup(sv, 'myConsultant')).sort()
    const enKeys = flat(lookup(en, 'myConsultant')).sort()
    expect(enKeys).toEqual(svKeys)
  })
})
