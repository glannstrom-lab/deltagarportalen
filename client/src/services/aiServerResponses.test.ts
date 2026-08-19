/**
 * B17 + B18 — serversidans svarshantering och modell-låsning i `client/api/ai.js`.
 *
 * Två saker testas här, båda på riktig kod (`require` av handlern, inga
 * mockade hjälpfunktioner):
 *
 *  - **Svarsvalidering (B17).** Modellen svarar ibland med markdown-fence
 *    eller med ett objekt som saknar de fält UI:t läser. Två funktioner —
 *    `intervju-simulator` och `sta-doa-sammanfattning` — har ingen
 *    Zod-validering hos anroparen och fick tidigare svaret orört.
 *  - **Modell-låsning (B18).** `openai/gpt-oss-120b` är låst av kostnadsskäl.
 *    Källvakten längst ned läser filerna på disk i stället för att lita på
 *    att någon kommer ihåg regeln: en hårdkodad modellsträng i en ny
 *    edge-funktion fäller testet.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const aiHandler = require('../../api/ai.js') as {
  extractJsonContent: (raw: unknown) => { ok: boolean; value?: unknown }
  RESPONSE_VALIDATORS: Record<
    string,
    (value: unknown) => { ok: boolean; value?: unknown; error?: string }
  >
  PROMPTS: Record<
    string,
    (data: Record<string, unknown>) => {
      system: string
      user: string
      parseJson?: boolean
      responseKey: string
    }
  >
  resolveModel: () => string
  LOCKED_MODEL: string
}

// --------------------------------------------------------------------------
// extractJsonContent — code fences och omgivande prosa
// --------------------------------------------------------------------------
describe('extractJsonContent', () => {
  it('tolkar rå JSON', () => {
    expect(aiHandler.extractJsonContent('{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
  })

  it('tolkar JSON inbäddad i ```json-fence', () => {
    // Det här är den vanliga verkliga avvikelsen: prompten säger "svara ENDAST
    // med JSON" och modellen lyder — inuti en markdown-fence. Före B17 blev
    // svaret `{ raw: "```json…" }` och UI:t renderade undefined.
    const raw = '```json\n{"rating":4,"feedback":"Bra","nastaFraga":"Varför?"}\n```'
    const result = aiHandler.extractJsonContent(raw)
    expect(result.ok).toBe(true)
    expect(result.value).toEqual({ rating: 4, feedback: 'Bra', nastaFraga: 'Varför?' })
  })

  it('tolkar JSON med prosa före och efter', () => {
    const raw = 'Här kommer analysen:\n{"malPlanering":"x"}\nHoppas det hjälper!'
    expect(aiHandler.extractJsonContent(raw)).toEqual({ ok: true, value: { malPlanering: 'x' } })
  })

  it('ger ok:false när det inte finns någon JSON alls', () => {
    expect(aiHandler.extractJsonContent('Tyvärr kan jag inte svara på det.').ok).toBe(false)
    expect(aiHandler.extractJsonContent('').ok).toBe(false)
    expect(aiHandler.extractJsonContent(null).ok).toBe(false)
  })
})

// --------------------------------------------------------------------------
// intervju-simulator
// --------------------------------------------------------------------------
describe('RESPONSE_VALIDATORS["intervju-simulator"]', () => {
  const validate = () => aiHandler.RESPONSE_VALIDATORS['intervju-simulator']

  it('släpper igenom ett komplett svar', () => {
    const result = validate()({ rating: 4, feedback: '  Tydligt exempel  ', nastaFraga: 'Vad hände sen?' })
    expect(result.ok).toBe(true)
    expect(result.value).toEqual({ rating: 4, feedback: 'Tydligt exempel', nastaFraga: 'Vad hände sen?' })
  })

  it('fäller svar som inte är ett objekt', () => {
    expect(validate()('Bra svar!').ok).toBe(false)
    expect(validate()([{ rating: 4 }]).ok).toBe(false)
    expect(validate()(null).ok).toBe(false)
  })

  it('fäller svar där varken feedback eller nästa fråga finns', () => {
    // Utan den här grinden hade deltagaren fått en hårdkodad reservfråga som
    // ser ut att komma från AI:n, och ingen feedback — tyst degradering.
    expect(validate()({ rating: 4 }).ok).toBe(false)
    expect(validate()({ feedback: '   ', nastaFraga: '' }).ok).toBe(false)
  })

  it('utelämnar betyg utanför 1-5 i stället för att klampa det', () => {
    // B12: ett gissat eller klampat betyg visas som "AI-betyg" och räknas in i
    // snittet. Inget betyg är rätt svar när modellen inte gav ett giltigt.
    const out = validate()({ rating: 9, feedback: 'ok', nastaFraga: 'Nästa?' })
    expect(out.ok).toBe(true)
    expect(out.value).not.toHaveProperty('rating')
  })

  it('utelämnar betyg som inte är ett tal', () => {
    const out = validate()({ rating: '4', feedback: 'ok', nastaFraga: 'Nästa?' })
    expect(out.ok).toBe(true)
    expect(out.value).not.toHaveProperty('rating')
  })
})

// --------------------------------------------------------------------------
// sta-doa-sammanfattning
// --------------------------------------------------------------------------
describe('RESPONSE_VALIDATORS["sta-doa-sammanfattning"]', () => {
  const validate = () => aiHandler.RESPONSE_VALIDATORS['sta-doa-sammanfattning']

  const giltig = {
    malPlanering: 'Deltagaren fortsätter mot arbetsprövning.',
    kategorier: [{ title: 'Fysisk förmåga', resurserBegransningar: 'God rörlighet.' }],
  }

  it('släpper igenom ett komplett svar', () => {
    const out = validate()(giltig)
    expect(out.ok).toBe(true)
    expect(out.value).toEqual(giltig)
  })

  it('fäller svar utan malPlanering', () => {
    expect(validate()({ ...giltig, malPlanering: '' }).ok).toBe(false)
    expect(validate()({ kategorier: giltig.kategorier }).ok).toBe(false)
  })

  it('fäller svar där kategorier inte är en lista', () => {
    expect(validate()({ ...giltig, kategorier: 'Fysisk förmåga: god' }).ok).toBe(false)
  })

  it('fäller svar där ingen kategori är användbar', () => {
    // Texten går till AF:s blankett. En kategori utan text blir en tom ruta i
    // ett myndighetsdokument — hellre ett fel som syns.
    expect(validate()({ ...giltig, kategorier: [{ title: 'Fysisk förmåga' }] }).ok).toBe(false)
    expect(validate()({ ...giltig, kategorier: [] }).ok).toBe(false)
  })

  it('rensar bort enstaka trasiga kategorier men behåller de hela', () => {
    const out = validate()({
      ...giltig,
      kategorier: [
        { title: 'Fysisk förmåga', resurserBegransningar: 'God rörlighet.' },
        { title: 'Kognition' },
        'inte ett objekt',
      ],
    })
    expect(out.ok).toBe(true)
    expect(out.value).toEqual({
      malPlanering: giltig.malPlanering,
      kategorier: [{ title: 'Fysisk förmåga', resurserBegransningar: 'God rörlighet.' }],
    })
  })
})

// --------------------------------------------------------------------------
// sta-week-summary — prompten får inte be om JSON utan parseJson
// --------------------------------------------------------------------------
describe('sta-week-summary', () => {
  it('ber inte om JSON, eftersom mallen inte parsar JSON', () => {
    // B17/B8: prompten sa "Returnera JSON: { summary }" men mallen saknade
    // `parseJson` — konsulenten hade fått se klamrar och citattecken.
    // Kombinationen "prompten kräver JSON" + "handlern parsar inte" är
    // buggen; det här testet fäller båda halvorna av den.
    const prompt = aiHandler.PROMPTS['sta-week-summary']({ bundle: {} })
    expect(prompt.parseJson).toBeFalsy()
    expect(prompt.user).not.toMatch(/returnera\s+json/i)
  })

  it('varje prompt som kräver JSON har parseJson', () => {
    // Generell vakt: samma bugg har nu uppstått två gånger (B8, B17).
    // Undantag: prompter där "JSON" bara förekommer som beskrivning av
    // inskickad data ("icke-instruktion") fångas inte av regexen nedan.
    const kraverJson = /(svara\s+endast\s+med\s+json|returnera\s+(endast\s+)?(giltig\s+)?json)/i
    const brister: string[] = []
    for (const [namn, build] of Object.entries(aiHandler.PROMPTS)) {
      const prompt = build({})
      const text = `${prompt.system}\n${prompt.user}`
      if (kraverJson.test(text) && !prompt.parseJson) brister.push(namn)
    }
    expect(brister).toEqual([])
  })
})

// --------------------------------------------------------------------------
// B18 — modell-låsning
// --------------------------------------------------------------------------
describe('modell-låsning', () => {
  it('resolveModel returnerar den låsta modellen som default', () => {
    const original = process.env.AI_MODEL
    delete process.env.AI_MODEL
    try {
      expect(aiHandler.resolveModel()).toBe('openai/gpt-oss-120b')
      expect(aiHandler.LOCKED_MODEL).toBe('openai/gpt-oss-120b')
    } finally {
      if (original === undefined) delete process.env.AI_MODEL
      else process.env.AI_MODEL = original
    }
  })

  it('AI_MODEL är den enda spaken — AI_MODEL_HAIKU finns inte kvar', () => {
    // B18: följdfrågorna efter en strömmad AI-team-chatt läste
    // `AI_MODEL_HAIKU` FÖRE `AI_MODEL`. Var den satt i Vercels miljö kördes en
    // annan modell än låsningen anger, utan spår i kod eller dokumentation.
    const original = { model: process.env.AI_MODEL, haiku: process.env.AI_MODEL_HAIKU }
    process.env.AI_MODEL_HAIKU = 'anthropic/claude-3-haiku'
    delete process.env.AI_MODEL
    try {
      expect(aiHandler.resolveModel()).toBe('openai/gpt-oss-120b')
    } finally {
      if (original.model === undefined) delete process.env.AI_MODEL
      else process.env.AI_MODEL = original.model
      if (original.haiku === undefined) delete process.env.AI_MODEL_HAIKU
      else process.env.AI_MODEL_HAIKU = original.haiku
    }
  })

  // ------------------------------------------------------------------------
  // Källvakt: modellsträngar i backend-koden
  // ------------------------------------------------------------------------
  // Modell-låsningen har läckt två gånger på ställen ingen letade
  // (`AI_MODEL_HAIKU` i ai.js, hårdkodad `gpt-4` mot OpenAI i cv-analysis).
  // Att testa `resolveModel()` fångar inte en NY fil som skriver sin egen
  // sträng — därför läser det här testet filerna på disk.
  const REPO_ROOT = resolve(__dirname, '../../..')

  /** Modeller som får förekomma. `perplexity/sonar` är ett dokumenterat
   *  undantag (behöver web-search), se docs/AI_MODEL_LOCKING.md. */
  const TILLATNA_MODELLER = new Set(['openai/gpt-oss-120b', 'perplexity/sonar'])

  /** Strängar som ser ut som modell-ID:n. */
  const MODELL_LITERAL =
    /['"`]((?:openai|anthropic|google|meta-llama|mistralai|perplexity|deepseek|qwen|x-ai|cohere)\/[\w.:-]+|gpt-[\w.-]+|claude-[\w.-]+)['"`]/g

  function samlaFiler(dir: string, ext: string[], ut: string[] = []): string[] {
    for (const namn of readdirSync(dir)) {
      if (namn === 'node_modules' || namn === 'dist') continue
      const full = join(dir, namn)
      if (statSync(full).isDirectory()) samlaFiler(full, ext, ut)
      else if (ext.some((e) => namn.endsWith(e))) ut.push(full)
    }
    return ut
  }

  it('ingen backend-fil hårdkodar en modell utanför låsningen', () => {
    const filer = [
      ...samlaFiler(join(REPO_ROOT, 'client', 'api'), ['.js']),
      ...samlaFiler(join(REPO_ROOT, 'supabase', 'functions'), ['.ts']),
    ]
    expect(filer.length).toBeGreaterThan(10)

    const overtradelser: string[] = []
    for (const fil of filer) {
      const kod = readFileSync(fil, 'utf8')
      for (const rad of kod.split('\n')) {
        // Kommentarer får nämna modellnamn (rollback-instruktioner m.m.)
        const trimmad = rad.trim()
        if (trimmad.startsWith('//') || trimmad.startsWith('*')) continue
        for (const match of rad.matchAll(MODELL_LITERAL)) {
          if (!TILLATNA_MODELLER.has(match[1])) {
            overtradelser.push(`${fil.slice(REPO_ROOT.length + 1)}: ${match[1]}`)
          }
        }
      }
    }
    expect(overtradelser).toEqual([])
  })

  it('ingen backend-fil anropar api.openai.com direkt', () => {
    // cv-analysis gick förbi OpenRouter helt — separat faktura, inget
    // kostnadstak, ingen rate limit.
    const filer = [
      ...samlaFiler(join(REPO_ROOT, 'client', 'api'), ['.js']),
      ...samlaFiler(join(REPO_ROOT, 'supabase', 'functions'), ['.ts']),
    ]
    const traffar = filer.filter((fil) =>
      readFileSync(fil, 'utf8')
        .split('\n')
        .some((rad) => {
          const trimmad = rad.trim()
          // Kommentarer får förklara varför vägen togs bort.
          if (trimmad.startsWith('//') || trimmad.startsWith('*')) return false
          return rad.includes('api.openai.com')
        })
    )
    expect(traffar.map((f) => f.slice(REPO_ROOT.length + 1))).toEqual([])
  })
})

