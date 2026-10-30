/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/**
 * AIX24 (Förklara myndighetsbrevet) och AIX29 (Gör det mindre).
 * Servern, inte UI:t, bär ärlighetsreglerna:
 *  - AIX24: varje rad har ett ordagrant citat ur brevet, varje siffra står i brevet,
 *    vårdtext skickas aldrig till modellen.
 *  - AIX29: inga påhittade telefonnummer, tider, belopp eller adresser i stegen.
 */
import { describe, it, expect } from 'vitest'

const ai = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system: string; user: string; maxTokens: number; parseJson?: boolean; responseKey: string }>
  RESPONSE_VALIDATORS: Record<string, (v: unknown, indata?: unknown) => { ok: boolean; value?: Record<string, any>; error?: string }>
}
const { serUtSomHalsotext, sifforFinns } = require('../../api/_prompts/_sprak.js') as {
  serUtSomHalsotext: (t: string) => boolean
  sifforFinns: (svar: string, kalla: string) => boolean
}
const { PROMPTS, RESPONSE_VALIDATORS } = ai

const BREV = `Arbetsförmedlingen
Kallelse till planeringssamtal
Du är kallad till ett planeringssamtal den 12 november 2026 klockan 09:30.
Kan du inte komma ska du höra av dig senast den 10 november. Ring din handläggare Eva Lind på 010-486 00 00.
Du ska ta med ditt ID-kort. Ersättningen är 1 500 kronor per vecka.`

const GILTIGT = {
  avsandare: 'Arbetsförmedlingen',
  vad: 'Du är kallad till ett samtal hos Arbetsförmedlingen.',
  gor: [['Gå till samtalet', 'Du är kallad till ett planeringssamtal den 12 november 2026']],
  senast: [['Samtalet', '12 november 2026', 'ett planeringssamtal den 12 november 2026 klockan 09:30']],
  vem: [['Eva Lind', '010-486 00 00', 'Ring din handläggare Eva Lind på 010-486 00 00']],
}

describe('AIX24: prompten', () => {
  it('finns i PROMPTS och bär sanningsregeln sist', () => {
    const p = PROMPTS['myndighetsbrev']({ brev: BREV })
    expect(p.system).toMatch(/SANNINGSREGEL/)
    expect(p.parseJson).toBe(true)
    expect(p.maxTokens).toBeGreaterThanOrEqual(400)
  })

  it('lägger brevet i user-meddelandet och kapar vid 4 000 tecken', () => {
    const p = PROMPTS['myndighetsbrev']({ brev: `${'a '.repeat(3000)}SLUTET` })
    expect(p.user).not.toContain('SLUTET')
    expect(p.user).toContain('BREV:')
  })

  it('skickar ALDRIG vårdtext till modellen', () => {
    const p = PROMPTS['myndighetsbrev']({ brev: 'Läkarintyg. Diagnos: F32.1. Patienten är sjukskriven.' })
    expect(p.user).not.toMatch(/Läkarintyg|Diagnos|Patienten/)
    expect(p.system).toMatch(/avvisad/)
  })

  it('ber om citat, ordagrant, och förbjuder uträknade datum', () => {
    const { system } = PROMPTS['myndighetsbrev']({ brev: BREV })
    expect(system).toMatch(/ordagrann/)
    expect(system).toMatch(/räkna aldrig ut ett datum/)
    expect(system).toMatch(/Arbetsförmedlingen, Försäkringskassan, CSN/)
  })

  it('Lätt svenska läggs på bara när sprak är sv-latt', () => {
    expect(PROMPTS['myndighetsbrev']({ brev: BREV, sprak: 'sv-latt' }).system).toMatch(/LÄTT SVENSKA/)
    expect(PROMPTS['myndighetsbrev']({ brev: BREV }).system).not.toMatch(/LÄTT SVENSKA/)
  })
})

