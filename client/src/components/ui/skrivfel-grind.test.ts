/**
 * Grind: ingen skrivning i deltagarens vyer får misslyckas tyst (RD26,
 * rollspelet 2026-09-27).
 *
 * Varför: Anna skrev till sin konsulent och fältet tömdes — meddelandet kom
 * aldrig fram. `handleSend` hade `try/finally` utan `catch`, och
 * `handleSendMessage` hade en `catch` som bara gjorde `console.warn`. Profilens
 * "Spara ändringar" gav 500 med samma mönster. Den som redan är orolig tror då
 * att det är skickat.
 *
 * Grinden läser koden med TypeScripts parser och letar efter `try`-block som
 * innehåller en skrivning (insert/update/skicka/spara/anmäl …) och där felet
 * - saknar `catch` (bara `finally`), eller
 * - fångas av en `catch` som är tom eller bara loggar till konsolen.
 *
 * Två nivåer:
 *   1. SKRIVVAGAR — deltagarens huvudsakliga skrivvägar. Noll tillåtna.
 *   2. Alla deltagarens sidor och komponenter — ett fryst TAK. En ny tyst
 *      catch höjer talet och fäller grinden. Sänk taket när du lagar en; höj
 *      det aldrig för att få grönt.
 *
 * Rätt mönster: `useSkrivning` + `<SkrivFel>` i components/ui. Är tystnaden
 * verkligen avsiktlig (t.ex. en bästa-försök-logg), skriv `tyst-med-flit:` och
 * skälet i catch-blocket.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import ts from 'typescript'

const ROT = join(__dirname, '..', '..')

/** Deltagarens skrivvägar som rollspelet 2026-09-27 prövade. Noll tysta fel. */
const SKRIVVAGAR = [
  'pages/MyConsultant.tsx',
  'pages/Settings.tsx',
  'pages/MinVecka.tsx',
  'components/minvecka/FranvaroAnmalan.tsx',
  'components/minvecka/FragaOmPasset.tsx',
  'components/minvecka/ForklaraFranvaro.tsx',
  'components/minvecka/MoteKort.tsx',
  'components/minvecka/NarvaroIntyg.tsx',
  'components/diary/JournalTab.tsx',
  'components/cv/SaveIndicator.tsx',
  'components/settings/SprakVal.tsx',
  'components/ui/useSkrivning.ts',
]

/**
 * Tyst sväljande catch-block i skrivvägar över alla deltagarens sidor och
 * komponenter. Mätt 2026-09-27 efter RD26: 18 (grinden skriver ut talet om det
 * ändras. Sänk när du lagar; höj aldrig.
 */
const TAK = 18

const SKRIVORD =
  /^(insert|update|upsert|delete|rpc|remove|send\w*|save\w*|create\w*|skicka\w*|spara\w*|anmal\w*|angra|forklara|updateProfile|updateCV|onSend\w*|onSave\w*)$/i

function arUndantagen(fil: string): boolean {
  const r = fil.split(sep).join('/')
  return (
    /(^|\/)consultant\//.test(r) ||
    /(^|\/)layout\//.test(r) ||
    /pages\/Consultant\.tsx$/.test(r) ||
    /\.test\.tsx?$/.test(r)
  )
}

function filer(katalog: string): string[] {
  if (!existsSync(katalog)) return []
  const ut: string[] = []
  for (const e of readdirSync(katalog, { withFileTypes: true })) {
    const p = join(katalog, e.name)
    if (e.isDirectory()) ut.push(...filer(p))
    else if (/\.tsx?$/.test(e.name)) ut.push(p)
  }
  return ut
}

/** Innehåller blocket ett anrop som skriver? localStorage/sessionStorage räknas inte. */
function harSkrivning(nod: ts.Node, kalla: ts.SourceFile): boolean {
  let hittad = false
  const besok = (n: ts.Node) => {
    if (hittad) return
    if (ts.isCallExpression(n)) {
      const c = n.expression
      let namn: string | null = null
      let mottagare = ''
      if (ts.isPropertyAccessExpression(c)) {
        namn = c.name.text
        mottagare = c.expression.getText(kalla)
      } else if (ts.isIdentifier(c)) {
        namn = c.text
      }
      if (namn && SKRIVORD.test(namn) && !/(local|session)Storage/.test(mottagare)) {
        hittad = true
        return
      }
    }
    ts.forEachChild(n, besok)
  }
  besok(nod)
  return hittad
}

