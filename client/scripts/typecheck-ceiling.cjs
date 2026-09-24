#!/usr/bin/env node
/**
 * typecheck-ceiling — spärr uppåt på antalet strict-typfel.
 *
 * ## Varför ett tak och inte noll
 *
 * `npm run typecheck` (full `tsc -p tsconfig.app.json`) ger ~680 fel. De är
 * pre-existerande strict-skuld, inte nya regressioner — mest `noImplicitAny`
 * och `strictNullChecks` i äldre filer. Att kräva noll skulle betyda att
 * ingenting kan mergas förrän hela skulden är betald, vilket i praktiken
 * betyder att grinden stängs av.
 *
 * Ett fryst tak gör i stället tre saker:
 *   1. Stoppar nytillskott — lägger någon till ett typfel går bygget rött.
 *   2. Gör skulden mätbar och synlig i CI-loggen vid varje körning.
 *   3. Belönar avbetalning: går talet ner uppmanas man att sänka taket.
 *
 * `typecheck:critical` (som redan finns) fångar bara krasch-klassen. Den här
 * kompletterar den — den fångar allt övrigt och hindrar att det växer.
 *
 * ## Sänk taket när du betalar av
 *
 * Skriptet skriver ut exakt vilket tal som ska in i CEILING när det är för
 * högt. Sänk det i samma commit som avbetalningen.
 */

const { execSync } = require('node:child_process')
const path = require('node:path')
const { klassaTscUtdata } = require('./lib/tsc-utdata.cjs')

/**
 * Frozen 2026-07-27 (ROADMAP I2), sänkt 687 → 471 samma dag (I5, tre
 * rotorsaker: CV-mallarnas TemplateCVData, validation.ts asRecord,
 * type-only imports). Sänk aldrig utan att ha kört skriptet.
 */
// 469 → 468 (2026-08-04, UX19): trasig referens till borttagna useFocusTrap i
// useAccessibility-barrelns default-export — kastade ReferenceError vid import.
// 470 → 469 (2026-08-03, UX14): `Property 'toLowerCase' does not exist on type
// 'Skill'` var inte typskuld utan en skarp bugg — cv.skills är objekt i prod,
// så anropet kastade TypeError för alla 16 CV:n med ifyllda kompetenser.
// 463 → 460 (2026-08-18): `interview_sessions`-typerna i cloudStorage beskrev
// fyra kolumner som inte finns (`company_name`, `position`, `interview_date`,
// `notes`) och hade `[key: string]: unknown`, så inget insert-anrop kunde
// typkontrolleras. Tabellen stod tom i hela prod. Typerna följer nu schemat.
// 460 → 437 (2026-08-18): åtta onåbara filer under `components/jobs/` plus
// `types/jobs.ts` raderade (2 917 rader). De var aldrig monterade — JobCard,
// JobDetailModal, JobFilters, CRMTab, CultureTab, ApplicationsTab och
// JobMatchAnalyzer nåddes inte från main.tsx, och barreln `jobs/index.ts` var
// det som gjorde dem osynliga för en vanlig importsökning. De 23 typfelen
// försvann med filerna; ingen av dem satt i kod som kördes.
// 422 → 412 (2026-08-19): `components/interview/` arkiverad — InterviewPrep,
// MockInterviewSession och StarMethodGuide, 617 rader med noll importörer
// (nåbarhetsanalys från main.tsx, bekräftad med sökväg-grep). Sju av felen kom
// från att `calculateProgress()` blev async 2026-03-06 medan
// `InterviewPrep.tsx:23` fortsatte anropa den utan `await` — skuld som räknats
// i taket i fem månader, i kod ingen användare nått. Se
// archive/2026-08-doda-intervjukomponenter/README.md.
// 403 → 400 (2026-08-21, Karriär-genomgången): tre fel betalda. Två var
// riktiga buggar, inte typskuld — `calendarIntegration.ts` importerade
// `Milestone` som careerApi aldrig exporterat, och Career.tsx mappade en
// `badge`-sträng till en prop som är typad som `number` och som ingen
// renderar. Det tredje var badgens systerfält `description`.
// 400 → 390 (2026-08-21, Intresseguiden): tio fel betalda, bl.a. fyra
// TS2322 där saveToHistory tog Record<string, number> i stället för de
// riktiga profiltyperna, och en import av `Milestone` som inte finns.
// 357 → 356 (2026-09-02, nio-agenterspasset): ett fel betalt netto — tre nya
// (oanvänd @ts-expect-error i DropdownMenu, otypad CJS-import i i18n-grinden,
// mockad returtyp i ReportDraftDialog.test) lagades samma kväll, och
// unifiedProfileApi.ts fick rätt typ på skills (CB5).
// 337 → 28 (2026-09-22, städpasset): 85 dödkodsfiler raderade och 28 arkiverade
// (65 fel), 252 fel betalda i levande kod av en typskuldsagent — elva av dem
// var skarpa buggar (zod 4 har `.issues`, inte `.errors`; krisstödets
// jordningstekniker saknade `id` och visade fel steg; fokuslägets
// ansökningsöversikt läste fält som inte finns). De 28 kvar ligger ALLA i
// UTRED-dödkod som väntar på produktbeslut (energi C19, notiscenter H12,
// learning C4, FocusCV, useJobMatching, ShareJobDialog) — noll i levande kod.
// 28 → 16 (2026-09-24): nio UTRED-filer (3 318 rader) arkiverade till
// archive/2026-09-24-dodkod/ — EU-spårets klientsida (useLearning,
// learningService, interestPersonalization, afEnrichmentsApi; spåret avslutat
// 2026-09-12) och fyra filer som bara "rörts" av KA2-cachenyckelsvepet
// (FocusCV, useJobMatching + interestJobMatching med test, useMoodRecommendations).
// De 16 kvar: notiscentret H12 (15) och ShareJobDialog C19 (1) — produktbeslut.
const CEILING = 16

