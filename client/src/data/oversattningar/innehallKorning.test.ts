/**
 * Vakt över att översättningen faktiskt ANVÄNDS.
 *
 * `innehallsparitet.test.ts` bevisar att varje svensk sträng har en engelsk
 * motsvarighet. Det säger ingenting om huruvida någon slår upp den. Den här
 * filen prövar körningsvägen: rätt språk in → översatt text ut, och svenska
 * in → ingen overlay hämtas alls.
 *
 * Skälet den finns: hela buggklassen i det här projektet är att något är
 * byggt men inte inkopplat (se CLAUDE.md, "Koden är klar är inte det gäller i
 * drift"). Ett komplett overlay-bibliotek som ingen läser hade sett exakt ut
 * som ett fungerande system i alla andra tester.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { oversattInnehall, hamtaOverlay } from './index'

/** Sätter språket så som `i18n/config.ts` gör det. */
function sattSprak(sprak: string) {
  localStorage.setItem('language', sprak)
}

describe('oversattInnehall', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returnerar svenskan oförändrad när språket är svenska', async () => {
    sattSprak('sv')
    const data = [{ id: 'strengths', title: 'Dina starkaste egenskaper' }]
    const ut = await oversattInnehall('exercises', data, 'exercises')
    expect(ut[0].title).toBe('Dina starkaste egenskaper')
    // Samma referens: ingen onödig kopiering för den stora majoriteten
    // användare som kör svenska.
    expect(ut).toBe(data)
  })

  it('byter till engelska när språket är engelska', async () => {
    sattSprak('en')
    const data = [{ id: 'strengths', title: 'Dina starkaste egenskaper' }]
    const ut = await oversattInnehall('exercises', data, 'exercises')
    // Nyckeln `exercises.strengths.title` finns i den riktiga overlayen.
    expect(ut[0].title).not.toBe('Dina starkaste egenskaper')
    expect(ut[0].title.length).toBeGreaterThan(0)
    expect(ut[0].id).toBe('strengths')
  })

  it('behåller svenskan för en nyckel som saknas i overlayen', async () => {
    sattSprak('en')
    const data = [{ id: 'finns-inte-i-overlayen', title: 'Svensk rubrik' }]
    const ut = await oversattInnehall('exercises', data, 'exercises')
    expect(ut[0].title).toBe('Svensk rubrik')
  })

  it('överlever ett trasigt localStorage utan att kasta', async () => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('blockerad lagring')
    }
    try {
      const data = [{ id: 'x', title: 'Svenska' }]
      const ut = await oversattInnehall('exercises', data, 'exercises')
      // Faller tillbaka på svenska — aldrig en krasch, aldrig tom text.
      expect(ut[0].title).toBe('Svenska')
    } finally {
      Storage.prototype.getItem = original
    }
  })
})

describe('hamtaOverlay', () => {
  it('ger en tom overlay för en okänd modul i stället för att kasta', async () => {
    const ut = await hamtaOverlay('finns-inte')
    expect(ut).toEqual({})
  })

  it('minns overlayen mellan anrop', async () => {
    const a = await hamtaOverlay('coaches')
    const b = await hamtaOverlay('coaches')
    expect(a).toBe(b)
  })

  it('de fyra modulerna går att ladda och är icke-tomma', async () => {
    for (const modul of ['exercises', 'interestGuide', 'externaResurser', 'coaches']) {
      const o = await hamtaOverlay(modul)
      expect(Object.keys(o).length, `${modul} är tom`).toBeGreaterThan(0)
    }
  })
})
