/**
 * Vakt över INNEHÅLLETS engelska översättning.
 *
 * Grinden `sprakparitet.test.ts` vaktar gränssnittstexten i `i18n/locales`.
 * Den här vaktar innehållet: övningar, intresseguide, externa resurser och
 * rådgivare — den text som ligger i datafiler och som i18next aldrig ser.
 *
 * Varför den behövs: när innehållet översattes 2026-08-24 var den engelska
 * ytan komplett medan allt användaren faktiskt läste var svenskt. Utan grind
 * återkommer det tyst — en ny övning läggs till på svenska, overlayen glöms,
 * och den engelska användaren får svensk text mitt i sin övning utan att
 * något larmar. Fallbacken är avsiktligt tyst i drift (svenska hellre än tom
 * ruta); därför måste bristen fångas här i stället.
 *
 * Nycklarna räknas fram ur den LEVANDE datan vid varje körning — det finns
 * alltså inget manifest som kan bli inaktuellt.
 */
import { describe, it, expect } from 'vitest'
import { gaIgenomTexter, oversattStruktur } from '@/lib/innehallsOversattning'
import { INNEHALLSMODULER } from './register'

import exercisesEn from './exercises.en.json'
import interestGuideEn from './interestGuide.en.json'
import externaResurserEn from './externaResurser.en.json'
import coachesEn from './coaches.en.json'

const OVERLAYER: Record<string, Record<string, string>> = {
  exercises: exercisesEn,
  interestGuide: interestGuideEn,
  externaResurser: externaResurserEn,
  coaches: coachesEn,
}

/** Nycklar + svenska texter för en modul, framräknade ur den levande datan. */
async function svenskaTexter(modul: (typeof INNEHALLSMODULER)[number]) {
  const data = await modul.ladda()
  const ut: Record<string, string> = {}
  for (const [namn, varde] of Object.entries(data)) {
    gaIgenomTexter(varde, (nyckel, text) => { ut[nyckel] = text }, namn)
  }
  return ut
}

describe('innehållet är översatt till engelska', () => {
  for (const modul of INNEHALLSMODULER) {
    describe(modul.namn, () => {
      it('varje svensk sträng har en engelsk motsvarighet', async () => {
        const sv = await svenskaTexter(modul)
        const en = OVERLAYER[modul.namn] ?? {}
        const saknas = Object.keys(sv).filter((k) => !(k in en))
        expect(
          saknas,
          `${saknas.length} strängar saknar översättning i ${modul.namn}.en.json:\n` +
            saknas.slice(0, 15).map((k) => `  ${k} = ${JSON.stringify(sv[k])}`).join('\n')
        ).toEqual([])
      })

      it('overlayen har inga nycklar som datan inte längre har', async () => {
        const sv = await svenskaTexter(modul)
        const en = OVERLAYER[modul.namn] ?? {}
        const overblivna = Object.keys(en).filter((k) => !(k in sv))
        // Överblivna nycklar är inte farliga i drift, men de betyder att
        // innehåll tagits bort utan att översättningen städats — och de gör
        // det svårare att se vad som faktiskt saknas.
        expect(
          overblivna,
          `Överblivna nycklar i ${modul.namn}.en.json: ${overblivna.slice(0, 15).join(', ')}`
        ).toEqual([])
      })

      it('inget engelskt värde är tomt', () => {
        const en = OVERLAYER[modul.namn] ?? {}
        const tomma = Object.keys(en).filter((k) => !String(en[k] ?? '').trim())
        expect(tomma, `Tomma värden: ${tomma.slice(0, 15).join(', ')}`).toEqual([])
      })
    })
  }
})

describe('översättningen bevarar strukturen', () => {
  it('oversattStruktur byter text men rör inte id, ikoner eller nyckelfält', () => {
    const data = {
      lista: [
        { id: 'a', title: 'Svensk titel', category: 'Jobbsökning', icon: () => null },
      ],
    }
    const ut = oversattStruktur(data, { 'lista.a.title': 'English title' }, '')
    expect(ut.lista[0].title).toBe('English title')
    expect(ut.lista[0].id).toBe('a')
    // category är en nyckel i koden (filtrering, färguppslag) och översätts
    // vid rendering i stället — den måste vara orörd här.
    expect(ut.lista[0].category).toBe('Jobbsökning')
    expect(ut.lista[0].icon).toBe(data.lista[0].icon)
  })

  it('behåller svenskan när nyckeln saknas i overlayen', () => {
    const ut = oversattStruktur({ a: 'Svensk text' }, {}, '')
    expect(ut.a).toBe('Svensk text')
  })

  it('nycklar följer id, inte position — omordning ändrar dem inte', () => {
    const overlay = { 'lista.b.title': 'Second' }
    const foreOmordning = oversattStruktur(
      { lista: [{ id: 'a', title: 'Ett' }, { id: 'b', title: 'Två' }] }, overlay, ''
    )
    const efterOmordning = oversattStruktur(
      { lista: [{ id: 'b', title: 'Två' }, { id: 'a', title: 'Ett' }] }, overlay, ''
    )
    expect(foreOmordning.lista[1].title).toBe('Second')
    expect(efterOmordning.lista[0].title).toBe('Second')
  })
})

// Ett test som inte kan falla bevisar ingenting (lärdomen 2026-08-09).
describe('grinden kan faktiskt falla', () => {
  it('upptäcker en sträng som saknar översättning', () => {
    const sv: Record<string, string> = {}
    gaIgenomTexter({ lista: [{ id: 'x', title: 'Otolkad svenska' }] }, (k, t) => { sv[k] = t }, '')
    const saknas = Object.keys(sv).filter((k) => !(k in { 'lista.x.beskrivning': 'x' }))
    expect(saknas.length).toBeGreaterThan(0)
  })
})