/** Tom catch, eller en som bara loggar till konsolen. */
function svaljer(katch: ts.CatchClause, kalla: ts.SourceFile): boolean {
  if (/tyst-med-flit:/.test(katch.getFullText(kalla))) return false
  return katch.block.statements.every(
    (s) =>
      ts.isExpressionStatement(s) &&
      ts.isCallExpression(s.expression) &&
      /^console\./.test(s.expression.expression.getText(kalla)),
  )
}

export interface TystFel {
  rad: number
  slag: 'tyst catch' | 'try/finally utan catch'
}

export function hittaTystaFel(kod: string, filnamn = 'x.tsx'): TystFel[] {
  const kalla = ts.createSourceFile(filnamn, kod, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const fynd: TystFel[] = []
  const besok = (n: ts.Node) => {
    if (ts.isTryStatement(n) && harSkrivning(n.tryBlock, kalla)) {
      const rad = kalla.getLineAndCharacterOfPosition(n.getStart(kalla)).line + 1
      if (!n.catchClause) fynd.push({ rad, slag: 'try/finally utan catch' })
      else if (svaljer(n.catchClause, kalla)) fynd.push({ rad, slag: 'tyst catch' })
    }
    ts.forEachChild(n, besok)
  }
  besok(kalla)
  return fynd
}

describe('RD26: inga tysta fel i deltagarens skrivvägar', () => {
  it('skrivvägarna har noll tysta fel', () => {
    const brott: string[] = []
    for (const f of SKRIVVAGAR) {
      const fil = join(ROT, f)
      expect(existsSync(fil), `${f} finns inte längre — uppdatera SKRIVVAGAR`).toBe(true)
      for (const x of hittaTystaFel(readFileSync(fil, 'utf8'), f)) brott.push(`${f}:${x.rad} — ${x.slag}`)
    }
    expect(brott, `Tysta fel i skrivvägar. Använd useSkrivning + <SkrivFel> (components/ui):\n${brott.join('\n')}`).toEqual([])
  })

  it(`deltagarens vyer håller taket (${TAK})`, () => {
    const alla = [join(ROT, 'pages'), join(ROT, 'components')].flatMap(filer).filter((f) => !arUndantagen(relative(ROT, f)))
    expect(alla.length).toBeGreaterThan(300)
    const brott: string[] = []
    for (const fil of alla) {
      for (const x of hittaTystaFel(readFileSync(fil, 'utf8'), fil)) {
        brott.push(`${relative(ROT, fil).split(sep).join('/')}:${x.rad} — ${x.slag}`)
      }
    }
    if (brott.length < TAK) console.warn(`[skrivfel-grind] ${brott.length} under taket ${TAK} — sänk TAK till ${brott.length}.`)
    expect(
      brott.length,
      `${brott.length} tysta fel mot taket ${TAK}. En ny tyst catch i en skrivväg? Använd useSkrivning + <SkrivFel>.\n${brott.slice(-20).join('\n')}`,
    ).toBeLessThanOrEqual(TAK)
    // ~500 filer genom TypeScripts parser — under coverage-instrumentering och
    // parallell last tar det mer än standardens 20 s.
  }, 120_000)
})

// Ett test som inte kan falla bevisar ingenting (lärdomen 2026-08-09).
describe('detektorn kan faktiskt falla', () => {
  it('ser try/finally utan catch runt en skrivning (RD1:s handleSend)', () => {
    const kod = `async function h() { setSending(true); try { await onSendMessage(x); setNewMessage('') } finally { setSending(false) } }`
    expect(hittaTystaFel(kod)).toEqual([{ rad: 1, slag: 'try/finally utan catch' }])
  })

  it('ser en catch som bara loggar (RD1:s handleSendMessage)', () => {
    const kod = `async function h() {\n try { await api.skickaTillMinKonsulent(c) }\n catch (err) { console.warn('x', err) }\n}`
    expect(hittaTystaFel(kod)).toHaveLength(1)
  })

  it('godtar en catch som sätter ett fel, och en med tyst-med-flit', () => {
    expect(hittaTystaFel(`async function h() { try { await api.update(x) } catch { setFel(true) } }`)).toEqual([])
    expect(hittaTystaFel(`async function h() { try { await api.update(x) } catch { /* tyst-med-flit: loggning */ } }`)).toEqual([])
  })

  it('bryr sig inte om läsningar eller localStorage', () => {
    expect(hittaTystaFel(`async function h() { try { await api.hamta(x) } catch {} }`)).toEqual([])
    expect(hittaTystaFel(`function h() { try { localStorage.removeItem('a') } catch {} }`)).toEqual([])
  })
})
