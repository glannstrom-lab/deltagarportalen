/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIX9: Varför passar annonsen mig? Servern bär ärlighetsreglerna:
 *  - en "traffar"-rad kräver citat som står ordagrant i BÅDE annonsen och CV-texten
 *  - en "saknas"-rad kräver bara annonscitat, och stryks om citatet finns i CV:t
 *  - inget procenttal släpps igenom, varken som fält eller i texten
 */
import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const ai = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; maxTokens: number; parseJson?: boolean; responseKey: string }>
  RESPONSE_VALIDATORS: Record<string, (v: unknown, indata?: unknown) => { ok: boolean; value?: Record<string, any>; error?: string }>
}
/* eslint-enable @typescript-eslint/no-require-imports */
const { PROMPTS, RESPONSE_VALIDATORS } = ai
const valid = RESPONSE_VALIDATORS['annons-matchning']

const ANNONS = `Vi söker en lagerarbetare till vårt lager i Borås.
Du har truckkort A och B. Erfarenhet av lagerarbete är meriterande.
Körkort B är ett krav. Arbetet innebär plock, pack och inventering enligt WMS.`
const CV = `Titel: Lagerarbetare
Kompetenser: Truckkort A, Plock och pack, Excel
Erfarenhet: Lagerarbetare på Nordfrakt. Plockade och packade order.`
const indata = { annons: ANNONS, cvText: CV }

describe('AIX9: annons-matchning', () => {
  it('finns som prompt med platta objekt, JSON och svarsnyckel matchning', () => {
    const p = PROMPTS['annons-matchning']({ annons: ANNONS, cvText: CV })
    expect(p.parseJson).toBe(true)
    expect(p.responseKey).toBe('matchning')
    expect(p.system).not.toContain('[[')
    expect(p.user).toContain('Truckkort A, Plock och pack')
    expect(p.system).toMatch(/procent/i)
  })

  it('behåller rader med belägg', () => {
    const r = valid({
      skal: [
        { typ: 'traffar', punkt: 'Truckkort A', annons: 'Du har truckkort A och B', cv: 'Truckkort A' },
        { typ: 'saknas', punkt: 'Körkort B', annons: 'Körkort B är ett krav' },
      ],
    }, indata)
    expect(r.ok).toBe(true)
    expect(r.value!.skal).toEqual([
      { typ: 'traffar', punkt: 'Truckkort A', annons: 'Du har truckkort A och B', cv: 'Truckkort A' },
      { typ: 'saknas', punkt: 'Körkort B', annons: 'Körkort B är ett krav' },
    ])
  })

  it('stryker en träff vars annonscitat inte står i annonsen', () => {
    const r = valid({ skal: [{ typ: 'traffar', punkt: 'x', annons: 'Minst fem års erfarenhet krävs', cv: 'Truckkort A' }] }, indata)
    expect(r.value!.skal).toEqual([])
  })

  it('stryker en träff vars CV-citat inte står i CV-texten', () => {
    const r = valid({ skal: [{ typ: 'traffar', punkt: 'Körkort B', annons: 'Körkort B är ett krav', cv: 'Körkort B sedan 2005' }] }, indata)
    expect(r.value!.skal).toEqual([])
  })

  it('stryker en träff utan CV-citat', () => {
    const r = valid({ skal: [{ typ: 'traffar', punkt: 'Truckkort', annons: 'Du har truckkort A och B' }] }, indata)
    expect(r.value!.skal).toEqual([])
  })

  it('stryker en "saknas" vars annonscitat inte står i annonsen', () => {
    const r = valid({ skal: [{ typ: 'saknas', punkt: 'Svenska', annons: 'God svenska i tal och skrift' }] }, indata)
    expect(r.value!.skal).toEqual([])
  })

  it('stryker en "saknas" som CV:t självt motsäger', () => {
    const r = valid({ skal: [{ typ: 'saknas', punkt: 'Truckkort', annons: 'truckkort A och B' }] }, { annons: ANNONS, cvText: `${CV}\nCertifikat: truckkort A och B` })
    expect(r.value!.skal).toEqual([])
  })

  it('släpper aldrig igenom ett procenttal, varken som fält eller i texten', () => {
    const r = valid({
      matchScore: 75,
      procent: '75 %',
      skal: [
        { typ: 'traffar', punkt: 'Du matchar 75 % på truckkort', annons: 'Du har truckkort A och B', cv: 'Truckkort A', matchScore: 75 },
        { typ: 'traffar', punkt: 'Hög matchning i procent', annons: 'Du har truckkort A och B', cv: 'Truckkort A' },
        { typ: 'traffar', punkt: 'Truckkort A finns', annons: 'Du har truckkort A och B', cv: 'Truckkort A', matchScore: 75 },
      ],
    }, indata)
    expect(r.value).not.toHaveProperty('matchScore')
    expect(r.value).not.toHaveProperty('procent')
    expect(r.value!.skal).toHaveLength(1)
    expect(r.value!.skal[0]).not.toHaveProperty('matchScore')
    expect(JSON.stringify(r.value)).not.toMatch(/%|procent|matchScore/i)
  })

  it('okänd typ stryks och högst åtta rader behålls', () => {
    const rad = { typ: 'saknas', punkt: 'Körkort', annons: 'Körkort B är ett krav' }
    const r = valid({ skal: [{ ...rad, typ: 'kanske' }, ...Array.from({ length: 12 }, () => rad)] }, indata)
    expect(r.value!.skal).toHaveLength(8)
  })

  it('tomt svar är giltigt, något som inte är ett objekt är det inte', () => {
    expect(valid({ skal: [] }, indata).value!.skal).toEqual([])
    expect(valid('text', indata).ok).toBe(false)
    expect(valid(null, indata).ok).toBe(false)
  })

  it('utan CV-text stryks alla träffar', () => {
    const r = valid({ skal: [{ typ: 'traffar', punkt: 'x', annons: 'Du har truckkort A och B', cv: 'Truckkort A' }] }, { annons: ANNONS, cvText: '' })
    expect(r.value!.skal).toEqual([])
  })
})