describe('AIX24: vårdtext avvisas av koden', () => {
  it.each([
    'Läkarintyg för sjukpenning',
    'Diagnos: depression',
    'Enligt journalanteckning från 2026-03-01',
    'Patienten uppger smärta',
    'Diagnoskod F41.1 enligt ICD-10',
    'Ordination: sertralin 50 mg',
  ])('avvisar: %s', (t) => expect(serUtSomHalsotext(t)).toBe(true))

  it('släpper igenom ett vanligt myndighetsbrev, även ett om sjukpenning', () => {
    expect(serUtSomHalsotext(BREV)).toBe(false)
    expect(serUtSomHalsotext('Försäkringskassan har beslutat att du har rätt till sjukpenning från den 3 mars.')).toBe(false)
  })

  it('validatorn svarar avvisad: halsa oavsett vad modellen sa', () => {
    const r = RESPONSE_VALIDATORS['myndighetsbrev']({ vad: 'Allt är bra' }, { brev: 'Läkarintyg: patienten är sjuk.' })
    expect(r.ok).toBe(true)
    expect(r.value).toEqual({ avvisad: 'halsa' })
  })
})

describe('AIX24: siffror måste stå i brevet', () => {
  it('godtar siffror som finns, oavsett mellanrum och skiljetecken', () => {
    expect(sifforFinns('1500 kronor', BREV)).toBe(true)
    expect(sifforFinns('kl 09:30', BREV)).toBe(true)
    expect(sifforFinns('12 november 2026', BREV)).toBe(true)
    expect(sifforFinns('010-486 00 00', BREV)).toBe(true)
  })

  it.each(['2 000 kronor', 'den 13 november', 'kl 10:00', '0771-60 00 00', '3 dagar', '2026-11-12'])('nekar en siffra som inte står där: %s', (s) => {
    expect(sifforFinns(s, BREV)).toBe(false)
  })

  it('en text utan siffror är alltid ok', () => {
    expect(sifforFinns('Ring handläggaren', BREV)).toBe(true)
  })
})

describe('AIX24: validatorn tar bort det som saknar belägg', () => {
  const validera = RESPONSE_VALIDATORS['myndighetsbrev']
  const indata = { brev: BREV }

  it('släpper igenom ett helt belagt svar', () => {
    const r = validera(GILTIGT, indata)
    expect(r.ok).toBe(true)
    expect(r.value!.gor).toHaveLength(1)
    expect(r.value!.senast).toHaveLength(1)
    expect(r.value!.vem).toHaveLength(1)
    expect(r.value!.avsandare).toBe('Arbetsförmedlingen')
  })

  it('tar bort en rad vars citat inte står i brevet', () => {
    const r = validera({ ...GILTIGT, gor: [['Betala en avgift', 'Du ska betala en avgift']] }, indata)
    expect(r.value!.gor).toEqual([])
  })

  it('tar bort ett steg med en påhittad siffra, även om citatet stämmer', () => {
    const r = validera({ ...GILTIGT, gor: [['Ta med 3 intyg', 'Du ska ta med ditt ID-kort']] }, indata)
    expect(r.value!.gor).toEqual([])
  })

  it('tar bort ett datum som modellen räknat ut', () => {
    const r = validera({ ...GILTIGT, senast: [['Samtalet', '13 november 2026', 'ett planeringssamtal den 12 november 2026']] }, indata)
    expect(r.value!.senast).toEqual([])
  })

  it('tar bort en kontaktuppgift som inte står i brevet, med hela raden', () => {
    const r = validera({ ...GILTIGT, vem: [['Eva Lind', '010-111 11 11', 'Ring din handläggare Eva Lind']] }, indata)
    expect(r.value!.vem).toEqual([])
  })

  it('behåller en kontaktrad utan telefonnummer om namn och citat stämmer', () => {
    const r = validera({ ...GILTIGT, vem: [['Eva Lind', '', 'Ring din handläggare Eva Lind']] }, indata)
    expect(r.value!.vem).toHaveLength(1)
  })

  it('fäller svaret om sammanfattningen har en siffra som inte står i brevet', () => {
    const r = validera({ ...GILTIGT, vad: 'Du får 2 000 kronor.' }, indata)
    expect(r.ok).toBe(false)
  })

  it('fäller svaret om sammanfattningen saknas, eller svaret inte är ett objekt', () => {
    expect(validera({ ...GILTIGT, vad: '' }, indata).ok).toBe(false)
    expect(validera(['x'], indata).ok).toBe(false)
    expect(validera(GILTIGT, { brev: '' }).ok).toBe(false)
  })

  it('stryker en avsändare som inte står i brevet', () => {
    const r = validera({ ...GILTIGT, avsandare: 'Skatteverket' }, indata)
    expect(r.value!.avsandare).toBe('')
  })

  it('tar emot objektform lika bra som positionell', () => {
    const r = validera({ ...GILTIGT, gor: [{ steg: 'Gå till samtalet', citat: 'Du är kallad till ett planeringssamtal' }] }, indata)
    expect(r.value!.gor).toHaveLength(1)
  })
})

