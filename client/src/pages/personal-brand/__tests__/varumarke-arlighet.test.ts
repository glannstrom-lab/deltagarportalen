/**
 * Vakter för Personligt varumärke efter genomgången 2026-08-21.
 *
 * De rena funktionerna prövas mot riktiga anrop — de fyra flikarna hade
 * tillsammans 2 502 rader och noll egna tester. Resten är källkodsvakter,
 * eftersom felen sitter i ETT VÄRDE som inte går in i en kolumn, i ett löfte
 * en knapp inte kan hålla, i tillstånd som bara syns för seende, och i
 * `catch` som inte säger något. Ett renderingstest mot tomma mockar hade gått
 * grönt genom hela historien.
 *
 * Vakterna läser KOMMENTARSFRI källkod, av samma skäl som
 * `kompetensanalys-arlighet.test.ts`: docstringarna nämner felen de tog bort.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { manadTillDatum, datumTillManad, visaPeriod } from '../portfolioDatum'
import { antalIkryssade, antalFragor, harBorjat, AUDIT_FRAGOR } from '../auditFragor'
import { SYNLIGHETSSATT, ANTAL_IDEER } from '../synlighetData'

const KLIENT = join(__dirname, '..', '..', '..', '..')

const kod = (rel: string) =>
  readFileSync(join(KLIENT, 'src', rel), 'utf-8')
    // Radkommentarer FÖRST: en rad som "// … /dashboard/*, som App.tsx"
    // innehåller ett `/*` som aldrig stängs, och blockregexen nedan skulle
    // då sluka allt fram till nästa `*/` längre ner i filen. I Help.tsx
    // försvann 1 286 tecken inklusive hela fokusgrenen, och vakten läste en
    // fil som såg ren ut.
    .replace(/(?<!:)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

// ---------------------------------------------------------------------------
// Datumet som gjorde hela posten osparbar
// ---------------------------------------------------------------------------
describe('portfolioDatum', () => {
  it('gör om månadsvärdet till ett giltigt datum', () => {
    /*
      `<input type="month">` ger "2026-03". Kolumnen är `date`, och
      pg_input_is_valid('2026-03','date') är false — mätt mot prod. Inserten
      svarade 400, felet sväljdes, formuläret stängdes och posten var borta.
    */
    expect(manadTillDatum('2026-03')).toBe('2026-03-01')
  })

  it('släpper igenom ett fullständigt datum orört', () => {
    expect(manadTillDatum('2026-03-17')).toBe('2026-03-17')
  })

  it('ger undefined för tomt i stället för tom sträng', () => {
    // En tom sträng mot en `date`-kolumn ger också 400.
    expect(manadTillDatum('')).toBeUndefined()
    expect(manadTillDatum('   ')).toBeUndefined()
  })

  it('ger undefined för skräp i stället för att skicka det vidare', () => {
    expect(manadTillDatum('mars')).toBeUndefined()
    expect(manadTillDatum('2026')).toBeUndefined()
  })

  it('tar tillbaka datumet till formulärets form', () => {
    expect(datumTillManad('2026-03-01')).toBe('2026-03')
    expect(datumTillManad(null)).toBe('')
    expect(datumTillManad(undefined)).toBe('')
  })

  it('skriver perioden läsbart i stället för rått', () => {
    // Kortet visade tidigare "2026-03-01 - 2026-06-01".
    const p = visaPeriod('2026-03-01', '2026-06-01', 'sv-SE')
    expect(p).toContain('2026')
    expect(p).not.toContain('-01')
    expect(p).toMatch(/–/)
  })

  it('klarar bara startdatum, och skräp utan att kasta', () => {
    expect(visaPeriod('2026-03-01', null, 'sv-SE')).toContain('2026')
    expect(visaPeriod('inte-ett-datum', null, 'sv-SE')).toBe('')
    expect(visaPeriod(null, null)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Räkningen som ersatte procenten
// ---------------------------------------------------------------------------
describe('auditFragor', () => {
  it('räknar antal, inte procent', () => {
    const svar = { 'linkedin-profile': true, 'linkedin-photo': true, 'google-search': false }
    expect(antalIkryssade(svar)).toBe(2)
    expect(antalIkryssade(svar, 'online')).toBe(2)
    expect(antalIkryssade(svar, 'network')).toBe(0)
  })

  it('har sexton frågor fördelade på fyra kategorier', () => {
    expect(antalFragor()).toBe(16)
    expect(AUDIT_FRAGOR.every(f => ['online', 'content', 'network', 'consistency'].includes(f.category))).toBe(true)
  })

  it('räknar inte en i- och urkryssad ruta som påbörjad', () => {
    /*
      `toggleAnswer` lämnar kvar `false`-poster, så
      `Object.keys(answers).length > 0` var sant för någon som kryssat i och
      ur EN ruta — och poängkortet slog upp med "0 % 🚀 Behöver arbete".
    */
    expect(harBorjat({ 'linkedin-photo': false })).toBe(false)
    expect(harBorjat({})).toBe(false)
    expect(harBorjat({ 'linkedin-photo': false, 'mentors': true })).toBe(true)
  })

  it('har unika id:n', () => {
    const idn = AUDIT_FRAGOR.map(f => f.id)
    expect(new Set(idn).size).toBe(idn.length)
  })
})

describe('synlighetData', () => {
  it('har unika id:n och lika många idéer som i18n bär', () => {
    const idn = SYNLIGHETSSATT.map(s => s.id)
    expect(new Set(idn).size).toBe(idn.length)
    expect(ANTAL_IDEER).toBe(12)
  })

  it('bär ingen påverkansbedömning', () => {
    /*
      Varje strategi hade `impact: 'low'|'medium'|'high'`, renderat som
      faktaetiketten "Hög påverkan". Portalen talade om för en arbetssökande
      att poddar har hög påverkan på hennes chans att få jobb — en gissning
      som såg ut som statistik.
    */
    const rader = JSON.stringify(SYNLIGHETSSATT)
    expect(rader).not.toContain('impact')
    expect(rader).not.toContain('difficulty')
  })
})

// ---------------------------------------------------------------------------
// Källkodsvakter
// ---------------------------------------------------------------------------
describe('Fokusläget river inte det ifyllda', () => {
  const sida = kod('pages/PersonalBrand.tsx')

  it('renderar båda grenarna och döljer den ena', () => {
    expect(sida).not.toMatch(/if\s*\(\s*isFocusMode\s*\)\s*\{?\s*return/)
    expect(sida).toContain("style={isFocusMode ? { display: 'none' } : undefined}")
  })

  it('slår upp en i18n-nyckel som finns', () => {
    // `t('personalBrand.title')` fanns inte — i18n har `pageTitle`.
    expect(sida).not.toContain("t('personalBrand.title'")
  })

  it('ger varje flik ett eget rådgivarråd', () => {
    // `index={0}` fast gav samma mening på alla fyra flikar.
    expect(sida).not.toContain('<RadgivarTips pathname="/personal-brand" index={0} />')
    expect(sida).toContain('RAD_INDEX[pathname]')
  })

  it('bär ingen permanent Ny!-badge', () => {
    expect(sida).not.toContain('newBadge')
  })
})

describe('Fokusguiden slänger inte det användaren skrivit', () => {
  const guide = kod('components/focus/pages/FocusPersonalBrandWizard.tsx')

  it('sparar texten någonstans', () => {
    /*
      `handleNext` var `async` utan `await` och filen innehöll varken `Api.`,
      `supabase` eller `localStorage`. Tre skrivsteg om sig själv kastades i
      samma sekund användaren tryckte "Klar".
    */
    expect(guide).toContain('personalBrandApi.addPitch')
  })

  it('visar texten på slutsteget med en kopieringsknapp', () => {
    // Slutsteget sa "Du kan kopiera och använda din 'om mig'" utan att
    // någonsin skriva ut den.
    expect(guide).toContain('fardigText')
    expect(guide).toContain('navigator.clipboard.writeText')
  })

  it('stänger inte guiden när sparningen misslyckas', () => {
    const block = guide.slice(guide.indexOf('const handleNext'))
    const forstaOnExit = block.indexOf('onExit()', block.indexOf('mutateAsync'))
    const catchIndex = block.indexOf('catch', block.indexOf('mutateAsync'))
    expect(forstaOnExit).toBeGreaterThan(-1)
    expect(catchIndex).toBeGreaterThan(forstaOnExit)
  })
})

describe('Varumärkeskollen betygsätter inte personen', () => {
  const flik = kod('pages/personal-brand/BrandAuditTab.tsx')

  it('visar ingen procent', () => {
    expect(flik).not.toMatch(/\{\s*totalScore\s*\}\s*%/)
    expect(flik).not.toContain('getScoreColor')
    expect(flik).not.toContain('getScoreLabel')
    expect(flik).not.toContain('getScoreEmoji')
  })

  it('har ingen poängring med strokeDashoffset', () => {
    expect(flik).not.toContain('strokeDashoffset')
  })

  it('bär inga emoji som betygsmarkörer', () => {
    for (const e of ['🌟', '👍', '💪', '🚀']) expect(flik).not.toContain(e)
  })

  it('ger de sexton kryssrutorna ett tillstånd skärmläsaren kan höra', () => {
    expect(flik).toContain('aria-pressed={ikryssad}')
  })

  it('har ingen Link inuti en button', () => {
    /*
      Åtgärdslänken låg inne i frågeknappen — interaktivt element i
      interaktivt element, med `stopPropagation` som symptom.
    */
    const knappStart = flik.indexOf('onClick={() => toggleAnswer(')
    const knappSlut = flik.indexOf('</button>', knappStart)
    expect(knappStart).toBeGreaterThan(-1)
    expect(flik.slice(knappStart, knappSlut)).not.toContain('<Link')
    expect(flik).not.toContain('stopPropagation')
  })

  it('skriver tomt till molnet när listan nollställs', () => {
    /*
      Knappen körde bara `setAnswers({})`, och spar-effekten började med
      `if (… length === 0) return` — molnraden behöll de gamla svaren och
      kryssen kom tillbaka vid nästa laddning.
    */
    const block = flik.slice(flik.indexOf('const aterstall'), flik.indexOf('const forslag'))
    expect(block.length).toBeGreaterThan(100)
    expect(block).toContain('await spara({})')
  })

  it('skriver historikraden vid en uttrycklig handling, inte i debouncen', () => {
    const debounce = flik.slice(flik.indexOf('setTimeout'), flik.indexOf('const toggleAnswer'))
    expect(debounce).not.toContain('personalBrandAuditsApi')
    expect(flik).toContain('const sparaGenomgang')
  })

  it('visar inga förslag innan användaren svarat något', () => {
    const block = flik.slice(flik.indexOf('const forslag'), flik.indexOf('if (isLoading)'))
    expect(block).toContain('borjat ?')
  })
})

describe('Arbetsprover lovar inget som inte finns', () => {
  const flik = kod('pages/personal-brand/PortfolioTab.tsx')

  it('har ingen delningsknapp som kopierar den privata adressen', () => {
    expect(flik).not.toContain('copyShareLink')
    expect(flik).not.toContain('window.location.href')
  })

  it('normaliserar datumen innan de skickas till en date-kolumn', () => {
    expect(flik).toContain('manadTillDatum(formData.start_date)')
    expect(flik).toContain('manadTillDatum(formData.end_date)')
  })

  it('saneras varje url innan den blir en länk', () => {
    // Inte bara att funktionen NÄMNS i filen — den används även i
    // handleSubmit, så en vakt på förekomst gick grön när kortet slutade
    // sanera. Det är värdet som blir ett href som måste vara sanerat, och
    // det värdet räknas ut på en rad man kan peka på.
    expect(flik).toContain('const lank = sanitizeHref(item.url)')
    expect(flik).toContain('href={lank}')
    expect(flik).not.toMatch(/href=\{item\.url\}/)
  })

  it('ger alla tre ikonknapparna ett tillgängligt namn', () => {
    const namn = flik.match(/aria-label=\{t\('personalBrand\.portfolio\.(feature|edit|delete)Aria'/g) ?? []
    expect(namn.length).toBe(3)
  })

  it('döljer inte knapparna för tangentbordsfokus', () => {
    expect(flik).not.toMatch(/opacity-0 group-hover:opacity-100(?! focus-within)/)
    expect(flik).toContain('focus-within:opacity-100')
  })

  it('använder EmptyState och ConfirmDialog i stället för handrullat och confirm()', () => {
    expect(flik).toContain('<EmptyState')
    expect(flik).toContain('useConfirmDialog')
    expect(flik).not.toMatch(/(?<![.\w])confirm\s*\(\s*['"]/)
  })

  it('har ingen kvarglömd viewMode', () => {
    expect(flik).not.toContain('viewMode')
  })
})

describe('Synlighet visar en invit i stället för en nolla', () => {
  const flik = kod('pages/personal-brand/VisibilityTab.tsx')

  it('renderar ingen X/Y-räknare i hjälteposition', () => {
    expect(flik).not.toMatch(/\{completedCount\}\/\{/)
    expect(flik).toContain('introEmpty')
  })

  it('bär statusen i text, inte bara i färg och opacitet', () => {
    expect(flik).toContain('personalBrand.visibility.status.')
    // `opacity-50` var `skipped`-lägets enda bärare och sänkte kontrasten
    // i hela kortet till 2,34:1.
    expect(flik).not.toContain("'opacity-50'")
  })

  it('går att ta bort ett planerat inlägg', () => {
    /*
      `deleteContentItem` fanns i servicen med noll anropare — kommentaren i
      koden sa det rakt ut. Posterna gick att skapa men aldrig städa bort.
    */
    expect(flik).toContain('personalBrandApi.deleteContentItem')
  })

  it('går att bläddra mellan veckor', () => {
    // Vyn satt fast på innevarande vecka, så ett inlägg planerat till nästa
    // vecka försvann ur vyn i samma sekund det sparades.
    expect(flik).toContain('veckoOffset')
  })

  it('är översatt', () => {
    // Filen importerade inte ens useTranslation — ~50 svenska strängar mitt
    // på en översatt sida.
    expect(flik).toContain('useTranslation')
    expect(flik).not.toContain('Strategier för synlighet')
  })
})

describe('Pitchen försvinner inte tyst', () => {
  const flik = kod('pages/personal-brand/PitchTab.tsx')

  it('skiljer laddning från tomhet', () => {
    // EmptyState renderades så snart `!selectedPitch && !isEditing`, alltså
    // under hela första hämtningen.
    expect(flik).toContain('{isLoading && !selectedPitch && !isEditing && (')
    expect(flik).toContain('!isLoading && !laddningsfel && !selectedPitch && !isEditing')
  })

  it('rapporterar när sparningen faller', () => {
    const block = flik.slice(flik.indexOf('const handleSave'), flik.indexOf('const handleDelete'))
    expect(block).toContain('showToast.error')
  })

  it('renderar ingen naken nolla för övningsräknaren', () => {
    /*
      `{x && x > 0 && …}` med x = 0 renderar SIFFRAN 0 — varje ny pitch fick
      en lös nolla under typmärket.
    */
    expect(flik).not.toMatch(/\{pitch\.practice_count && pitch\.practice_count > 0/)
    expect(flik).not.toMatch(/\{selectedPitch\.practice_count && selectedPitch\.practice_count > 0/)
  })

  it('väntar in urklippet innan bocken visas', () => {
    const block = flik.slice(flik.indexOf('const copyToClipboard'), flik.indexOf('const uppskattadeSekunder'))
    expect(block).toContain('await navigator.clipboard.writeText')
    expect(block).toContain('catch')
  })

  it('blockerar sparning av en mall full av platshållare', () => {
    expect(flik).toContain('harPlatshallare')
    expect(flik).toContain('disabled={!formData.title?.trim() || !formData.content?.trim() || harPlatshallare || sparar}')
  })

  it('formaterar datum efter språk', () => {
    expect(flik).not.toContain("toLocaleDateString('sv-SE')")
  })
})

describe('Datalagret säger ifrån', () => {
  const service = kod('services/cloudStorage.ts')

  it('upsertar inte mot en kolumn utan unikt index', () => {
    /*
      `.upsert(…, { onConflict: 'user_id' })` mot `personal_brand_audit`.
      Prod har bara `personal_brand_audit_pkey` på `id` — verifierat 2026-08-21
      — så Postgres svarade 42P10 varje gång och felet sväljdes. Sidan sa
      "Dina svar sparas automatiskt i molnet".
    */
    const block = service.slice(service.indexOf('async saveAuditAnswers'), service.indexOf('async getAuditHistory'))
    expect(block.length).toBeGreaterThan(200)
    expect(block).not.toContain('upsert')
    expect(block).toContain('kastaLagringsFel')
  })

  it('returnerar inte påhittad framgång ur localStorage vid skrivfel', () => {
    for (const fn of ['async addPortfolioItem', 'async addPitch']) {
      const start = service.indexOf(fn)
      expect(start).toBeGreaterThan(-1)
      // Avgränsa till FUNKTIONEN. En slice på ett fast antal tecken rann in
      // i nästa funktion, som har en legitim utloggad-gren med localStorage.
      const slut = service.indexOf('\n  async ', start + 10)
      const block = service.slice(start, slut)
      expect(block.length).toBeGreaterThan(200)
      expect(block).toContain('kastaLagringsFel')
      // Fallbacken skrev en kopia som läsvägen aldrig hämtade.
      expect(block.slice(block.indexOf('if (error)'))).not.toContain('localStorage.setItem')
    }
  })

  it('har ett fel anroparen kan visa', () => {
    expect(service).toContain('export class LagringsFel')
  })
})
