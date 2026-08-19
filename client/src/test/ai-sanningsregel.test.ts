/**
 * Varje AI-prompt som skriver om en människa ska ha en sanningsregel.
 * (AR4 / B25 / B26 / G15, genomgången 2026-08-17)
 *
 * Bakgrunden är inte fyra buggar utan en vana. Samma lucka har hittats en i
 * taget, i fyra granskningar:
 *
 *   C11  `personligt-brev` fick regeln — och bara den.
 *   B25  `ai-cover-letter`-edgen, som reglerna sades vara "portade från",
 *        fick den aldrig. Fabricerade truckkort och ledaransvar.
 *   B26  `profile-summary` saknade den OCH skriver resultatet till
 *        `profiles.ai_summary` — en påhittad persona landade i databasen.
 *   G15  `karriarplan` rekommenderade "en bra kontorsstol" och en Coursera-kurs
 *        till någon utan inkomst, utan ett ord om arbetshjälpmedel via AF.
 *
 * Att hitta den femte instansen i nästa granskning är fel arbetssätt. Testet
 * gör luckan omöjlig att införa tyst: en ny prompt utan regel fäller bygget,
 * och den som tycker att just deras prompt är undantagen måste skriva in den i
 * `UTAN_KRAV` nedan med ett skäl som någon annan kan läsa.
 *
 * Detektorn har redan gett ett falskt utslag: första versionen letade efter
 * "hitta aldrig" och missade `ai-team-chat`, som skriver "hitta inte på eller
 * anta saker". Formuleringarna varierar med flit — de är skrivna för en modell,
 * inte för ett regex — så listan nedan är medvetet bred.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* eslint-disable @typescript-eslint/no-require-imports */
const { PROMPTS } = require('../../api/ai.js') as {
  PROMPTS: Record<string, (d: unknown) => { system?: string }>
}
/* eslint-enable @typescript-eslint/no-require-imports */

/** Sätt att uttrycka "hitta inte på" som förekommer i prompterna i dag. */
const SANNINGSMARKORER = [
  /hitta\s+(?:ALDRIG|aldrig)\s+på/i,
  /hitta\s+inte\s+på/i,
  /hitta\s+heller\s+aldrig\s+på/i,
  /påstå\s+aldrig/i,
  /sanningsregel/i,
  /utelämna\s+det/i,
]

/**
 * Prompter som INTE behöver regeln, var och en med skäl.
 * Att lägga till en rad här ska kosta en motivering — det är hela poängen.
 */
const UTAN_KRAV: Record<string, string> = {
  'sta-week-summary':
    'STA-modulen är avaktiverad sedan 2026-08-03 (MODULES.STA, av som default). ' +
    'Prompten når ingen användare. Slås modulen på ska den här raden bort och ' +
    'regeln skrivas — inte tvärtom.',
  'sta-doa-sammanfattning':
    'Samma skäl som sta-week-summary — avaktiverad modul, prompten når ingen.',
  'sta-document-draft':
    'Samma skäl som sta-week-summary — avaktiverad modul. Den här hittade testet ' +
    'självt vid första körningen, vilket är precis vad den är byggd för: jag hade ' +
    'missat den i min egen genomgång av prompterna.',
}

const funktioner = Object.keys(PROMPTS).filter((n) => n !== 'default')

/**
 * Många prompter är GRENADE — de returnerar olika systemprompt beroende på
 * vad anroparen skickar. `intervju-simulator` är arketypen: utan data ställer
 * den bara en öppningsfråga, men med `anvandarSvar` skriver den 500 tokens
 * fri text om en människas svar och sätter ett betyg på henne.
 *
 * Fram till 2026-08-19 anropade det här testet varje prompt med `{}` — alltså
 * ALLTID den ofarliga grenen. Prompten som bedömer människan låg i `UTAN_KRAV`
 * med motiveringen "påstår ingenting om användaren", och grinden kunde inte
 * se att motiveringens egen utlösare ("skulle den börja sammanfatta svaren")
 * redan var uppfylld.
 *
 * Därför anropas nu varje prompt med ett underlag som är tänkt att träffa den
 * gren som SKRIVER OM PERSONEN, och regeln krävs i varje gren som svarar.
 * Fälten är medvetet många: en prompt som inte känner igen dem faller tillbaka
 * på sin grundgren, vilket bara betyder att den kontrolleras som förut.
 */
const UNDERLAG: Record<string, unknown> = {
  // Fritext om personen
  anvandarSvar: 'Jag har jobbat på lager i två år.',
  meddelande: 'Vad ska jag tänka på?',
  text: 'Jag har jobbat på lager i två år.',
  cvText: 'Anna Andersson, lagerarbetare.',
  // Vanliga formvarianter i biblioteket
  typ: 'about',
  data: { namn: 'Anna' },
  roll: 'Lagerarbetare',
  historik: [{ fraga: 'Berätta om dig', svar: 'Jag har jobbat på lager.' }],
  experience: [{ title: 'Lagerarbetare', company: 'ICA' }],
  cv: { workExperience: [{ title: 'Lagerarbetare', company: 'ICA' }] },
}

