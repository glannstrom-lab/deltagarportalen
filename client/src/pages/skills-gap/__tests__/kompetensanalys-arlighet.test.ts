/**
 * Vakter för Kompetensanalysen efter genomgången 2026-08-21.
 *
 * De rena funktionerna (`kortDromjobb`, `antalKlara`, `sakerUrl`,
 * `profiltackning`, `formatProfileSummary`) prövas mot riktiga anrop — de
 * producerar det användaren får se och var helt otestade; sidan hade noll
 * egna testfiler. Resten är källkodsvakter, eftersom felen sitter i
 * ETIKETTER, i en HTTP-metod, i en frånvarande felskillnad och i vem som
 * äger ett tillstånd. Ett renderingstest mot tomma mockar hade gått grönt
 * genom hela historien.
 *
 * Vakterna läser KOMMENTARSFRI källkod. Varje rättelse är dokumenterad i en
 * docstring som nämner felet den tog bort, så en naiv `not.toContain` matchar
 * sin egen förklaring — det fällde tio av tolv vakter i Karriär-sviten.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { antalKlara, arLangDromjobb, forhandsvisning, kortDromjobb, sakerUrl } from '../dromjobb'
import { formatProfileSummary, profiltackning } from '../profilunderlag'
import type { CVData } from '@/services/supabaseApi'

const KLIENT = join(__dirname, '..', '..', '..', '..')
const ROT = join(KLIENT, '..')

const kod = (abs: string) =>
  readFileSync(abs, 'utf-8')
    // Radkommentarer FÖRST: en rad som "// … /dashboard/*, som App.tsx"
    // innehåller ett `/*` som aldrig stängs, och blockregexen nedan skulle
    // då sluka allt fram till nästa `*/` längre ner i filen. I Help.tsx
    // försvann 1 286 tecken inklusive hela fokusgrenen, och vakten läste en
    // fil som såg ren ut.
    .replace(/(?<!:)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

const src = (rel: string) => kod(join(KLIENT, 'src', rel))
const repo = (rel: string) => kod(join(ROT, rel))

// ---------------------------------------------------------------------------
// Drömjobbet är fritext — ofta en hel jobbannons
// ---------------------------------------------------------------------------
describe('kortDromjobb', () => {
  const ANNONS = [
    'Vi söker en lagermedarbetare till vårt distributionscenter i Göteborg.',
    'Arbetsuppgifter: plockning och packning av kundordrar, truckkörning',
    'och enklare underhåll. Heltid, tillsvidare efter provanställning.',
  ].join('\n')

  it('vägrar hitta på en yrkestitel ur en inklistrad annons', () => {
    /*
      Första försöket kapade bara första raden vid 70 tecken. Annonsens
      öppningsmening är 69 — den slank igenom hel och hamnade mitt i
      "Här är dina styrkor och nästa steg mot Vi söker en lagermedarbetare
      till vårt distributionscenter i Göteborg.". Ett kortare kap hade bara
      gett en avhuggen mening; en titel går inte att härleda ur en annons.
    */
    expect(kortDromjobb(ANNONS)).toBe('')
    expect(kortDromjobb('Vi söker en lagermedarbetare till vårt distributionscenter.')).toBe('')
    expect(kortDromjobb('Erfaren projektledare inom bygg och anläggning med samordningsansvar')).toBe('')
  })

  it('visar i stället det användaren skrev som ett tydligt kapat citat', () => {
    const citat = forhandsvisning(ANNONS)
    expect(citat.length).toBeLessThanOrEqual(91)
    expect(citat.endsWith('…')).toBe(true)
    expect(citat).not.toContain('\n')
    expect(ANNONS.replace(/\s+/g, ' ')).toContain(citat.slice(0, -1))
  })

  it('lämnar en vanlig yrkestitel orörd', () => {
    expect(kortDromjobb('Undersköterska')).toBe('Undersköterska')
    expect(kortDromjobb('  Systemutvecklare  ')).toBe('Systemutvecklare')
  })

  it('kapar citatet vid ordgräns, inte mitt i ett ord', () => {
    const lang = 'Erfaren projektledare inom bygg och anläggning med samordningsansvar för underentreprenörer och löpande uppföljning av tidplaner'
    const citat = forhandsvisning(lang)
    expect(citat.endsWith('…')).toBe(true)
    const utanEllips = citat.slice(0, -1)
    expect(lang.startsWith(utanEllips)).toBe(true)
    expect(lang[utanEllips.length]).toBe(' ')
  })

  it('ger tom sträng för tomt underlag i stället för "undefined"', () => {
    expect(kortDromjobb(null)).toBe('')
    expect(kortDromjobb(undefined)).toBe('')
    expect(kortDromjobb('   ')).toBe('')
  })

  it('flaggar en annons som lång men inte en yrkestitel', () => {
    expect(arLangDromjobb(ANNONS)).toBe(true)
    expect(arLangDromjobb('Undersköterska')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Talet som ersatte matchningsprocenten
// ---------------------------------------------------------------------------
describe('antalKlara', () => {
  it('räknar kompetenser som redan är på plats', () => {
    expect(antalKlara([
      { name: 'a', current: 4, target: 3, gap: 'none' },
      { name: 'b', current: 2, target: 4, gap: 'medium' },
      { name: 'c', current: 5, target: 5, gap: 'none' },
    ] as never)).toBe(2)
  })

  it('räknar current >= target som klar även när gap säger annat', () => {
    // Modellen sätter `gap` själv och är inte alltid konsekvent mot talen.
    // Talet vi visar måste gå att räkna efter i listan under.
    expect(antalKlara([{ name: 'a', current: 4, target: 3, gap: 'small' }] as never)).toBe(1)
  })

  it('ger 0 för tom lista utan att kasta', () => {
    expect(antalKlara([])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Länkar ur AI-genererat innehåll
// ---------------------------------------------------------------------------
describe('sakerUrl', () => {
  it('avvisar javascript-URL:er', () => {
    expect(sakerUrl('javascript:alert(1)')).toBeNull()
  })

  it('avvisar data-URL:er', () => {
    expect(sakerUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('släpper igenom https', () => {
    expect(sakerUrl('https://www.arbetsformedlingen.se')).toBe('https://www.arbetsformedlingen.se/')
  })

  it('ger null för skräp i stället för att kasta', () => {
    expect(sakerUrl('inte en url alls ::: ///')).toBeNull()
    expect(sakerUrl('/relativ/sokvag')).toBeNull()
    expect(sakerUrl(null)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Underlaget: fälten avgör, inte teckenantalet
// ---------------------------------------------------------------------------
describe('profiltackning', () => {
  it('släpper INTE igenom ett CV med bara namn och titel', () => {
    /*
      Tröskeln var `profileSummary.trim().length > 50`. "Namn: Anna Andersson,
      Undersköterska" är 47 tecken; med en rad till passerade den, och AI:n
      ombads jämföra ett tomt CV mot ett yrke.
    */
    const t = profiltackning({ title: 'Undersköterska' } as CVData)
    expect(t.racker).toBe(false)
    expect(t.saknas).toEqual(['erfarenhet', 'utbildning', 'kompetenser'])
  })

  it('namnger vad som saknas i stället för att bara säga "fyll i mer"', () => {
    const t = profiltackning({
      workExperience: [{ id: '1', title: 'Vårdbiträde', company: 'X', startDate: '2020' }],
    } as CVData)
    expect(t.saknas).toContain('utbildning')
    expect(t.saknas).toContain('kompetenser')
    expect(t.saknas).not.toContain('erfarenhet')
  })

  it('räcker med erfarenhet plus kompetenser', () => {
    const t = profiltackning({
      workExperience: [{ id: '1', title: 'Vårdbiträde', company: 'X', startDate: '2020' }],
      skills: [{ id: '1', name: 'Omvårdnad', level: 4, category: 'other' }],
    } as CVData)
    expect(t.racker).toBe(true)
  })

  it('hanterar snake_case-formen från databasen', () => {
    const t = profiltackning({
      work_experience: [{ id: '1', title: 'Lagerarbetare', company: 'X', startDate: '2019' }],
      education: [{ id: '1', degree: 'Gymnasium', school: 'Y', startDate: '2015' }],
    } as unknown as CVData)
    expect(t.erfarenhet).toBe(true)
    expect(t.racker).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Vad som faktiskt skickas till språkmodellen
// ---------------------------------------------------------------------------
describe('formatProfileSummary', () => {
  it('skriver språket med rätt nyckel — inte "undefined"', () => {
    /*
      Koden läste `l.name`. Fältet heter `language`, och 15 av de 18 CV:n i
      prod med språk ifyllda bär den nyckeln (mätt 2026-08-21). Prompten sa
      alltså "undefined (Flytande)" om varenda en av dem.
    */
    const text = formatProfileSummary({
      title: 'Kock',
      languages: [{ id: '1', language: 'Svenska', level: 'Modersmål' }],
    } as CVData)
    expect(text).toContain('Svenska (Modersmål)')
    expect(text).not.toContain('undefined')
  })

  it('tar även emot den äldre name-formen', () => {
    const text = formatProfileSummary({
      title: 'Kock',
      languages: [{ id: '1', name: 'Engelska', level: 'God' }],
    } as unknown as CVData)
    expect(text).toContain('Engelska (God)')
    expect(text).not.toContain('undefined')
  })

  it('skriver ut utbildningens årtal ur startDate/endDate, inte ur year', () => {
    /*
      Läste `edu.year`, ett fält som varken finns i typen eller i något av de
      26 CV:n i prod. Utbildningens tid nådde alltså aldrig modellen.
    */
    const text = formatProfileSummary({
      title: 'Kock',
      education: [{ id: '1', degree: 'Restaurang', school: 'Yrkesgymnasiet', startDate: '2014', endDate: '2017' }],
    } as CVData)
    expect(text).toContain('2017')
  })

  it('skickar inte användarens namn till modellen', () => {
    /*
      Prompten inleddes med "Namn: <förnamn>, <titel>". Namnet behövs inte
      för att jämföra kompetenser mot ett yrke, och varje personuppgift som
      lämnar portalen ska ha ett skäl.
    */
    const text = formatProfileSummary({
      firstName: 'Anna',
      first_name: 'Anna',
      title: 'Undersköterska',
    } as unknown as CVData)
    expect(text).not.toContain('Anna')
    expect(text).toContain('Undersköterska')
  })

  it('ger tom sträng utan CV i stället för en halv mening', () => {
    expect(formatProfileSummary(null)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Källkodsvakter
// ---------------------------------------------------------------------------
describe('Fokusläget river inte det ifyllda', () => {
  const sida = src('pages/SkillsGapAnalysis.tsx')

  it('renderar båda grenarna och döljer den ena — ingen tidig return', () => {
    /*
      `if (isFocusMode) return <PageFocusShell…>` bytte ut hela trädet, så
      drömjobbsfältet tömdes när växeln slogs om. Samma fel som b93be382
      (intervjusimulatorn) och 00d8be26 (lönesidan) lagade.
    */
    expect(sida).not.toMatch(/if\s*\(\s*isFocusMode\s*\)\s*\{?\s*return/)
    expect(sida).toContain("style={isFocusMode ? { display: 'none' } : undefined}")
  })

  it('tar emot drömjobbet från guiden i stället för att låta användaren skriva två gånger', () => {
    expect(sida).toContain('onTaMedDromjobb')
  })
})

describe('Fokusguiden skriver ingen tom analys', () => {
  const guide = src('components/focus/pages/FocusSkillsGapWizard.tsx')

  it('rör inte skills_analyses', () => {
    /*
      Skrev `skillsAnalysisApi.create({ match_percentage: 0, ... })` med tomma
      listor. Sidan laddar senaste raden och renderade då "Din analys är klar"
      med en 0 %-cirkel, AI-vattenstämpel över användarens egen text, och
      ingen väg tillbaka till formuläret.
    */
    expect(guide).not.toContain('skillsAnalysisApi')
    expect(guide).not.toContain('match_percentage')
  })

  it('stänger inte guiden när sparningen misslyckas', () => {
    const sparblock = guide.slice(guide.indexOf("current.id === 'save'"))
    const forstaOnExit = sparblock.indexOf('onExit()')
    const catchIndex = sparblock.indexOf('catch')
    expect(forstaOnExit).toBeGreaterThan(-1)
    expect(catchIndex).toBeGreaterThan(-1)
    // onExit ska ligga FÖRE catch, alltså inne i try — inte efter.
    expect(forstaOnExit).toBeLessThan(catchIndex)
  })
})

describe('Resultatvyn betygsätter inte personen', () => {
  const resultat = src('pages/skills-gap/SkillsGapResult.tsx')

  it('visar ingen matchningsprocent', () => {
    expect(resultat).not.toContain('match_percentage')
    expect(resultat).not.toMatch(/\{[^}]*matchPercentage[^}]*\}\s*%/)
  })

  it('har ingen progressbar med aria-valuenow för matchningen', () => {
    expect(resultat).not.toContain('aria-valuenow')
  })

  it('ger båda ikonknapparna ett tillgängligt namn', () => {
    const namn = resultat.match(/aria-label=\{t\('skillsGapAnalysis\.result\.(download|delete)Label'\)\}/g) ?? []
    expect(namn.length).toBe(2)
  })

  it('skriver inte ut hela dream_job i löpande text', () => {
    // Rå `{analysis.dream_job}` får bara förekomma inuti <details>-blocket.
    const detaljIndex = resultat.indexOf('<details')
    const detaljSlut = resultat.indexOf('</details>')
    let i = resultat.indexOf('{analysis.dream_job}')
    while (i !== -1) {
      expect(i).toBeGreaterThan(detaljIndex)
      expect(i).toBeLessThan(detaljSlut)
      i = resultat.indexOf('{analysis.dream_job}', i + 1)
    }
  })

  it('använder inte främmande färgfamiljer för skillnaden', () => {
    /*
      `text-yellow-600` på `bg-yellow-100` mätte 2,74:1 mot kravet 4,5:1, och
      fyra färgfamiljer låg på en rosa sida. Färgen bar dessutom
      informationen ensam (SC 1.4.1).
    */
    for (const familj of ['yellow-600', 'orange-600', 'green-600', 'red-600']) {
      expect(resultat).not.toContain(`text-${familj}`)
    }
  })

  it('renderar listorna som ul/li, inte som divar med role="list"', () => {
    expect(resultat).not.toContain('role="list"')
  })
})

describe('Länkar ur AI-innehåll öppnas säkert', () => {
  it('använder inte window.open utan noopener', () => {
    const resultat = src('pages/skills-gap/SkillsGapResult.tsx')
    expect(resultat).not.toContain('window.open(')
    expect(resultat).toContain('rel="noopener noreferrer"')
    expect(resultat).toContain('sakerUrl(')
  })
})

describe('Fel skiljs från tomhet', () => {
  const hook = src('pages/skills-gap/useSkillsGap.ts')

  it('använder allSettled och vet vilket anrop som föll', () => {
    /*
      Fyra tysta `.catch(() => …)` gjorde ett nätverksfel identiskt med tom
      data — sidan bad då någon med fullständigt CV att gå och fylla i det.
    */
    expect(hook).toContain('Promise.allSettled')
    expect(hook).toContain('setLaddningsfel')
  })

  it('skiljer AI-brytaren från övriga fel', () => {
    expect(hook).toContain('AiConsentRequiredError')
    expect(hook).toContain("'ai-avstangd'")
  })

  it('rapporterar när radering misslyckas', () => {
    const block = hook.slice(hook.indexOf('const raderaAnalys'), hook.indexOf('const laggTillIKarriarplan'))
    expect(block).toContain('showToast.error')
  })

  it('rapporterar när karriärplanen inte kunde skrivas', () => {
    const block = hook.slice(hook.indexOf('const laggTillIKarriarplan'), hook.indexOf('const valjAnalys'))
    expect(block).toContain('showToast.error')
  })

  it('skiljer ett hämtningsfel för utbildningar från noll träffar', () => {
    expect(hook).toContain("setUtbildningslage('fel')")
    expect(hook).toContain("svar.source === 'error'")
  })

  it('använder ConfirmDialog i stället för native confirm', () => {
    expect(hook).not.toMatch(/(?<![.\w])confirm\s*\(\s*t\(/)
    expect(hook).toContain('useConfirmDialog')
  })

  it('skyddar mot dubbelklick i funktionen, inte bara via disabled', () => {
    // Inte bara att flaggan finns — den måste användas som SPÄRR. Vakten
    // gick grön när själva `if (…) return` togs bort men tilldelningarna
    // låg kvar; flaggan sattes då men stoppade ingenting.
    expect(hook).toMatch(/if\s*\(\s*analysPagar\.current\s*\)\s*return/)
  })
})

describe('Kurserna kommer inte längre ur språkmodellen', () => {
  it('prompten ber inte om kurser', () => {
    const ai = repo('client/api/ai.js')
    // Den FÖRSTA träffen på 'kompetensgap' är rate-limit-tabellen, inte
    // prompten. En slice därifrån läser fel block och går grön av fel skäl.
    const start = ai.indexOf("'kompetensgap': (data)")
    const slut = ai.indexOf("'cv-jobbmatchning': (data)")
    const block = ai.slice(start, slut)
    // En slice med fel ankare ger TOM sträng, och en tom sträng passerar
    // varje `not.toContain` — vakten hade då gått grön utan att läsa något.
    expect(start).toBeGreaterThan(-1)
    expect(slut).toBeGreaterThan(start)
    expect(block.length).toBeGreaterThan(500)
    // Inte `not.toContain('"courses"')` — själva förbudet nämner fältnamnet
    // ("Fältet \"courses\" ska utelämnas helt") och vakten matchade sin egen
    // instruktion. Det är JSON-MALLEN som inte får bära en kurslista.
    const mall = block.slice(block.indexOf('{"matchPercentage"'), block.indexOf('Regler:'))
    expect(mall.length).toBeGreaterThan(50)
    expect(mall).not.toContain('courses')
    expect(block).toMatch(/FÖRESLÅ INGA KURSER/)
  })

  it('sidan sparar en tom kurslista i stället för modellens', () => {
    const hook = src('pages/skills-gap/useSkillsGap.ts')
    expect(hook).toContain('recommended_courses: []')
  })
})

describe('Utbildningsvägen till JobEd Connect', () => {
  const edge = repo('supabase/functions/education-search/index.ts')
  // Den rena normaliseringen bröts ut ur index.ts 2026-08-22 så att den går
  // att köra i test. Textassertionerna nedan som rör den läser därför den
  // filen; de riktiga testerna av samma kod ligger i
  // services/__tests__/utbildning-normalisering.test.ts.
  const normalisera = repo('supabase/functions/education-search/normalisera.ts')

  it('låter inte /:id-grenen fånga POST /match', () => {
    /*
      `/^\/[^/]+$/` matchar `/match`, och metodkontrollen saknades. POST
      /match slog därför upp utbildningen med id "match" och svarade 404
      {"error":"Education not found"}. Matchgrenen var oåtkomlig, och
      `matchEducationsByJobTitle` returnerade alltid tom lista.
    */
    expect(edge).toContain("req.method === 'GET' && path.match(")
    expect(edge).toContain("id !== 'match'")
  })

  it('skickar yrkestiteln som query-parameter jobtitle', () => {
    /*
      Skickade `{job_title}` som JSON-body. JobEd svarar då 400
      "Required query parameter jobtitle not specified".
    */
    const block = edge.slice(edge.indexOf('async function matchByJobTitle'))
    expect(block).toContain("queryParams.set('jobtitle'")
    expect(block).not.toContain('job_title: jobTitle')
  })

  it('läser träffarna ur data.hits, inte ur svaret som array', () => {
    /*
      `Array.isArray(data)` var alltid falskt — svaret är
      {mapped_occupation_for_match, hits_total, hits}.
    */
    const block = edge.slice(edge.indexOf('async function matchByJobTitle'))
    expect(block).toContain('data?.hits')
    expect(block).not.toContain('Array.isArray(data) ? data.map(normalizeEducation)')
  })

  it('normaliserar matchträffarnas platta form', () => {
    expect(normalisera).toContain('function normalizeMatchHit')
    expect(normalisera).toContain('education_title')
  })
})

describe('Offline-lagret överlever inte utloggningen', () => {
  it('läser och skriver kompetensanalysen under samma nyckel', () => {
    const lager = src('services/offlineStorage.ts')
    const block = lager.slice(lager.indexOf('async cacheSkillsAnalysis'), lager.indexOf('async cacheNetworkContacts'))
    expect(block).not.toContain("analysis.id || 'latest'")
  })

  it('rensas vid utloggning', () => {
    const auth = src('stores/authStore.ts')
    expect(auth).toContain('careerOfflineCache.rensaAllt()')
  })
})

describe('Nedladdade filen bär sitt ursprung', () => {
  const ned = src('pages/skills-gap/laddaNerAnalys.ts')

  it('märker texten som AI-framtagen', () => {
    /*
      Skärmen har AIGeneratedWatermark med hänvisning till AI Act art. 50.2.
      Filen som lämnar portalen — den som skickas till handledare eller
      arbetsgivare — hade ingenting.
    */
    expect(ned).toContain("download.aiNotice")
  })

  it('bär inte matchningsprocenten vidare', () => {
    expect(ned).not.toContain('match_percentage')
    expect(ned).not.toContain('matchRate')
  })

  it('släpper blob-URL:en efter nedladdning', () => {
    expect(ned).toContain('revokeObjectURL')
  })
})
