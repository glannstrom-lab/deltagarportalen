/**
 * Mörkt läge: `dark:text-stone-600` på text är 2,2–2,6:1 mot stone-800/900 —
 * långt under AA (4,5:1). Klassen hade hamnat på 36 textrader i de delade
 * komponenterna (AI-panelerna, kontoraderingen, notisklockan, cookie-rutan,
 * datadelningen) — troligen när ett ljust-läges-svep lyfte `text-stone-400` till
 * 600 och tog `dark:`-varianten med sig. 2026-09-22 lyfta till stone-400.
 *
 * Grinden gäller de kataloger som den här rättelsen täckte. Ikoner (en rad
 * som börjar med en komponent, t.ex. `<ChevronRight`) är undantagna: de är
 * dekorativa och bär inte text.
 *
 * Mutation: sätt tillbaka `dark:text-stone-600` på en textrad i t.ex.
 * `settings/DeleteAccountSection.tsx` → testet faller och pekar ut raden.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const HAR = join(__dirname)
const KATALOGER = [
  'ui', 'layout', 'ai-team', 'ai', 'interest-guide', 'diary', 'knowledge-base',
  'calendar', 'settings', 'consent', 'radgivare', 'occupation', 'notifications',
  'minvecka', 'auth', 'onboarding', 'pdf', 'wellness',
]

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
  it('de delade komponenterna använder inte dark:text-stone-600 på text', () => {
    const filer = [
      ...KATALOGER.flatMap((k) => tsxFiler(join(HAR, k))),
      ...readdirSync(HAR).filter((f) => f.endsWith('.tsx') && !f.includes('.test.')).map((f) => join(HAR, f)),
    ]
    expect(filer.length).toBeGreaterThan(100)

    const fynd: string[] = []
    for (const fil of filer) {
      readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
        if (!/dark:text-stone-600\b/.test(rad)) return
        const arIkon = /^\s*<[A-Z][A-Za-z]*[\s>]/.test(rad) && !/^\s*<(Link|Button)\b/.test(rad)
        if (!arIkon) fynd.push(`${fil.slice(HAR.length + 1)}:${i + 1}`)
      })
    }
    expect(fynd).toEqual([])
  })
})
