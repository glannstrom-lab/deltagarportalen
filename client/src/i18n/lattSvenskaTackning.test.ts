/**
 * Grind: hur mycket av deltagarens huvudväg som finns på Lätt svenska (RD30).
 *
 * Varför: rollspelet 2026-09-27 (RD5) fann att Lätt svenska i praktiken bara
 * gällde Min vecka. Översikt, Min konsulent, CV och Hjälp var vanlig svenska
 * med ord som "ATS (Applicant Tracking System)" och "Schweiziskt inspirerad
 * design". Ingenting mätte det — överlägget faller tyst tillbaka på sv.json,
 * så en saknad nyckel syns aldrig som ett fel.
 *
 * Grinden räknar, per namnrymd på huvudvägen, hur stor andel av sv.json:s
 * nycklar som har en motsvarighet i sv-latt.json. Andelen får inte sjunka under
 * GOLVET. Lägger någon till en ny nyckel på huvudvägen utan Lätt svenska sjunker
 * andelen — och grinden säger vilken nyckel.
 *
 * Höj GOLV när täckningen går upp. Sänk det aldrig för att få grönt.
 */
import { describe, it, expect } from 'vitest'
import sv from './locales/sv.json'
import latt from './locales/sv-latt.json'

type Trad = { [k: string]: unknown }

function platta(o: Trad, prefix = '', ut: Record<string, unknown> = {}): Record<string, unknown> {
  for (const [k, v] of Object.entries(o)) {
    if (k === '_kommentar') continue
    const stig = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) platta(v as Trad, stig, ut)
    else ut[stig] = v
  }
  return ut
}

/**
 * Deltagarens huvudväg (RD5/RD30): Översikt, Min vecka (inkl. frånvaroanmälan
 * och kalendern), samtyckesfrågan om konsulenten, Min konsulent, CV-byggarens
 * steg, Profilens första flik, Hjälp och Krisstöd. Profilens övriga flikar
 * (jobbsök, stöd, dokument, delning, historik) är inte med än.
 */
export const HUVUDVAGEN: Record<string, string[]> = {
  'Översikt': ['hubOverview.'],
  'Min vecka': ['minVecka.'],
  'Samtycke konsulent': ['consultantConsent.'],
  'Min konsulent': ['myConsultant.'],
  'CV-byggaren': ['cvBuilder.', 'cv.saveIndicator.'],
  'Profil': [
    'profile.header.', 'profile.tabs.', 'profile.overview.', 'profile.onboarding.',
    'profile.completion.', 'profile.completionGuide.', 'profile.messages.',
  ],
  'Hjälp': ['helpPage.', 'help.'],
  'Krisstöd': ['crisis.'],
}

/**
 * Andel (0–100) av nycklarna under huvudvägen som har Lätt svenska.
 * Mätt 2026-09-27: före 123/697, efter 744/744. 235 av dem står ordagrant som
 * svenskan — korta etiketter ("Förnamn", "Nästa") som redan var lätta och
 * lästes igenom en och en; att de finns i överlägget är beslutet att de duger.
 */
const GOLV = 100

export function tackning(fsv: Record<string, unknown>, flatt: Record<string, unknown>, prefix: string[]) {
  const nycklar = Object.keys(fsv).filter((k) => prefix.some((p) => k.startsWith(p)))
  const saknas = nycklar.filter((k) => !(k in flatt))
  return { totalt: nycklar.length, tackta: nycklar.length - saknas.length, saknas }
}

const FSV = platta(sv as unknown as Trad)
const FLATT = platta(latt as unknown as Trad)

describe('Lätt svenska täcker deltagarens huvudväg (RD30)', () => {
  const alla = Object.values(HUVUDVAGEN).flat()
  const totalt = tackning(FSV, FLATT, alla)
  const andel = (totalt.tackta / totalt.totalt) * 100

  it(`minst ${GOLV} % av huvudvägens nycklar har Lätt svenska`, () => {
    const perSida = Object.entries(HUVUDVAGEN)
      .map(([sida, p]) => {
        const r = tackning(FSV, FLATT, p)
        return `${sida}: ${r.tackta}/${r.totalt}`
      })
      .join('\n')
    expect(
      andel,
      `Täckning ${totalt.tackta}/${totalt.totalt} (${andel.toFixed(1)} %).\n${perSida}\nSaknas: ${totalt.saknas.slice(0, 20).join(', ')}`,
    ).toBeGreaterThanOrEqual(GOLV)
  })

  it('varje sida på huvudvägen har nycklar att mäta (grinden är inte tom)', () => {
    for (const [sida, p] of Object.entries(HUVUDVAGEN)) {
      expect(tackning(FSV, FLATT, p).totalt, sida).toBeGreaterThan(0)
    }
  })

  it('en löv-nyckel i sv-latt.json är ett löv också i sv.json, och tvärtom', () => {
    // 2026-09-27: `minVecka.tomVecka` var en sträng i sv-latt.json men ett objekt
    // ({framtid, ledig}) i sv.json. Överlägget skrev över objektet med en sträng,
    // så båda texterna försvann på Lätt svenska — och lattSvenska.test.ts såg det
    // inte, eftersom den bara frågar om stigen finns.
    const fel = Object.keys(FLATT).filter((k) => !(k in FSV))
    expect(fel, `Finns i sv-latt men inte som löv i sv: ${fel.join(', ')}`).toEqual([])
  })
})

// NY2 2026-09-29: Ny i Sverige fick Lätt svenska (0 → 134 av 179). Resten är med flit
// kvar på vanlig svenska: namn på nivåer och resurser, och de tio fraserna, som är
// svenskträning och inte ska förenklas. Egen golvsiffra eftersom huvudvägens golv är 100 %.
const NY_I_SVERIGE_GOLV = 134

describe('Lätt svenska på Ny i Sverige (NY2)', () => {
  it(`minst ${NY_I_SVERIGE_GOLV} av international.*-nycklarna har Lätt svenska`, () => {
    const r = tackning(FSV, FLATT, ['international.'])
    expect(r.tackta, `${r.tackta}/${r.totalt}`).toBeGreaterThanOrEqual(NY_I_SVERIGE_GOLV)
  })
})

// Ett test som inte kan falla bevisar ingenting.
describe('grinden kan faktiskt falla', () => {
  it('ser en saknad nyckel', () => {
    const r = tackning({ 'a.x': 'Hej', 'a.y': 'Då', 'b.z': 'Annat' }, { 'a.x': 'Hej' }, ['a.'])
    expect(r).toEqual({ totalt: 2, tackta: 1, saknas: ['a.y'] })
  })

  it('räknar bara nycklar under prefixet', () => {
    expect(tackning({ 'a.x': '1', 'ab.y': '2' }, {}, ['a.']).totalt).toBe(1)
  })
})
