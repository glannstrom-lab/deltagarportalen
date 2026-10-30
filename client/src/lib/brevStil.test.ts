/**
 * KF13 — beteenden som kan falla:
 *   1. harleda: bara katalogtexter, högst fem, inget vid samma text/för litet underlag.
 *   2. Hälsoord kommer aldrig in (tolkaBrevStil, rensaPreferens, slaIhop).
 *   3. Flaggan av eller funktionen av: inget skickas, inget skrivs.
 *   4. Läsfel: ingenting skrivs (en tom läsning får inte skriva över sparade rader).
 *   5. slaIhop: aldrig fler än fem; deltagarens ändrade rad skrivs inte över.
 * Mutationer: släpp in hälsoord i rensaPreferens -> 2 faller; skicka prefs när pa=false
 * -> 3 faller; ta bort `if (error) throw error` i hamtaBrevStil -> 4 faller;
 * ta bort slice/MAX i slaIhop -> 5 faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const stat = vi.hoisted(() => ({
  las: { data: null as unknown, error: null as unknown },
  upserts: [] as unknown[],
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => stat.las }) }),
      upsert: async (rad: unknown) => {
        stat.upserts.push(rad)
        return { error: null }
      },
    }),
  },
}))

import {
  harleda, hamtaBrevStil, slaIhop, tolkaBrevStil, rensaPreferens, stilForAnrop, laraAvAndringar,
  MAX_PREFERENSER, type Preferens,
} from './brevStil'

const UTKAST = [
  'Hej! Jag söker tjänsten som lagerarbetare hos er och jag tror att man behöver vara noggrann i det arbetet, vilket jag har stor erfarenhet av sedan flera år tillbaka i olika sammanhang.',
  'Jag ser fram emot att höra från er! Det vore spännande att få berätta mer om hur jag arbetar och vad jag kan bidra med i ert team under de kommande åren, om det passar er verksamhet.',
  '',
  'Med stor entusiasm och engagemang hoppas jag få möjlighet till ett möte där vi kan prata vidare om tjänsten och om vad ni söker hos en ny kollega just nu!',
].join('\n')

const SPARAD = [
  'Jag söker tjänsten som lagerarbetare hos er. Jag är noggrann.',
  'Jag vill gärna berätta mer.',
  '',
  'Jag hoppas få komma på ett möte.',
].join('\n')

beforeEach(() => {
  stat.las = { data: null, error: null }
  stat.upserts = []
})

describe('harleda', () => {
  it('ger stilförslag ur katalogen och bär ingen text ur brevet', () => {
    const f = harleda(UTKAST, SPARAD)
    const ids = f.map((x) => x.id)
    expect(ids).toEqual(expect.arrayContaining(['utrop', 'jag', 'meningar', 'langd']))
    expect(f.length).toBeLessThanOrEqual(MAX_PREFERENSER)
    for (const x of f) {
      expect(x.text).not.toMatch(/lagerarbetare|noggrann|entusiasm/i)
    }
  })

  it('samma text, tom text eller för litet underlag ger inget', () => {
    expect(harleda(UTKAST, UTKAST)).toEqual([])
    expect(harleda('', SPARAD)).toEqual([])
    expect(harleda('Hej! Kort.', 'Hej.')).toEqual([])
  })

  it('utropstecken: bara om alla försvann', () => {
    const u = UTKAST
    expect(harleda(u, u.replace(/!/g, '.')).some((x) => x.id === 'utrop')).toBe(true)
    expect(harleda(u, u.replace('Hej!', 'Hej.')).some((x) => x.id === 'utrop')).toBe(false)
  })
})

describe('hälsoord', () => {
  it('rensaPreferens stryker hälsa, tomt och icke-text; kortar till 100 tecken', () => {
    expect(rensaPreferens('Jag har ångest och vill skriva kort')).toBeNull()
    expect(rensaPreferens('Nämn min diagnos')).toBeNull()
    expect(rensaPreferens('   ')).toBeNull()
    expect(rensaPreferens(42)).toBeNull()
    expect(rensaPreferens('a'.repeat(300))).toHaveLength(100)
  })

  it('tolkaBrevStil släpper inte in hälsoord eller fler än fem, och är av som standard', () => {
    expect(tolkaBrevStil(null)).toEqual({ pa: false, prefs: [] })
    expect(tolkaBrevStil('x')).toEqual({ pa: false, prefs: [] })
    const s = tolkaBrevStil({
      pa: true,
      prefs: [
        { id: 'a', text: 'Skriv kort.', at: '' },
        { id: 'b', text: 'Jag mår dåligt, ta hänsyn', at: '' },
        ...['c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id, text: `Rad ${id}`, at: '' })),
      ],
    })
    expect(s.prefs.map((p) => p.id)).toEqual(['a', 'c', 'd', 'e', 'f'])
    expect(tolkaBrevStil({ pa: 'ja', prefs: [] }).pa).toBe(false)
  })
})

describe('slaIhop', () => {
  const rad = (id: string, at: string, text = `Rad ${id}`): Preferens => ({ id, text, at })

  it('aldrig fler än fem; den äldsta går först', () => {
    const bef = ['a', 'b', 'c', 'd', 'e'].map((id, i) => rad(id, `2026-10-0${i + 1}`))
    const ut = slaIhop(bef, [{ id: 'f', text: 'Ny rad.' }], new Date('2026-10-30'))
    expect(ut).toHaveLength(5)
    expect(ut.map((p) => p.id)).toEqual(['b', 'c', 'd', 'e', 'f'])
  })

  it('en rad deltagaren ändrat skrivs inte över av samma id', () => {
    const ut = slaIhop([rad('utrop', '2026-10-01', 'Gärna ett utropstecken.')], [{ id: 'utrop', text: 'Använd inte utropstecken.' }])
    expect(ut).toHaveLength(1)
    expect(ut[0].text).toBe('Gärna ett utropstecken.')
  })

  it('hälsa i ett förslag läggs inte till', () => {
    expect(slaIhop([], [{ id: 'x', text: 'Ta hänsyn till min diagnos.' }])).toEqual([])
  })
})

describe('hamtaBrevStil', () => {
  it('läsfel kastar: ett fel är inte "inga preferenser"', async () => {
    stat.las = { data: null, error: new Error('nät') }
    await expect(hamtaBrevStil('u1')).rejects.toThrow('nät')
  })

  it('ingen rad ger av och tomt', async () => {
    expect(await hamtaBrevStil('u1')).toEqual({ pa: false, prefs: [] })
  })
})

describe('stilForAnrop', () => {
  it('flaggan av: kontot rörs inte och inget skickas', async () => {
    stat.las = { data: { brev_stil: { pa: true, prefs: [{ id: 'a', text: 'Skriv kort.', at: '' }] } }, error: null }
    expect(await stilForAnrop('u1', false)).toEqual([])
  })

  it('funktionen av (standard): inget skickas även om rader finns', async () => {
    stat.las = { data: { brev_stil: { pa: false, prefs: [{ id: 'a', text: 'Skriv kort.', at: '' }] } }, error: null }
    expect(await stilForAnrop('u1', true)).toEqual([])
  })

  it('på: raderna skickas', async () => {
    stat.las = { data: { brev_stil: { pa: true, prefs: [{ id: 'a', text: 'Skriv kort.', at: '' }] } }, error: null }
    expect(await stilForAnrop('u1', true)).toEqual(['Skriv kort.'])
  })

  it('läsfel: inget skickas', async () => {
    stat.las = { data: null, error: new Error('nät') }
    expect(await stilForAnrop('u1', true)).toEqual([])
  })
})

describe('laraAvAndringar', () => {
  it('flaggan av: ingenting skrivs', async () => {
    await laraAvAndringar('u1', UTKAST, SPARAD, false)
    expect(stat.upserts).toEqual([])
  })

  it('funktionen av: ingenting skrivs', async () => {
    stat.las = { data: { brev_stil: { pa: false, prefs: [] } }, error: null }
    await laraAvAndringar('u1', UTKAST, SPARAD, true)
    expect(stat.upserts).toEqual([])
  })

  it('läsfel skriver ingenting (en tom läsning får inte skriva över sparade rader)', async () => {
    stat.las = { data: null, error: new Error('nät') }
    await laraAvAndringar('u1', UTKAST, SPARAD, true)
    expect(stat.upserts).toEqual([])
  })

  it('på: sparar högst fem rader och behåller pa', async () => {
    stat.las = { data: { brev_stil: { pa: true, prefs: [] } }, error: null }
    await laraAvAndringar('u1', UTKAST, SPARAD, true)
    expect(stat.upserts).toHaveLength(1)
    const rad = stat.upserts[0] as { user_id: string; brev_stil: { pa: boolean; prefs: Preferens[] } }
    expect(rad.user_id).toBe('u1')
    expect(rad.brev_stil.pa).toBe(true)
    expect(rad.brev_stil.prefs.length).toBeGreaterThan(0)
    expect(rad.brev_stil.prefs.length).toBeLessThanOrEqual(MAX_PREFERENSER)
  })

  it('oförändrad text skriver ingenting', async () => {
    stat.las = { data: { brev_stil: { pa: true, prefs: [] } }, error: null }
    await laraAvAndringar('u1', UTKAST, UTKAST, true)
    expect(stat.upserts).toEqual([])
  })
})
