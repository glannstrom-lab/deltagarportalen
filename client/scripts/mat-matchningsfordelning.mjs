/**
 * Mäter matchningsprocentens fördelning i intresseguiden.
 *
 *   node client/scripts/mat-matchningsfordelning.mjs
 *
 * Varför skriptet finns: granskningen 2026-08-21 körde formeln mot alla 142
 * yrken och visade att den som svarade 3 (mitten) på samtliga 34 frågor fick
 * 68–80 % mot varje yrke, och att alla 142 passerade "lämplig"-tröskeln 65.
 * Siffran mätte mest att formeln hade golv i varje delpoäng. Efter omläggningen
 * ska en neutral profil landa mitt på skalan och spreta, inte klumpa ihop sig
 * högt upp.
 *
 * Kör det här efter varje ändring i `calculateJobMatches` och dess delpoäng.
 * Att titta på koden räcker inte — vikterna interagerar.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const HAR = dirname(fileURLToPath(import.meta.url))
const KALLA = join(HAR, '..', 'src', 'services', 'interestGuideData.ts')

// Transpilera TS → JS i minnet. Filen har inga runtime-importer.
const js = ts.transpileModule(readFileSync(KALLA, 'utf-8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText

const dir = mkdtempSync(join(tmpdir(), 'igmatch-'))
const fil = join(dir, 'data.mjs')
writeFileSync(fil, js)
const { allQuestions, calculateUserProfile, calculateJobMatches, occupations } =
  await import(pathToFileURL(fil).href)

/** Alla frågor besvarade med samma värde. */
const enhetligt = (v) => Object.fromEntries(allQuestions.map((q) => [q.id, v]))

function fordelning(svar) {
  const profil = calculateUserProfile(svar)
  const tal = calculateJobMatches(profil).map((m) => m.matchPercentage).sort((a, b) => a - b)
  const p = (q) => tal[Math.floor((tal.length - 1) * q)]
  return {
    min: tal[0],
    p25: p(0.25),
    median: p(0.5),
    p75: p(0.75),
    max: tal[tal.length - 1],
    overTrosklen: tal.filter((x) => x >= 65).length,
    antal: tal.length,
  }
}

console.log(`${occupations.length} yrken, ${allQuestions.length} frågor\n`)
console.log('Svarsmönster        min  p25  med  p75  max   >=65 av ' + occupations.length)
for (const v of [1, 2, 3, 4, 5]) {
  const f = fordelning(enhetligt(v))
  console.log(
    `alla svar = ${v}       ` +
    `${String(f.min).padStart(4)} ${String(f.p25).padStart(4)} ${String(f.median).padStart(4)} ` +
    `${String(f.p75).padStart(4)} ${String(f.max).padStart(4)}   ${f.overTrosklen}`
  )
}

// Deterministisk pseudoslump — samma utfall varje körning.
let fro = 12345
const slump = () => ((fro = (fro * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const slumpade = []
for (let i = 0; i < 500; i++) {
  slumpade.push(fordelning(Object.fromEntries(allQuestions.map((q) => [q.id, 1 + Math.floor(slump() * 5)]))))
}
const toppar = slumpade.map((f) => f.max).sort((a, b) => a - b)
const medianer = slumpade.map((f) => f.median).sort((a, b) => a - b)
console.log(
  `\n500 slumpprofiler: bästa träff median ${toppar[250]} (min ${toppar[0]}, max ${toppar[499]}), ` +
  `listmedian ${medianer[250]}`
)
console.log(
  `Profiler där ALLA ${occupations.length} yrken passerar 65: ` +
  slumpade.filter((f) => f.overTrosklen === f.antal).length + ' av 500'
)
