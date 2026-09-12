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
import { readFileSync, readdirSync, existsSync } from 'node:fs'
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
  // SA2 (2026-09-02): engelska grenar (adaptation-recommendations/
  // -conversation med language: 'en') hade tidigare ingenting att matcha —
  // den delade konstanten (SANNINGSREGEL i ai.js) bär numera båda språken.
  /never\s+invent/i,
  /truth\s+rule/i,
]

/**
 * Prompter som INTE behöver regeln, var och en med skäl.
 * Att lägga till en rad här ska kosta en motivering — det är hela poängen.
 */
const UTAN_KRAV: Record<string, string> = {
  'sta-week-summary':
    'STA upphörde som projekt 2026-09-12 (archive/2026-09-sta/); klientanroparen ' +
    'staAiApi.ts är arkiverad, prompten når ingen användare. Promptarna i ' +
    'api/_prompts/sta.js är kvar tills de tas bort i ett eget pass.',
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

/**
 * AI-teamets fem agenter.
 *
 * Grinden prövade fram till 2026-08-23 bara `ai-team-chat` UTAN `agentTyp`,
 * och då faller funktionen tillbaka på `arbetskonsulent` — den enda agent som
 * redan hade regelverksregeln. De fyra som saknade den kontrollerades alltså
 * aldrig, och grinden var grön hela tiden. Ett test som inte kan falla är
 * värdelöst; det här är samma fälla som testfilens egen kommentar ovan varnar
 * för, en våning ned.
 *
 * Fälten är inerta för alla andra prompter, som ignorerar okända nycklar.
 */
const AGENTTYPER = [
  'arbetskonsulent',
  'arbetsterapeut',
  'studievagledare',
  'motivationscoach',
  'digitalcoach',
]

/**
 * SA2 (2026-09-02): `adaptation-recommendations` och `adaptation-conversation`
 * grenar på `data.language === 'en'`, och fram till den här ändringen provade
 * grinden ALDRIG den grenen — `underlagsvarianter` satte aldrig `language`,
 * så `allaSystemprompter` såg bara den svenska systemprompten. Exakt samma
 * fälla som testfilens egen kommentar ovan varnar för (arketypen
 * `intervju-simulator`, fast på språk i stället för på agentTyp): en gren som
 * aldrig anropas kan inte falla, och grinden var grön av fel skäl.
 */
const SPRAKVARIANTER = [undefined, 'en'] as const

/** Alla systemprompter en funktion kan producera — alla grenar, alla språk. */
function allaSystemprompter(namn: string): string[] {
  const ut: string[] = []
  const underlagsvarianter = [
    {},
    UNDERLAG,
    ...AGENTTYPER.map((agentTyp) => ({ ...UNDERLAG, agentTyp })),
    ...SPRAKVARIANTER.map((language) => ({ ...UNDERLAG, language })),
  ]
  for (const underlag of underlagsvarianter) {
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
  // A27 (2026-09-01): `ai-cover-letter` var callerlös men deployad och nåbar via
  // HTTP — förbi AI-brytaren, PII-saneringen, art. 9-grinden och tokentaket. Den
  // och tre systrar är avpublicerade ur prod och flyttade till
  // `archive/2026-09-01-avpublicerade-edge/`.
  //
  // Flytten är det som gör avpubliceringen varaktig: `deploy.yml:71` kör
  // `supabase functions deploy` UTAN argument, alltså allt som ligger lokalt.
  // Läggs en katalog tillbaka utan grind deployas den vid nästa push.
  const AVPUBLICERADE = ['ai-assistant', 'ai-cover-letter', 'ai-cv-writing', 'cv-analysis']

  it.each(AVPUBLICERADE)(
    '%s ligger inte kvar i supabase/functions (den katalogen ÄR deploy-mängden)',
    (slug) => {
      expect(existsSync(resolve(__dirname, `../../../supabase/functions/${slug}`))).toBe(false)
    }
  )

  // Regeln får inte tappas bort i arkivet heller — kommer funktionen tillbaka ska
  // den komma tillbaka korrekt. (Kommentaren i ai.js påstår att C11:s regler
  // "portades från ai-cover-letter-edgen"; sanningen var att källan aldrig fick dem.)
  it('den arkiverade ai-cover-letter bär förbudet mot påhittade meriter', () => {
    const kalla = readFileSync(
      resolve(__dirname, '../../../archive/2026-09-01-avpublicerade-edge/ai-cover-letter/index.ts'),
      'utf8'
    )
    expect(kalla).toMatch(/Hitta ALDRIG på erfarenheter/)
    expect(kalla).toMatch(/utelämna det helt/)
  })

  // 2026-08-20: lönekompassen på /salary. Prompten bad om exakta kronbelopp i
  // en JSON-mall utan ett ord om att inte hitta på, och fick dessutom in
  // kalkylatorns egen uppskattning märkt "NUVARANDE LÖN" — ett tal personen
  // aldrig angett. Modellen är `perplexity/sonar`, som söker på webben.
  it('ai-career-assistant förbjuder påhittade lönesiffror och påståenden om personen', () => {
    const kalla = readFileSync(
      resolve(__dirname, '../../../supabase/functions/ai-career-assistant/index.ts'),
      'utf8'
    )
    expect(kalla).toMatch(/Hitta ALDRIG på lönesiffror/)
    expect(kalla).toMatch(/Påstå aldrig något om personen/)
    // Fältet får inte smyga tillbaka: det var kalkylatorns gissning, inte
    // användarens uppgift.
    expect(kalla).not.toMatch(/NUVARANDE LÖN/)
  })

  // Art. 21: AI-brytaren ska gälla även den här vägen, inte bara i UI:t.
  it('ai-career-assistant kontrollerar användarens AI-brytare', () => {
    const kalla = readFileSync(
      resolve(__dirname, '../../../supabase/functions/ai-career-assistant/index.ts'),
      'utf8'
    )
    expect(kalla).toMatch(/checkAiEnabled/)
    expect(kalla).toMatch(/createGateDenialResponse/)
  })
})

/**
 * JD1 (2026-08-21): grinden härleder sin egen lista.
 *
 * `_shared/aiGate.ts` byggdes 2026-08-19 för `ai-company-search` och
 * `ai-company-analysis`, fick `ai-career-assistant` 2026-08-20 — och stannade
 * där. `ai-commute-planner` och `ai-industry-radar` kör samma modell och hade
 * ingen grind alls: ett konto med `ai_enabled = false` fick sin HEMADRESS
 * skickad till Perplexity ändå.
 *
 * Testet ovanför är skrivet per funktion, och det är precis varför de två
 * kunde bli kvar — en handskriven lista glider isär från verkligheten. Samma
 * lärdom som A20, där `export_user_data()` räknade upp tabeller för hand och
 * missade den som faktiskt hade rader. Den här grinden RÄKNAR UPP filerna
 * själv: varje edge-funktion som nämner `perplexity/sonar` måste bära
 * grinden. En sjätte anropare kan alltså inte glömmas bort — den fäller
 * bygget den dag den skrivs.
 *
 * Motsvarande kontroll av att listan inte KRYMPER tyst: `MINSTA_ANTAL` nedan.
 * Försvinner en funktion ur svepet — filen omdöpt, modellsträngen ändrad,
 * katalogen flyttad — vill vi veta det, inte tro att allt är grönt för att
 * noll filer kontrollerades.
 */
describe('JD1: varje modellanropande edge-funktion bär AI-brytaren och tokentaket', () => {
  const FUNKTIONSKATALOG = resolve(__dirname, '../../../supabase/functions')

  /**
   * BREDDAD 2026-09-06 (SK4). Filtret var `/perplexity\/sonar/` och missade
   * därför `learning-analyze-gap`, som kör `openai/gpt-oss-120b` och saknade
   * grinden helt. Fixen gick att lägga in utan att ett enda test blev rött —
   * en grind som inte kan falla för det den ska vakta är ingen grind.
   *
   * Kriteriet är nu det som faktiskt betyder något: **anropar funktionen en
   * modell?** Listan härleds ur källkoden, aldrig handskriven.
   */
  const modellFunktioner = readdirSync(FUNKTIONSKATALOG, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => ({ namn: d.name, sokvag: resolve(FUNKTIONSKATALOG, d.name, 'index.ts') }))
    .filter((f) => existsSync(f.sokvag))
    .filter((f) => /openrouter\.ai\/api|chat\/completions/.test(readFileSync(f.sokvag, 'utf8')))

  /**
   * PX1 (2026-09-12): sökfunktionerna bär inte längre strängen `perplexity/sonar`
   * själva — de går genom `valjModell()` i `_shared/aiGate.ts`, som väljer sonar
   * bara för fria konton. Kriteriet är därför anropet, inte literalen.
   */
  const perplexityFunktioner = modellFunktioner.filter((f) =>
    /await\s+valjModell\s*\(/.test(readFileSync(f.sokvag, 'utf8'))
  )

  /**
   * Golv, inte facit: fem modellanropare (de fem `ai-*`) sedan 2026-09-12, då
   * `learning-analyze-gap` arkiverades med EU-spåret (archive/2026-09-eu-utlysning/).
   * Mätt 2026-09-06 var golvet sex. Lägger någon till en sjätte ska `it.each`
   * nedan täcka den utan att de här raderna rörs.
   */
  const MINSTA_MODELLANROPARE = 5
  const MINSTA_PERPLEXITY = 5

  it(`hittar minst ${MINSTA_MODELLANROPARE} funktioner som anropar en modell`, () => {
    expect(modellFunktioner.length).toBeGreaterThanOrEqual(MINSTA_MODELLANROPARE)
  })

  it(`varav minst ${MINSTA_PERPLEXITY} väljer sökmodell via valjModell()`, () => {
    expect(perplexityFunktioner.length).toBeGreaterThanOrEqual(MINSTA_PERPLEXITY)
  })

  it.each(modellFunktioner.map((f) => [f.namn, f.sokvag]))(
    '%s kontrollerar ai_enabled och dygnets tokentak',
    (_namn, sokvag) => {
      const kalla = readFileSync(sokvag, 'utf8')
      // Importen räcker inte — den kan ligga oanvänd. Kräv anropet.
      expect(kalla).toMatch(/await\s+checkAiEnabled\s*\(/)
      expect(kalla).toMatch(/createGateDenialResponse/)
      expect(kalla).toMatch(/await\s+checkDailyTokenCap\s*\(/)
      expect(kalla).toMatch(/createTokenCapResponse/)
    }
  )

  /**
   * Var i filen modellen faktiskt NÅS, inte var fetch-anropet står skrivet.
   * `learning-analyze-gap` har sin fetch i en hjälpfunktion som DEFINIERAS på
   * rad 75 men ANROPAS på rad 343, efter grinden. En rak positionsjämförelse
   * mot fetch-raden hade gjort testet falskt rött.
   */
  function modellAnropsPunkt(kalla: string, serveIdx: number): number {
    const direkt = kalla.indexOf('OPENROUTER_API_URL,', serveIdx)
    if (direkt > -1) return direkt
    const fetchIdx = kalla.indexOf('OPENROUTER_API_URL,')
    if (fetchIdx === -1) return -1
    const hjalpare = [
      ...kalla.slice(0, fetchIdx).matchAll(/(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g),
    ].pop()
    if (!hjalpare) return -1
    return kalla.indexOf(`${hjalpare[1]}(`, serveIdx)
  }

  it.each(modellFunktioner.map((f) => [f.namn, f.sokvag]))(
    '%s grindar FÖRE att modellen nås',
    (_namn, sokvag) => {
      const kalla = readFileSync(sokvag, 'utf8')
      const serveIdx = kalla.search(/(?:Deno\.)?serve\s*\(/)
      const grind = kalla.indexOf('await checkAiEnabled')
      const anrop = modellAnropsPunkt(kalla, serveIdx)
      // En grind som körs efter att uppgifterna redan skickats är dekoration —
      // exakt felet i A29, där `send-invite-email` hann skicka mejlet före sin
      // egen 403.
      expect(serveIdx).toBeGreaterThan(-1)
      expect(grind).toBeGreaterThan(serveIdx)
      expect(anrop).toBeGreaterThan(-1)
      expect(grind).toBeLessThan(anrop)
    }
  )
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

/**
 * SA2 (2026-09-02): "Sanningsregeln finns bara i den svenska AI-grenen."
 *
 * `adaptation-recommendations` och `adaptation-conversation` grenar på
 * `data.language === 'en'`. Testet ovan (`allaSystemprompter`) provar nu den
 * grenen också — men ett brett marköregex som redan matchar den svenska
 * halvan av en delad konstant (t.ex. `/sanningsregel/i`, som matchar
 * ordet "SANNINGSREGEL" oavsett vilket språk resten av stycket är på) kan
 * inte ensamt bevisa att den ENGELSKA halvan finns kvar. De här testerna
 * kräver specifikt den engelska sanningsregeln — inte bara att den delade
 * konstantens svenska etikett råkade följa med.
 */
describe('SA2: engelska grenen av adaptation-* har samma styrka som den svenska', () => {
  const SPRAKGRENAR = ['adaptation-recommendations', 'adaptation-conversation']

  it.each(SPRAKGRENAR)(
    '%s (language: "en") bär en engelsk sanningsregel, inte bara den delade konstantens svenska etikett',
    (namn) => {
      const system = PROMPTS[namn]({ language: 'en' })?.system ?? ''
      expect(system).toMatch(/never\s+invent/i)
      expect(system).toMatch(/truth\s+rule/i)
      expect(system).toMatch(/Arbetsförmedlingen/)
    }
  )

  it.each(SPRAKGRENAR)(
    '%s: svensk och engelsk gren skiljer sig åt men bär SAMMA delade konstant',
    (namn) => {
      const sv = PROMPTS[namn]({})?.system ?? ''
      const en = PROMPTS[namn]({ language: 'en' })?.system ?? ''
      // Grenarna ska INTE vara identiska (de väljer olika bassystemtext) —
      // men båda ska bära sanningsregeln, satt på vid sammansättningsstället
      // efter att språkvalet redan gjorts.
      expect(sv).not.toBe(en)
      expect(sv).toMatch(/sanningsregel/i)
      expect(en).toMatch(/sanningsregel/i)
    }
  )
})

/**
 * PX1 (beslut Mikael 2026-09-12, PUB-avvikelse 2): Perplexity bara för fria konton.
 *
 * Fem edge-funktioner skickade användarens fritext — och i pendlingsplaneraren
 * hemadressen — till `perplexity/sonar` (Perplexity AI Inc., USA, inget
 * biträdesavtal) för ALLA användare. För deltagare och personal i en organisation
 * (kommun, R&M-leverantör) ska anropet gå till basmodellen utan sökning, och
 * prompten ska säga det till modellen så den inte hittar på färska siffror.
 *
 * Grinden fäller tre sätt att komma runt beslutet tyst:
 *   1. en hårdkodad `perplexity/sonar` någon annanstans än i aiGate.ts,
 *   2. en sökfunktion som skickar en fast modellsträng i stället för `modell.model`,
 *   3. en prompt som skickas utan `UTAN_SOKNING_TILLAGG` när sökningen är av.
 *
 * Mutationsbevisat 2026-09-12: en återinsatt literal i ai-commute-planner fällde
 * testet; borttagen igen.
 */
describe('PX1: Perplexity bara för fria konton — modellvalet är centraliserat', () => {
  const FUNKTIONSKATALOG = resolve(__dirname, '../../../supabase/functions')
  const AIGATE = resolve(FUNKTIONSKATALOG, '_shared/aiGate.ts')

  function allaTsFiler(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
      const p = resolve(dir, d.name)
      if (d.isDirectory()) return allaTsFiler(p)
      return d.isFile() && /\.ts$/.test(d.name) ? [p] : []
    })
  }

  /** Kodrader utan blockkommentarer och radkommentarer — literaler i förklaringar räknas inte. */
  function utanKommentarer(kalla: string): string {
    return kalla.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  }

  it('aiGate.ts är den enda filen i supabase/functions som bär strängen perplexity/sonar', () => {
    const traffar = allaTsFiler(FUNKTIONSKATALOG)
      .filter((f) => /perplexity\/sonar/.test(utanKommentarer(readFileSync(f, 'utf8'))))
      .map((f) => f.replace(/\\/g, '/').split('/supabase/functions/')[1])
    expect(traffar).toEqual(['_shared/aiGate.ts'])
  })

  it('aiGate.ts exporterar valjModell med fail closed åt basmodellen', () => {
    const kalla = readFileSync(AIGATE, 'utf8')
    expect(kalla).toMatch(/export async function valjModell\s*\(/)
    expect(kalla).toMatch(/export const BASMODELL = 'openai\/gpt-oss-120b'/)
    expect(kalla).toMatch(/export const SOKMODELL = 'perplexity\/sonar'/)
    expect(kalla).toMatch(/export const UTAN_SOKNING_TILLAGG/)
    // organisationstillhörighet läses ur organization_members, aldrig ur en kolumn
    // på profiles (den finns inte — mätt mot prod 2026-09-12)
    expect(kalla).toMatch(/from\('organization_members'\)/)
    expect(kalla).not.toMatch(/organization_id/)
  })

  const sokfunktioner = readdirSync(FUNKTIONSKATALOG, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => ({ namn: d.name, sokvag: resolve(FUNKTIONSKATALOG, d.name, 'index.ts') }))
    .filter((f) => existsSync(f.sokvag))
    .filter((f) => /await\s+valjModell\s*\(/.test(readFileSync(f.sokvag, 'utf8')))

  it('minst fem funktioner väljer modell via valjModell()', () => {
    expect(sokfunktioner.map((f) => f.namn).sort()).toEqual(
      expect.arrayContaining([
        'ai-career-assistant',
        'ai-commute-planner',
        'ai-company-analysis',
        'ai-company-search',
        'ai-industry-radar',
      ])
    )
  })

  it.each(sokfunktioner.map((f) => [f.namn, f.sokvag]))(
    '%s skickar modell.model till OpenRouter och loggen, och lägger tillägget på prompten när sökningen är av',
    (_namn, sokvag) => {
      const kod = utanKommentarer(readFileSync(sokvag, 'utf8'))
      // Varje `model:` i en request eller logg ska vara den valda modellen.
      const modellRader = kod.match(/^\s*model:\s*[^,\n]+/gm) ?? []
      expect(modellRader.length).toBeGreaterThan(0)
      for (const rad of modellRader) expect(rad).toMatch(/model:\s*modell\.model/)
      // Tillägget ska villkoras på webbsokning, inte skickas alltid eller aldrig.
      expect(kod).toMatch(/modell\.webbsokning\s*\?\s*\w+\s*:\s*\w+\s*\+\s*UTAN_SOKNING_TILLAGG/)
      // Valet görs efter AI-grinden (samma ordning som tokentaket) och före anropet.
      const grind = kod.indexOf('await checkAiEnabled')
      const val = kod.indexOf('await valjModell')
      const anrop = kod.indexOf('OPENROUTER_API_URL,')
      expect(grind).toBeGreaterThan(-1)
      expect(val).toBeGreaterThan(grind)
      expect(anrop).toBeGreaterThan(val)
    }
  )

  it('ai-company-search hoppar över allabolag-uppslaget när sökningen är av', () => {
    const kod = utanKommentarer(readFileSync(resolve(FUNKTIONSKATALOG, 'ai-company-search/index.ts'), 'utf8'))
    expect(kod).toMatch(/if\s*\(\s*modell\.webbsokning\s*&&\s*companiesWithoutOrgNr\.length/)
  })
})
