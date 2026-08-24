/**
 * Vakt över ENGELSKANS paritet med svenskan.
 *
 * Varför den behövs: vid genomgången 2026-08-24 var `en.json` strukturellt i
 * mycket gott skick — 8 550 nycklar, exakt samma uppsättning som svenskan,
 * noll avvikelser i `{{variabler}}`. Ingenting vaktade det. Pariteten var
 * disciplin, inte mekanik, och disciplin faller tyst: en ny nyckel som bara
 * läggs i `sv.json` ger ingen krasch och inget typfel — i18next faller
 * tillbaka på svenska, och den engelska användaren ser svensk text mitt i
 * gränssnittet utan att något larmar.
 *
 * Samma genomgång hittade också ett mönster som INTE var strukturellt:
 * svenska myndighetsnamn översattes bort i 53 strängar. "Arbetsförmedlingen"
 * blev "the Employment Agency", "Migrationsverket" blev "the Migration
 * Agency", "a-kassa" blev "an unemployment insurance fund". Det är värst
 * exakt där det gör mest skada — i `international.*`, som läses av nyanlända
 * som ska hitta rätt myndighet. Ett generiskt engelskt namn går inte att
 * googla, står inte på skylten och finns inte på blanketten.
 *
 * De tre kontrollerna nedan är därför: samma nycklar, samma variabler, och
 * myndighetsnamnen kvar på svenska.
 */
import { describe, it, expect } from 'vitest'
import sv from './locales/sv.json'
import en from './locales/en.json'

type Trad = { [k: string]: string | string[] | Trad }

/** Plattar ut till `a.b.c` → värde. */
function platta(o: Trad, prefix = '', ut: Record<string, unknown> = {}): Record<string, unknown> {
  for (const k of Object.keys(o)) {
    const v = (o as Record<string, unknown>)[k]
    const sokvag = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) platta(v as Trad, sokvag, ut)
    else ut[sokvag] = v
  }
  return ut
}

const FSV = platta(sv as unknown as Trad)
const FEN = platta(en as unknown as Trad)

/** `{{namn}}`-platshållarna i en sträng, normaliserade och sorterade. */
function variabler(v: unknown): string {
  if (typeof v !== 'string') return ''
  return (v.match(/\{\{[^}]+\}\}/g) ?? []).map(s => s.replace(/\s/g, '')).sort().join(',')
}

describe('en.json har samma nycklar som sv.json', () => {
  it('ingen svensk nyckel saknas i engelskan', () => {
    const saknas = Object.keys(FSV).filter(k => !(k in FEN))
    expect(saknas, `Saknas i en.json: ${saknas.slice(0, 20).join(', ')}`).toEqual([])
  })

  it('engelskan har inga nycklar som svenskan saknar', () => {
    const overblivna = Object.keys(FEN).filter(k => !(k in FSV))
    expect(overblivna, `Finns bara i en.json: ${overblivna.slice(0, 20).join(', ')}`).toEqual([])
  })

  it('samma nyckel har samma typ i båda filerna', () => {
    const avvikande = Object.keys(FSV).filter(
      k => typeof FSV[k] !== typeof FEN[k] || Array.isArray(FSV[k]) !== Array.isArray(FEN[k])
    )
    expect(avvikande, `Typskillnad: ${avvikande.slice(0, 20).join(', ')}`).toEqual([])
  })

  it('inget engelskt värde är tomt där svenskan har text', () => {
    const tomma = Object.keys(FSV).filter(
      k => typeof FSV[k] === 'string' && String(FSV[k]).trim() !== ''
        && typeof FEN[k] === 'string' && String(FEN[k]).trim() === ''
    )
    expect(tomma, `Tomma engelska värden: ${tomma.slice(0, 20).join(', ')}`).toEqual([])
  })
})

