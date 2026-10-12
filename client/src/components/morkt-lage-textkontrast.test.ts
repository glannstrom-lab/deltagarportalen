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

/**
 * Breddad 2026-10-12: stone-700 och de andra gråskalorna (gray/zinc/slate/neutral)
 * i 600/700 är lika låga mot mörk yta. Varje undantag står i ALLOWLIST med
 * motivering; en ny träff utan post där fäller grinden.
 * 2026-10-12 (morkt500): även -500 (3,65:1 mot stone-900). Rätt är -400 (~6:1).
 * Mutation: lägg `dark:text-stone-700` eller `dark:text-stone-500` på en <p> → testet faller och pekar ut raden.
 */
const MORK_TEXT = /dark:text-(stone|gray|zinc|slate|neutral)-(500|600|700)(?![\w-])/

const ALLOWLIST: { fil: string; innehaller: string; skal: string }[] = [
  {
    fil: join('pages', 'consultant', 'AnalyticsTab.tsx'),
    innehaller: 'text-stone-200 dark:text-stone-700',
    skal: 'SVG-cirkelns spår (stroke="currentColor"), ingen text; dekorativ grafik',
  },
  {
    fil: join('pages', 'consultant', 'SettingsTab.tsx'),
    innehaller: '<Download className="w-5 h-5 text-stone-400 dark:text-stone-500"',
    skal: 'ikon (aria-hidden) i en ternär; ägs av annan agent i pass 3 — rättas efter (ikon kräver bara 3:1, 3,65 klarar det)',
  },
]

describe('mörkt läge: ingen text i stone-600/700', () => {
  it('components/ och pages/ använder inte dark:text-<grå>-600/700 på text', () => {
    const filer = KATALOGER.flatMap((k) => tsxFiler(k))
    expect(filer.length).toBeGreaterThan(300)
    expect(filer.some((f) => f.includes(join('pages', 'consultant')))).toBe(true)

    const fynd: string[] = []
    for (const fil of filer) {
      const rel = fil.slice(ROT.length + 1)
      readFileSync(fil, 'utf8').split(/\r?\n/).forEach((rad, i) => {
        if (!MORK_TEXT.test(rad)) return
        const arIkon = /^\s*<[A-Z][A-Za-z.]*[\s>]/.test(rad) && !/^\s*<(Link|Button)\b/.test(rad)
        const arKommentar = /^\s*(\{\/\*|\*|\/\/)/.test(rad)
        const arInaktiv = /cursor-not-allowed/.test(rad)
        const arTillaten = ALLOWLIST.some((a) => rel === a.fil && rad.includes(a.innehaller))
        if (!arIkon && !arInaktiv && !arKommentar && !arTillaten) fynd.push(`${rel}:${i + 1}`)
      })
    }
    expect(fynd).toEqual([])
  })

  it('allowlistens poster pekar på rader som finns kvar', () => {
    for (const a of ALLOWLIST) {
      const txt = readFileSync(join(ROT, a.fil), 'utf8')
      expect(txt.includes(a.innehaller), `${a.fil}: ${a.skal}`).toBe(true)
    }
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
