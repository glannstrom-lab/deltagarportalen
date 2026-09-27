/**
 * Mörkt läge: `dark:text-stone-600` på text är 2,2–2,6:1 mot stone-800/900 —
 * långt under AA (4,5:1). Klassen hade hamnat på 36 textrader i de delade
 * komponenterna (AI-panelerna, kontoraderingen, notisklockan, cookie-rutan,
 * datadelningen) — troligen när ett ljust-läges-svep lyfte `text-stone-400` till
 * 600 och tog `dark:`-varianten med sig. 2026-09-22 lyfta till stone-400.
 *
 * Breddad 2026-09-22 kväll till HELA `components/` och `pages/`: grinden täckte
 * först 18 kataloger, och 29 textrader till (konsulentdialogerna, statistikfliken,
 * kompetensstjärnorna, avgränsare) låg utanför den.
 *
 * Undantag: ikoner (en rad som börjar med en komponent, t.ex. `<ChevronRight`)
 * är dekorativa och bär inte text; inaktiverade kontroller (`cursor-not-allowed`
 * på samma rad) är undantagna från kontrastkravet i WCAG 1.4.3.
 *
 * Mutation: sätt tillbaka `dark:text-stone-600` på en textrad i t.ex.
 * `settings/DeleteAccountSection.tsx` eller `pages/consultant/AnalyticsTab.tsx`
 * → testet faller och pekar ut raden.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROT = join(__dirname, '..')
const KATALOGER = [join(ROT, 'components'), join(ROT, 'pages')]

function tsxFiler(katalog: string): string[] {
  if (!existsSync(katalog)) return []
  const ut: string[] = []
  for (const e of readdirSync(katalog, { withFileTypes: true })) {
    const p = join(katalog, e.name)
    if (e.isDirectory()) ut.push(...tsxFiler(p))
    else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) ut.push(p)
  }
  return ut
}

describe('mörkt läge: ingen text i stone-600', () => {
  it('components/ och pages/ använder inte dark:text-stone-600 på text', () => {
    const filer = KATALOGER.flatMap((k) => tsxFiler(k))
    expect(filer.length).toBeGreaterThan(300)
    expect(filer.some((f) => f.includes(join('pages', 'consultant')))).toBe(true)

    const fynd: string[] = []
    for (const fil of filer) {
      readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
        if (!/dark:text-stone-600\b/.test(rad)) return
        const arIkon = /^\s*<[A-Z][A-Za-z.]*[\s>]/.test(rad) && !/^\s*<(Link|Button)\b/.test(rad)
        const arInaktiv = /cursor-not-allowed/.test(rad)
        if (!arIkon && !arInaktiv) fynd.push(`${fil.slice(ROT.length + 1)}:${i + 1}`)
      })
    }
    expect(fynd).toEqual([])
  })
})

/**
 * RD9 (rollspelet 2026-09-27): i mörkt läge var Dagbokens tomläge 1,47:1 och
 * Min konsulents "Din arbetskonsulent" 2,1:1 (vitt på lila #BFA9E0).
 *
 * Två fel som grinden ovan inte såg:
 *  1. Mörk text UTAN `dark:`-variant (`text-stone-700` ensamt). I mörkt läge
 *     står den mörkgrå på mörkgrått kort. Kontrolleras per strängliteral, så
 *     `cn('a', cond && 'b')` prövas del för del.
 *  2. `text-white` på ett element som inte själv har bakgrunden. Bryggregeln i
 *     tokens.css (`.dark .bg-[var(--c-solid)].text-white`) byter bara färg när
 *     båda klasserna sitter på SAMMA element — ett barn med egen `text-white`
 *     blir kvar vitt på den ljusa pastellen. Ny kod: `text-[var(--c-on-solid)]`.
 *
 * Omfånget är deltagarens vardagsvyer (Dagbok, Min konsulent, Min vecka,
 * AI-teamet, notisklockan). Mutation: ta bort `dark:text-stone-300` från
 * tomlägets rubrik i `diary/JournalTab.tsx` → testet faller.
 */
const DELTAGARVYER = [
  join(ROT, 'pages', 'Diary.tsx'),
  join(ROT, 'pages', 'MyConsultant.tsx'),
  join(ROT, 'pages', 'MinVecka.tsx'),
  join(ROT, 'components', 'notifications', 'NotificationBell.tsx'),
  ...tsxFiler(join(ROT, 'components', 'diary')),
  ...tsxFiler(join(ROT, 'components', 'minvecka')),
  ...tsxFiler(join(ROT, 'components', 'ai-team')),
]

const STRANG = /(["'`])((?:(?!\1)[^\n\\])*)\1/g

describe('mörkt läge: deltagarvyernas text har en mörk variant (RD9)', () => {
  it('ingen mörk stone-text utan dark:text- i samma klassträng', () => {
    expect(DELTAGARVYER.length).toBeGreaterThan(15)
    const fynd: string[] = []
    for (const fil of DELTAGARVYER) {
      readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
        for (const m of rad.matchAll(STRANG)) {
          const s = m[2]
          if (/(?<![:\w-])text-stone-(600|700|800|900)\b/.test(s) && !/(?<![\w-])dark:text-/.test(s)) {
            fynd.push(`${fil.slice(ROT.length + 1)}:${i + 1}  "${s.slice(0, 60)}"`)
          }
        }
      })
    }
    expect(fynd).toEqual([])
  })

  it('text-white bara på elementet som bär sin egen bakgrund', () => {
    const fynd: string[] = []
    for (const fil of DELTAGARVYER) {
      readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
        if (/\btext-white\b/.test(rad) && !/(?<![:\w-])bg-/.test(rad)) fynd.push(`${fil.slice(ROT.length + 1)}:${i + 1}`)
      })
    }
    expect(fynd).toEqual([])
  })
})