/** Alla systemprompter en funktion kan producera — båda grenarna. */
function allaSystemprompter(namn: string): string[] {
  const ut: string[] = []
  for (const underlag of [{}, UNDERLAG]) {
    try {
      const s = PROMPTS[namn](underlag)?.system
      if (typeof s === 'string' && s && !ut.includes(s)) ut.push(s)
    } catch {
      // En prompt som kastar på oväntad form är inte den här grindens sak.
    }
  }
  return ut
}

describe('sanningsregeln finns i varje prompt som beskriver en människa', () => {
  it('promptbiblioteket går att läsa och är inte tomt', () => {
    // Positiv kontroll: utan den här blir alla it.each nedan gröna genom att
    // aldrig köra, om exporten någon gång försvinner.
    expect(funktioner.length).toBeGreaterThan(10)
  })

  it.each(funktioner)('%s', (namn) => {
    const skal = UTAN_KRAV[namn]

    if (skal) {
      // Undantagen får inte bli en glömd skräplåda: skälet måste vara skrivet.
      expect(skal.length, `undantaget för ${namn} saknar motivering`).toBeGreaterThan(40)
      return
    }

    const grenar = allaSystemprompter(namn)
    const utanRegel = grenar.filter((g) => !SANNINGSMARKORER.some((r) => r.test(g)))
    expect(
      utanRegel.map((g) => g.slice(0, 160)),
      `Prompten "${namn}" saknar sanningsregel i ${utanRegel.length} av ` +
        `${grenar.length} grenar. Lägg till en — eller skriv in den i UTAN_KRAV ` +
        `med ett skäl. Se AR4 i docs/ROADMAP.md.`
    ).toEqual([])
  })
})

describe('prompter som rör svenska regelverk hänvisar till rätt myndighet', () => {
  // B22 visade vad som händer annars: chatboten hittade på a-kassevillkor
  // ("minst 4 jobb per vecka") och aktivitetsstöd ("78 % av prisbasbeloppet") —
  // fel på båda punkter, till någon som fattar beslut om sin försörjning.
  const RADGIVANDE = ['chatbot', 'ai-team-chat', 'karriarplan', 'adaptation-recommendations']

  it.each(RADGIVANDE)('%s nämner Arbetsförmedlingen som källa', (namn) => {
    const system = PROMPTS[namn]({})?.system ?? ''
    expect(system).toMatch(/Arbetsförmedlingen/)
  })

  it.each(['chatbot', 'ai-team-chat', 'karriarplan'])(
    '%s förbjuder påhittade belopp och villkor',
    (namn) => {
      const system = PROMPTS[namn]({})?.system ?? ''
      expect(system).toMatch(/belopp|procentsats|kvalificeringsvillkor|siffror som är regler/i)
    }
  )
})

describe('edge-vägen har samma regel som Vercel-vägen', () => {
  // B25: `ai-cover-letter` är callerlös men deployad och nåbar via HTTP. Den
  // fick aldrig C11:s regel, trots att kommentaren i ai.js säger att reglerna
  // "portades från ai-cover-letter-edgen" — allt utom källan fick fixen.
  it('ai-cover-letter förbjuder påhittade meriter', () => {
    const kalla = readFileSync(
      resolve(__dirname, '../../../supabase/functions/ai-cover-letter/index.ts'),
      'utf8'
    )
    expect(kalla).toMatch(/Hitta ALDRIG på erfarenheter/)
    expect(kalla).toMatch(/utelämna det helt/)
  })
})

describe('G15: karriärplanen känner till svenska stödsystem', () => {
  // Den skarpa körningen för en person med tre års arbetslöshet och ryggbesvär
  // rekommenderade "en bra kontorsstol" och en onlinekurs på Coursera —
  // ingenting om arbetshjälpmedel via AF, som betalar stolen.
  it.each(['arbetshjälpmedel', 'Lönebidrag', 'Arbetsträning', 'Komvux'])(
    'nämner %s',
    (begrepp) => {
      const system = PROMPTS['karriarplan']({})?.system ?? ''
      expect(system).toMatch(new RegExp(begrepp, 'i'))
    }
  )

  it('förbjuder påhittade belopp — regler ändras och personen fattar beslut på dem', () => {
    const system = PROMPTS['karriarplan']({})?.system ?? ''
    expect(system).toMatch(/aldrig på siffror som är regler/i)
  })
})
