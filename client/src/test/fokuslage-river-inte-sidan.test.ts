/**
 * Fokusläget får inte riva normalvyn. (PB-B, 2026-08-22)
 *
 * Bakgrunden är inte en bugg utan ett kopierat mönster. `PageFocusShell`
 * rekommenderade i sin egen docstring:
 *
 *   if (isFocusMode) {
 *     return <PageFocusShell …><FocusNågotWizard /></PageFocusShell>
 *   }
 *   // normalvy nedan — orörd
 *
 * Normalvyn är inte orörd. En tidig `return` avmonterar den, och allt
 * tillstånd som bodde där försvinner — textfält, halvifyllda formulär, vald
 * flik. Växeln sitter i toppnaven och i Lugnare läge-panelen, alltså nåbar
 * mitt i ett halvskrivet personligt brev, och funktionen finns för den som
 * behöver göra en sak i taget. Att just hon tappar sitt arbete när hon ber om
 * en lugnare vy är motsatsen till vad fokusläget är till för.
 *
 * Buggen lagades en sida i taget FEM gånger — intervjusimulatorn
 * (b93be382), lönesidan (00d8be26), Karriär, Kompetensanalysen och
 * Personligt varumärke — innan någon läste var mönstret kom ifrån.
 *
 * Rätt mönster är `FokusVaxel`, som håller normalvyn monterad bakom
 * `display: none`.
 *
 * TAKET är fryst och ska SÄNKAS, aldrig höjas. Varje rad i listan nedan är en
 * sida där användaren fortfarande kan tappa arbete. Lägg inte till nya.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SIDOR = join(__dirname, '..', 'pages')

/**
 * Sidor som ännu inte konverterats.
 *
 * Education.tsx stod här till 2026-08-22 med skälet "monolitisk med flera
 * tidiga returer". Det stämde inte: filen hade EN tidig return och var redan
 * delad i Education() + EducationInner() — alltså den billigaste posten i
 * listan, inte en av de svåra. Ett felaktigt skäl höll den kvar i månader.
 * Kontrollera skälet mot filen innan du låter en post ligga kvar.
 *
 * Var och en har ett skäl. De fyra första kräver att en människa läser dem:
 * guiden tar props som kan komma ur sidans tillstånd, eller sidan är
 * monolitisk med flera tidiga returer. De tre sista förlorar ingenting —
 * de är läsvyer utan inmatning — men står kvar i listan för att de använder
 * samma mönster och ska bort när någon ändå är i filen.
 */
const KVAR: Record<string, string> = {
  'CoverLetterPage.tsx': 'guiden tar onComplete/onSkip/onBack — kräver läsning',
  'CVPage.tsx': 'guiden tar inga props alls — kräver läsning',
  'Settings.tsx': 'guiden tar annat än onExit — kräver läsning',
  'Help.tsx': 'monolitisk; en radkommentar med /dashboard/* stympade tidigare vaktens läsning av just den här filen',
  'InterviewSimulator.tsx': 'monolitisk, 1843 rader — har utkastlager men förlorar ändå fältinnehåll',
  'JobSearch.tsx': 'monolitisk, 19 useState',
  'Network.tsx': 'monolitisk — hela sidan ligger i en komponent',
  'Profile.tsx': 'monolitisk; renderar ProfileHeader och formulär som håller inmatning',
  'Spontaneous.tsx': 'monolitisk; SearchTab håller sökfält och urval',
  'Wellness.tsx': 'monolitisk, guiden ligger inuti en samtyckesgrind',
  'sta/StaParticipant.tsx': 'STA-modulen är avaktiverad och monteras inte (MODULES.STA)',
}

const TAK = Object.keys(KVAR).length

function tsxFiler(dir: string, ut: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== '__tests__') tsxFiler(p, ut) }
    else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) ut.push(p)
  }
  return ut
}

