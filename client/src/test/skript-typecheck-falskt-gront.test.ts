/**
 * typecheck:ceiling och typecheck:critical gick gröna när tsc inte
 * kontrollerade någonting (2026-09-22).
 *
 * Båda räknade `error TSxxxx:` i utdatan. Ett KONFIGURATIONSFEL är också en
 * sådan rad — men det är ett globalt fel utan fil, och det betyder att tsc
 * inte typkontrollerat en enda fil:
 *
 *   error TS18003: No inputs were found in config file '…'   (fel `include`)
 *   error TS5058: The specified path does not exist: '…'     (fel cwd/sökväg)
 *
 * `typecheck:ceiling` räknade det som 1 fel under taket 28 och svarade
 * "OK — sänk taket till 1". `typecheck:critical` letar bara efter TS2304/
 * TS2307 och svarade "OK: no crash-class TypeScript errors". Samma familj som
 * E7-fällan (`tsc --noEmit` utan -p är en no-op) — en grind som inte
 * kontrollerar något ser likadan ut som en grön.
 *
 * Testet kör de riktiga skripten mot riktig tsc med en trasig tsconfig.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const SKRIPT = resolve(__dirname, '../../scripts')
let katalog = ''
let tomConfig = ''

beforeAll(() => {
  katalog = mkdtempSync(join(tmpdir(), 'tsc-falskt-gront-'))
  tomConfig = join(katalog, 'tsconfig.json')
  writeFileSync(tomConfig, JSON.stringify({ compilerOptions: { strict: true }, include: ['finns-inte'] }))
})

afterAll(() => {
  rmSync(katalog, { recursive: true, force: true })
})

function kor(skript: string, projekt: string) {
  return spawnSync(process.execPath, [join(SKRIPT, skript)], {
    encoding: 'utf8',
    env: { ...process.env, TYPECHECK_PROJEKT: projekt },
    timeout: 120_000,
  })
}

describe.each(['typecheck-ceiling.cjs', 'typecheck-critical.cjs'])('%s', (skript) => {
  it('fäller när tsconfig inte hittar några filer (TS18003)', () => {
    const r = kor(skript, tomConfig)
    // Exitkod 2 OCH felkoden i utdatan — ett syntaxfel i skriptet ger också
    // en icke-noll exit, och det ska inte räknas som att grinden fungerar.
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(2)
    expect(r.stderr).toContain('TS18003')
  }, 130_000)

  it('fäller när tsconfig inte finns (TS5058)', () => {
    const r = kor(skript, join(katalog, 'finns-inte.json'))
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(2)
    expect(r.stderr).toContain('TS5058')
  }, 130_000)
})

describe('klassningen av tsc-utdata', () => {
  const { klassaTscUtdata } = require(resolve(SKRIPT, 'lib/tsc-utdata.cjs')) as {
    klassaTscUtdata: (s: string) => { filfel: Array<{ kod: string }>; globala: Array<{ kod: string }> }
  }

  it('skiljer filfel från globala fel, i båda utdataformaten', () => {
    const utdata = [
      "src/a.ts(3,7): error TS2304: Cannot find name 'x'.",
      "src/b.tsx:10:2 - error TS2322: Type 'string' is not assignable to type 'number'.",
      "error TS18003: No inputs were found in config file 'tsconfig.json'.",
      '  fortsättningsrad utan felkod',
    ].join('\n')
    const { filfel, globala } = klassaTscUtdata(utdata)
    expect(filfel.map((f) => f.kod)).toEqual(['TS2304', 'TS2322'])
    expect(globala.map((f) => f.kod)).toEqual(['TS18003'])
  })

  it('CRLF-utdata från Windows klassas likadant', () => {
    const { filfel, globala } = klassaTscUtdata("src/a.ts(1,1): error TS2307: Cannot find module 'y'.\r\nerror TS5058: x\r\n")
    expect(filfel).toHaveLength(1)
    expect(globala).toHaveLength(1)
  })
})
