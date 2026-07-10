#!/usr/bin/env node
/**
 * Rapport: hårdkodad svenska utanför t() (ROADMAP F2, 2026-07-10).
 *
 * Den befintliga i18n-leak-detectorn hittar oöversatta NYCKLAR i UI:t —
 * den kan per design inte se rå svenska som aldrig går genom i18next.
 * Det här skriptet är heuristiskt (å/ä/ö i strängliteraler) och därför
 * REPORT-ONLY — ingen baseline-gate, för många legitima undantag
 * (t()-fallbacks, labelSv-datafält, aria-kommentarer).
 *
 * Kör: node scripts/report-hardcoded-swedish.cjs [--top=20]
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src')
const SWEDISH = /[åäöÅÄÖ]/
// Strängliteral med svenskt tecken
const LITERAL = /(['"`])[^'"`\n]*[åäöÅÄÖ][^'"`\n]*\1/

const SKIP_DIRS = new Set(['i18n', 'test', '__tests__'])
const SKIP_FILE = /\.test\.|\.spec\.|\.d\.ts$/

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name))
    } else if (/\.(ts|tsx)$/.test(e.name) && !SKIP_FILE.test(e.name)) {
      yield path.join(dir, e.name)
    }
  }
}

const results = []
for (const file of walk(SRC)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  let count = 0
  let inBlockComment = false
  for (const raw of lines) {
    const line = raw.trim()
    if (inBlockComment) { if (line.includes('*/')) inBlockComment = false; continue }
    if (line.startsWith('//') || line.startsWith('*')) continue
    if (line.startsWith('/*') || line.startsWith('{/*')) { if (!line.includes('*/')) inBlockComment = true; continue }
    if (!SWEDISH.test(line) || !LITERAL.test(line)) continue
    // Legitima mönster: t()-fallback, labelSv/-En-datafält, console/logger, sv-SE-locale
    if (/\bt\(/.test(line)) continue
    if (/labelSv|labelEn|titleSv|descriptionSv|contentSv|headingSv/.test(line)) continue
    if (/console\.|Logger|logger\./.test(line)) continue
    if (/'sv-SE'|"sv-SE"/.test(line)) continue
    count++
  }
  if (count > 0) results.push({ file: path.relative(SRC, file), count })
}

results.sort((a, b) => b.count - a.count)
const top = Number((process.argv.find(a => a.startsWith('--top=')) || '--top=25').split('=')[1])
const total = results.reduce((a, r) => a + r.count, 0)

console.log(`Hårdkodade svenska strängar (heuristik): ${total} rader i ${results.length} filer\n`)
for (const r of results.slice(0, top)) {
  console.log(String(r.count).padStart(5) + '  ' + r.file)
}
if (results.length > top) console.log(`  ... och ${results.length - top} filer till`)
console.log('\nOBS: heuristik — verifiera manuellt. Konsulent-/adminvyer får ha svensk ton (DESIGN.md §2).')