describe('RESPONSE_VALIDATORS["cv-import-erfarenhet"]', () => {
  const validera = () =>
    aiHandler.RESPONSE_VALIDATORS['cv-import-erfarenhet'] as (
      v: unknown,
    ) => { ok: boolean; value?: unknown; error?: string }

  // Prompten ber om POSITIONELLA arrayer, inte objekt med nyckelnamn.
  // Uppmätt mot prod 2026-08-19: nyckelnamnen var merparten av utdatan och
  // fick svaret att spränga funktionens 60-sekunderstak — tio tjänster i
  // objektform krävde 800–1200 tokens och gav 504 varje gång. Kompakt form
  // kostar ~25 tokens per tjänst i stället för ~70.
  //
  // Testet finns för att expansionen inte ska gå sönder tyst: klientens
  // kontrakt är objektform, och byter någon tillbaka prompten till objekt
  // ska det åtminstone synas här.
  it('expanderar kompakta arrayer till objektform', () => {
    const r = validera()({
      w: [
        ['Undersköterska', 'Attendo', '2019-03', '2024-08', 0],
        ['Vårdbiträde', 'Kommunen', '2016-01', '', 1],
      ],
      e: [['Burgården', 'Undersköterska', 'Vård', '2004', '2007']],
    })
    expect(r.ok).toBe(true)
    const v = r.value as { workExperience: Array<Record<string, unknown>>; education: Array<Record<string, unknown>> }
    expect(v.workExperience).toHaveLength(2)
    expect(v.workExperience[0]).toMatchObject({
      title: 'Undersköterska', company: 'Attendo', startDate: '2019-03', endDate: '2024-08',
    })
    // Pågående kommer som 1, inte true, och slutdatum är tomt.
    expect(v.workExperience[1]).toMatchObject({ title: 'Vårdbiträde', current: true })
    expect(v.workExperience[1].endDate).toBeUndefined()
    expect(v.education[0]).toMatchObject({ school: 'Burgården', field: 'Vård' })
  })

  it('tar emot objektform också — modellen faller ibland tillbaka på den', () => {
    const r = validera()({
      workExperience: [{ title: 'X', company: 'Y', startDate: '2020' }],
      education: [],
    })
    expect(r.ok).toBe(true)
    expect((r.value as { workExperience: unknown[] }).workExperience).toHaveLength(1)
  })

  it('skriver aldrig in en beskrivning — formatet har ingen plats för den', () => {
    const r = validera()({ w: [['Titel', 'Företag', '2020', '2021', 0, 'en beskrivning som smugit sig in']] })
    const rad = (r.value as { workExperience: Array<Record<string, unknown>> }).workExperience[0]
    expect(rad.description).toBeUndefined()
  })

  it('tomt svar är giltigt — alla CV har inte utbildning eller erfarenhet', () => {
    const r = validera()({ w: [], e: [] })
    expect(r.ok).toBe(true)
  })

  it('fäller det som inte är ett objekt alls', () => {
    expect(validera()('nej').ok).toBe(false)
    expect(validera()(null).ok).toBe(false)
  })

  it('släpper igenom skräp i listan som tomt i stället för att kasta', () => {
    const r = validera()({ w: 'inte en array', e: [['Skola']] })
    expect(r.ok).toBe(true)
    expect((r.value as { workExperience: unknown[] }).workExperience).toEqual([])
    expect((r.value as { education: unknown[] }).education).toHaveLength(1)
  })
})