describe('AIX24: tomt namn men belagt nummer (mätt i prod 2026-10-30)', () => {
  it('avsändaren står som namn i stället för att numret försvinner', () => {
    const r = RESPONSE_VALIDATORS['myndighetsbrev']({ ...GILTIGT, vem: [['', '010-486 00 00', 'Ring din handläggare Eva Lind på 010-486 00 00']] }, { brev: BREV })
    expect(r.value?.vem).toEqual([{ namn: 'Arbetsförmedlingen', kontakt: '010-486 00 00', citat: 'Ring din handläggare Eva Lind på 010-486 00 00' }])
  })

  it('utan kontaktuppgift kastas en namnlös rad fortfarande', () => {
    const r = RESPONSE_VALIDATORS['myndighetsbrev']({ ...GILTIGT, vem: [['', '', 'Ring din handläggare Eva Lind på 010-486 00 00']] }, { brev: BREV })
    expect(r.value?.vem).toEqual([])
  })
})

describe('AIX29: Gör det mindre — prompten', () => {
  it('finns, bär sanningsregeln och regelverksskyddet i sin egen text', () => {
    const p = PROMPTS['gor-mindre']({ uppgift: 'Jag måste ringa AF' })
    expect(p.system).toMatch(/SANNINGSREGEL/)
    expect(p.system).toMatch(/förslag, inte ett krav/)
    expect(p.system).toMatch(/regler, villkor, öppettider/)
    expect(p.user).toContain('Jag måste ringa AF')
    expect(p.responseKey).toBe('plan')
  })

  it('kapar uppgiften vid 300 tecken', () => {
    const p = PROMPTS['gor-mindre']({ uppgift: `${'a'.repeat(400)}SLUTET` })
    expect(p.user).not.toContain('SLUTET')
  })
})

describe('AIX29: validatorn', () => {
  const validera = RESPONSE_VALIDATORS['gor-mindre']
  const indata = { uppgift: 'Jag måste ringa AF' }

  it('släpper igenom 3–5 steg och kapar vid fem', () => {
    const r = validera({ steg: ['Hitta telefonen', 'Skriv ner frågan', 'Ring numret på brevet', 'Anteckna svaret', 'Ta en paus', 'Sjätte'] }, indata)
    expect(r.ok).toBe(true)
    expect(r.value!.steg).toHaveLength(5)
  })

  it('tar bort steg med ett påhittat telefonnummer, en tid eller ett belopp', () => {
    const r = validera({ steg: ['Hitta telefonen', 'Ring 0771-60 00 00', 'Ring före kl 15', 'Skriv ner frågan', 'Anteckna svaret'] }, indata)
    expect(r.value!.steg).toEqual(['Hitta telefonen', 'Skriv ner frågan', 'Anteckna svaret'])
  })

  it('godtar en siffra som personen själv skrev', () => {
    const r = validera({ steg: ['Hitta numret 020-123 45', 'Ring dem'] }, { uppgift: 'Ring 020-123 45 senast fredag' })
    expect(r.ok).toBe(true)
    expect(r.value!.steg).toHaveLength(2)
  })

  it('tar bort påhittade webbadresser men inte sådana personen angav', () => {
    const r = validera({ steg: ['Öppna www.example.com', 'Hitta telefonen', 'Skriv ner frågan'] }, indata)
    expect(r.value!.steg).toEqual(['Hitta telefonen', 'Skriv ner frågan'])
    const r2 = validera({ steg: ['Öppna www.af.se', 'Hitta telefonen'] }, { uppgift: 'Jag ska besöka www.af.se' })
    expect(r2.value!.steg).toHaveLength(2)
  })

  it('fäller svaret när för få användbara steg finns kvar eller formen är fel', () => {
    expect(validera({ steg: ['Ring 0771-1'] }, indata).ok).toBe(false)
    expect(validera({ steg: [] }, indata).ok).toBe(false)
    expect(validera('text', indata).ok).toBe(false)
    expect(validera({ steg: ['a', 'b'] }, { uppgift: '' }).ok).toBe(false)
  })

  it('kastar tomma och icke-strängar', () => {
    const r = validera({ steg: ['Steg ett', '', 7, null, 'Steg två'] }, indata)
    expect(r.value!.steg).toEqual(['Steg ett', 'Steg två'])
  })
})