describe('interpolationen är identisk mellan språken', () => {
  it('varje nyckel har samma {{variabler}} i sv och en', () => {
    const avvikande = Object.keys(FSV)
      .filter(k => k in FEN && variabler(FSV[k]) !== variabler(FEN[k]))
      .map(k => `${k} (sv: ${variabler(FSV[k]) || '—'} / en: ${variabler(FEN[k]) || '—'})`)
    // En variabel som tappas bort renderas som tom sträng; en som hittas på
    // renderas rått som `{{count}}` i gränssnittet. Båda är produktionsbuggar.
    expect(avvikande, `Variabelavvikelser:\n${avvikande.slice(0, 20).join('\n')}`).toEqual([])
  })
})

/**
 * Svenska namn som ALDRIG ska översättas bort i engelskan.
 *
 * Regeln är inte språkpurism utan användbarhet: den engelskspråkiga läsaren
 * är oftast nyanländ och ska kunna känna igen namnet ute i verkligheten.
 * En förklaring inom parentes är däremot bra och tillåten —
 * "Arbetsförmedlingen (the Swedish Public Employment Service)" passerar,
 * eftersom kontrollen bara kräver att det svenska namnet FINNS kvar.
 */
const SKYDDADE_NAMN = [
  'Arbetsförmedlingen',
  'Försäkringskassan',
  'Migrationsverket',
  'Skatteverket',
  'Bolagsverket',
  'Integritetsskyddsmyndigheten',
  'a-kassa',
  'CSN',
  'personnummer',
  'samordningsnummer',
  'BankID',
  'komvux',
  'yrkeshögskola',
  'folkbokföring',
  'Jourhavande medmänniska',
] as const

/** Nycklar där termen medvetet inte följer med till engelskan. */
const UNDANTAG = new Set<string>([])

export function hittaTapptaNamn(
  fsv: Record<string, unknown>,
  fen: Record<string, unknown>
): string[] {
  const brott: string[] = []
  for (const k of Object.keys(fsv)) {
    const s = fsv[k], e = fen[k]
    if (typeof s !== 'string' || typeof e !== 'string') continue
    if (UNDANTAG.has(k)) continue
    for (const namn of SKYDDADE_NAMN) {
      // Skiftlägesokänsligt: svenskan böjer och versaliserar olika
      // ("A-kassa" i rubrik, "a-kassan" i löptext).
      if (s.toLowerCase().includes(namn.toLowerCase()) && !e.toLowerCase().includes(namn.toLowerCase())) {
        brott.push(`${k} — "${namn}" finns i svenskan men inte i engelskan`)
        break
      }
    }
  }
  return brott
}

describe('svenska myndighets- och begreppsnamn står kvar i engelskan', () => {
  it('inget skyddat namn har översatts bort', () => {
    const brott = hittaTapptaNamn(FSV, FEN)
    expect(
      brott,
      `Skyddade namn som tappats i engelskan (${brott.length} st):\n${brott.slice(0, 30).join('\n')}`
    ).toEqual([])
  })
})

// Ett test som inte kan falla bevisar ingenting (lärdomen 2026-08-09).
describe('kontrollerna kan faktiskt falla', () => {
  it('variabelkontrollen ser en tappad variabel', () => {
    expect(variabler('Hej {{namn}}')).not.toEqual(variabler('Hello'))
  })

  it('variabelkontrollen bryr sig inte om ordningen', () => {
    expect(variabler('{{b}} och {{a}}')).toEqual(variabler('{{a}} and {{b}}'))
  })

  it('namnkontrollen ser ett bortöversatt myndighetsnamn', () => {
    const brott = hittaTapptaNamn(
      { x: 'Kontakta Arbetsförmedlingen i dag.' },
      { x: 'Contact the Employment Agency today.' }
    )
    expect(brott).toHaveLength(1)
  })

  it('namnkontrollen godtar en förklaring inom parentes', () => {
    const brott = hittaTapptaNamn(
      { x: 'Kontakta Arbetsförmedlingen.' },
      { x: 'Contact Arbetsförmedlingen (the Swedish Public Employment Service).' }
    )
    expect(brott).toEqual([])
  })

  it('namnkontrollen godtar böjning och versalisering', () => {
    const brott = hittaTapptaNamn({ x: 'Din a-kassa' }, { x: 'Your A-kassa' })
    expect(brott).toEqual([])
  })
})
