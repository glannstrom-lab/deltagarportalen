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
const CEILING = 463

const CLIENT_DIR = path.resolve(__dirname, '..')

function countErrors() {
  let output = ''
  try {
    // tsc returnerar exit != 0 när det finns fel — det är förväntat här,
    // så vi läser stdout ur felet i stället för att låta det kasta vidare.
    output = execSync('npx tsc --noEmit -p tsconfig.app.json', {
      cwd: CLIENT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (err) {
    output = `${err.stdout || ''}${err.stderr || ''}`
  }

  const matches = output.match(/error TS\d+:/g)
  return { count: matches ? matches.length : 0, output }
}

const { count, output } = countErrors()

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