/** Kommentarsfri kod — docstringar nämner mönstret de tar bort. */
const kod = (p: string) =>
  readFileSync(p, 'utf-8')
    // Radkommentarer FÖRST: en rad som "// … /dashboard/*, som App.tsx"
    // innehåller ett `/*` som aldrig stängs, och blockregexen nedan skulle
    // då sluka allt fram till nästa `*/` längre ner i filen. I Help.tsx
    // försvann 1 286 tecken inklusive hela fokusgrenen, och vakten läste en
    // fil som såg ren ut.
    .replace(/(?<!:)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

function sidorMedTidigReturn(): string[] {
  return tsxFiler(SIDOR)
    .filter(p => /if\s*\(\s*isFocusMode\s*\)\s*\{?\s*return/.test(kod(p)))
    .map(p => p.slice(SIDOR.length + 1).replace(/\\/g, '/'))
    .sort()
}

describe('Fokusläget river inte normalvyn', () => {
  it('ingen NY sida använder det trädrivande mönstret', () => {
    const funna = sidorMedTidigReturn()
    const nya = funna.filter(f => !(f in KVAR))
    expect(
      nya,
      nya.length
        ? `Nya sidor med \`if (isFocusMode) return …\`: ${nya.join(', ')}.\n` +
          'Det avmonterar normalvyn och raderar allt användaren fyllt i.\n' +
          'Använd `FokusVaxel` i stället — se client/src/components/focus/shell/FokusVaxel.tsx.'
        : undefined
    ).toEqual([])
  })

  it('taket sänks, aldrig höjs', () => {
    const funna = sidorMedTidigReturn()
    expect(
      funna.length,
      `${funna.length} sidor kvar med det gamla mönstret (tak ${TAK}). ` +
      (funna.length < TAK
        ? `Sänk TAK till ${funna.length} genom att ta bort de konverterade raderna ur KVAR.`
        : 'Höj inte taket — konvertera sidan i stället.')
    ).toBeLessThanOrEqual(TAK)
  })

  it('listan beskriver verkligheten — inga rader för redan konverterade sidor', () => {
    /*
      En allowlist som räknar upp sidor som inte längre är trasiga döljer hur
      mycket som återstår, och gör taket falskt högt.
    */
    const funna = new Set(sidorMedTidigReturn())
    const foraldrade = Object.keys(KVAR).filter(f => !funna.has(f))
    expect(foraldrade, `Redan konverterade — ta bort ur KVAR: ${foraldrade.join(', ')}`).toEqual([])
  })

  it('varje kvarvarande sida har ett skäl, inte bara ett filnamn', () => {
    for (const [fil, skal] of Object.entries(KVAR)) {
      expect(skal.length, `${fil} saknar skäl`).toBeGreaterThan(10)
    }
  })

  it('FokusVaxel håller normalvyn monterad', () => {
    const v = kod(join(__dirname, '..', 'components', 'focus', 'shell', 'FokusVaxel.tsx'))
    expect(v).toContain("style={isFocusMode ? { display: 'none' } : undefined}")
    expect(v).not.toMatch(/if\s*\(\s*isFocusMode\s*\)\s*\{?\s*return/)
  })

  it('PageFocusShells docstring rekommenderar inte längre mönstret', () => {
    /*
      Källan till alla kopior. Docstringen sa "normalvy nedan — orörd" bredvid
      en `return` som avmonterade den.
    */
    const rå = readFileSync(
      join(__dirname, '..', 'components', 'focus', 'shell', 'PageFocusShell.tsx'), 'utf-8'
    )
    const docstring = rå.slice(0, rå.indexOf('*/'))

    // Inte `not.toContain('normalvy nedan — orörd')` — den rättade
    // docstringen CITERAR det gamla exemplet för att förklara vad som var
    // fel, så vakten skulle fällas av själva rättelsen. Invariantet är i
    // stället ordningen: det rätta mönstret ska stå FÖRE det felaktiga, och
    // det felaktiga ska vara märkt som fel.
    expect(docstring).toContain('FokusVaxel')
    const rattIndex = docstring.indexOf('FokusVaxel')
    const felIndex = docstring.indexOf('if (isFocusMode)')
    if (felIndex !== -1) {
      expect(
        rattIndex,
        'Docstringen visar `if (isFocusMode) return` innan den nämner FokusVaxel — då är det den första läsaren kopierar.'
      ).toBeLessThan(felIndex)
      expect(docstring).toMatch(/INTE orörd|var fel|ANVÄND INTE/)
    }
  })
})
