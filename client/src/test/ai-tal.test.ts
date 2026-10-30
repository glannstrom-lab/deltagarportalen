/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * AIX8: "Prata, så skriver vi". Det som ska gå att lita på är kontrollen i kod:
 * en rensning som lägger till ett ord, en siffra eller ett nekande, som tappar
 * innehåll eller som är längre än originalet ska aldrig nå personen.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const { arRensning, validera } = require('../../api/_prompts/_tal.js') as {
  arRensning: (o: string, r: string) => { ok: boolean; skal?: string }
  validera: (v: unknown, t: string) => { ok: boolean; error?: string; value?: { rensad: string } }
}
const { PROMPTS, RESPONSE_VALIDATORS } = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; parseJson?: boolean; responseKey: string }>
  RESPONSE_VALIDATORS: Record<string, (v: unknown, i?: unknown) => { ok: boolean }>
}

const TAL = 'eh jag jag har jobbat på lager i tre år alltså på på lagret hos Postnord och jag är liksom noggrann'

describe('AIX8: arRensning', () => {
  it.each([
    ['Jag har jobbat på lager i tre år, på lagret hos Postnord, och jag är noggrann.'],
    ['Jag har jobbat på lager i tre år. På lagret hos Postnord. Jag är noggrann.'],
  ])('släpper igenom en ren städning: %s', (rensad) => {
    expect(arRensning(TAL, rensad), JSON.stringify(arRensning(TAL, rensad))).toEqual({ ok: true })
  })

  it('släpper igenom böjning och stor bokstav', () => {
    expect(arRensning('jag arbetar med kunder och jag trivs', 'Jag arbetar med kunder och trivs.').ok).toBe(true)
  })

  it.each([
    ['nytt innehållsord', 'Jag har jobbat som chef på lager i tre år, hos Postnord, och är noggrann.', 'nytt ord'],
    ['ny merit', 'Jag har jobbat på lager i tre år hos Postnord och är noggrann och har truckkort.', 'nytt ord'],
    ['ändrad siffra', 'Jag har jobbat på lager i 3 år hos Postnord och är noggrann.', 'siffror'],
    ['borttaget innehåll', 'Jag har jobbat på lager hos Postnord.', 'ord borttaget'],
    ['tillagt nekande', 'Jag har jobbat på lager i tre år hos Postnord och är inte noggrann.', 'nytt ord'],
  ])('stoppar %s', (_namn, rensad, skal) => {
    const r = arRensning(TAL, rensad)
    expect(r.ok).toBe(false)
    expect(r.skal).toContain(skal)
  })

  it('stoppar ett borttaget nekande och ett tillagt nekande', () => {
    expect(arRensning('jag har inte jobbat på lager', 'Jag har jobbat på lager.').ok).toBe(false)
    expect(arRensning('jag har jobbat på lager', 'Jag har aldrig jobbat på lager.').ok).toBe(false)
  })

  it('stoppar en siffra som läggs till', () => {
    expect(arRensning('jag jobbade på lager', 'Jag jobbade 2019 på lager.').ok).toBe(false)
  })

  it('stoppar en rensning som är mer än marginellt längre', () => {
    const orig = 'jag har jobbat på lager'
    expect(arRensning(orig, 'Jag har jobbat på lager. ' + 'Jag har jobbat på lager. '.repeat(3)).ok).toBe(false)
  })
})

describe('AIX8: validera (hela svaret)', () => {
  it('tar emot ett platt objekt och en bar sträng', () => {
    const rensad = 'Jag har jobbat på lager i tre år.'
    expect(validera({ rensad }, 'jag har jobbat på lager i tre år').ok).toBe(true)
    expect(validera(rensad, 'jag har jobbat på lager i tre år').ok).toBe(true)
  })
  it('avvisar tomt, fel form och nya ord', () => {
    expect(validera({ rensad: '' }, 'hej').ok).toBe(false)
    expect(validera(null, 'hej').ok).toBe(false)
    expect(validera([['a', 'b']], 'hej').ok).toBe(false)
    expect(validera({ rensad: 'Hej, jag är projektledare.' }, 'hej jag är lagerarbetare').ok).toBe(false)
  })
})

describe('AIX8: inkoppling i ai.js', () => {
  it('prompten finns, begär JSON och ber inte om Lätt svenska', () => {
    const p = PROMPTS['rensa-tal']({ text: 'hej' })
    expect(p.parseJson).toBe(true)
    expect(p.responseKey).toBe('rensning')
    expect(p.system).not.toMatch(/lätt svenska/i)
    expect(p.user).toContain('hej')
  })
  it('valideraren är registrerad och körs mot indatans text', () => {
    const v = RESPONSE_VALIDATORS['rensa-tal']
    expect(v({ rensad: 'Jag är noggrann.' }, { text: 'jag är noggrann' }).ok).toBe(true)
    expect(v({ rensad: 'Jag är en noggrann ledare.' }, { text: 'jag är noggrann' }).ok).toBe(false)
  })
})

describe('AIX8: dagboken lämnas utanför (art. 9)', () => {
  const rot = path.resolve(__dirname, '..')
  const filer: string[] = []
  const gaIgenom = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) gaIgenom(p)
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) filer.push(p)
    }
  }
  gaIgenom(rot)
  it('ingen dagboksfil importerar PrataSaSkriverVi, rensaTal eller talApi', () => {
    const dagbok = filer.filter((f) => /diary|dagbok/i.test(f.replace(rot, '')))
    expect(dagbok.length).toBeGreaterThan(0)
    for (const f of dagbok) {
      expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/PrataSaSkriverVi|rensaTal|talApi|rensa-tal/)
    }
  })
  it('rensa-tal anropas bara från talApi', () => {
    const anropare = filer.filter((f) => fs.readFileSync(f, 'utf8').includes("'rensa-tal'"))
    expect(anropare.map((f) => path.basename(f))).toEqual(['talApi.ts'])
  })
})
