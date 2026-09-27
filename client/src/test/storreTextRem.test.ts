/**
 * Grind (RD22, rollspelet 2026-09-27): "Större text" höjer rotens storlek
 * (html.large-text, 16 → 18 px). Text satt i fasta pixlar — `text-[13px]` —
 * växer inte med, så flikrader och små etiketter stod kvar i 13 px för den
 * som bett om större text. I rem följer de med.
 *
 * Gäller deltagarens sidor och komponenter. Undantag, med skäl:
 *   (components/layout/* och Layout.tsx var undantagna tills skalet räknats om
 *   till rem samma dag — de omfattas nu.)
 *   - konsulentvyn: annan målgrupp, egen ton (DESIGN.md §2).
 *   - components/cv/templates och CV-förhandsvisningen: ett CV har sin egen
 *     typografi i pixlar/punkter, oberoende av läsarens inställning.
 *
 * Mutation: skriv tillbaka `text-[13px]` i en deltagarfil → grinden faller
 * och säger vilken fil.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

const SRC = join(__dirname, '..')
const RÖTTER = ['pages', 'components']
const UNDANTAG = [
  'components/consultant/',
  'pages/consultant/',
  'components/cv/templates/',
  'components/cv/preview/',
]

function filer(dir: string): string[] {
  return readdirSync(dir).flatMap((namn) => {
    const full = join(dir, namn)
    if (statSync(full).isDirectory()) return filer(full)
    return /\.tsx?$/.test(namn) && !/\.test\.tsx?$/.test(namn) ? [full] : []
  })
}

describe('Större text når också små etiketter (RD22)', () => {
  it('inga textstorlekar i fasta pixlar i deltagarens sidor och komponenter', () => {
    const fynd: string[] = []
    for (const rot of RÖTTER) {
      for (const fil of filer(join(SRC, rot))) {
        const rel = relative(SRC, fil).split(sep).join('/')
        if (UNDANTAG.some((u) => rel.startsWith(u))) continue
        const rader = readFileSync(fil, 'utf8').split(/\r?\n/)
        rader.forEach((rad, i) => {
          for (const m of rad.matchAll(/\btext-\[\d+(?:\.\d+)?px\]/g)) fynd.push(`${rel}:${i + 1} ${m[0]}`)
        })
      }
    }
    expect(fynd, `Byt till rem (px / 16), t.ex. text-[13px] → text-[0.8125rem]:\n${fynd.join('\n')}`).toEqual([])
  })
})