const CLIENT_DIR = path.resolve(__dirname, '..')
// Överstyrs bara av testet som bevisar att grinden fäller på en trasig
// tsconfig (src/test/skript-typecheck-falskt-gront.test.ts).
const PROJEKT = process.env.TYPECHECK_PROJEKT || 'tsconfig.app.json'

function countErrors() {
  let output = ''
  try {
    // tsc returnerar exit != 0 när det finns fel — det är förväntat här,
    // så vi läser stdout ur felet i stället för att låta det kasta vidare.
    output = execSync(`npx tsc --noEmit -p "${PROJEKT}"`, {
      cwd: CLIENT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (err) {
    output = `${err.stdout || ''}${err.stderr || ''}`
  }

  const { filfel, globala } = klassaTscUtdata(output)
  return { count: filfel.length, globala, output }
}

const { count, globala, output } = countErrors()

// Ett globalt fel (utan fil) är en trasig konfiguration: tsc har då inte
// kontrollerat någonting. Räknades tidigare som "1 fel, under taket" och gav
// OK — se scripts/lib/tsc-utdata.cjs.
if (globala.length > 0) {
  console.error(
    'typecheck-ceiling: tsc rapporterade konfigurationsfel — ingen fil typkontrollerades:\n' +
    globala.map((g) => `  ${g.rad.trim()}`).join('\n')
  )
  process.exit(2)
}

// Skydd mot att grinden tystnar av fel skäl: rapporterar tsc noll fel OCH
// ingen utdata alls har den sannolikt inte körts. E7 visade att en
// felkonfigurerad `tsc --noEmit` blir en no-op som ser grön ut — en grind som
// inte kontrollerar något är värre än ingen grind.
if (count === 0 && output.trim() === '') {
  console.error(
    'typecheck-ceiling: tsc gav ingen utdata alls — kördes den verkligen?\n' +
    'Kontrollera att tsconfig.app.json finns och att npx tsc fungerar.'
  )
  process.exit(2)
}

if (count > CEILING) {
  console.error(
    `\nTYPFEL ÖVER TAKET: ${count} fel (tak ${CEILING}) — ${count - CEILING} nya.\n\n` +
    'Kör `npm run typecheck` för hela listan. Nya typfel ska åtgärdas, inte\n' +
    'höjas bort: taket är fryst för att skulden ska minska, inte växa.\n'
  )
  process.exit(1)
}

if (count < CEILING) {
  console.log(
    `OK — ${count} strict-typfel, under taket ${CEILING}.\n` +
    `  ${CEILING - count} fel betalda. Sänk CEILING i ` +
    `client/scripts/typecheck-ceiling.cjs till ${count} i samma commit.`
  )
  process.exit(0)
}

console.log(`OK — ${count} strict-typfel, exakt på taket ${CEILING}. Ingen ny skuld.`)
process.exit(0)
