/**
 * /linkedin-optimizer får inte rendera råa i18n-nycklar.
 *
 * Mätt 2026-08-20: en granskare bytte `t('linkedInOptimizer.headline.jobTitleLabel')`
 * mot en nyckel som inte finns och körde HELA sviten — 1 824 tester i 130 filer,
 * alla gröna. Fältetiketten hade renderats som `linkedInOptimizer.headline.
 * jobTitleLabelSAKNAS` i produktion utan att något larmade.
 *
 * Vakten läser sidans källa och kräver att varje nyckel löser ut till en
 * STRÄNG i båda språken. Den kan alltså inte gå grön mot en mock — samma skäl
 * som `MyConsultant.i18n.test.ts`, som är förlagan.
 *
 * Sidan slår upp en del nycklar dynamiskt (`t(\`…sections.${nyckel}.name\`)`).
 * De byggs därför ihop här ur samma listor som komponenten använder — ändras
 * strukturen där ska den ändras här, och det är meningen.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

import sv from '../i18n/locales/sv.json'
import en from '../i18n/locales/en.json'

const kallor = [
  readFileSync(join(__dirname, 'LinkedInOptimizer.tsx'), 'utf8'),
  readFileSync(join(__dirname, '../components/focus/pages/FocusLinkedInWizard.tsx'), 'utf8'),
].join('\n')

/** Nycklar som interpoleras i koden och därför inte syns för ett regex. */
const DYNAMISKA_NYCKLAR = (() => {
  const flikar = ['headline', 'about', 'post', 'connection'] as const
  const delar: Record<string, string[]> = {
    rubrik: ['yrke', 'sokord', 'synligt'],
    om: ['borjan', 'konkret', 'kontakt', 'lasbar'],
    erfarenhet: ['vadDuGjorde', 'konkret', 'luckor'],
    rekommendationer: ['fragat', 'olika', 'kompetenser'],
  }
  const ut: string[] = []
  for (const f of flikar) {
    ut.push(`linkedInOptimizer.${f}.title`)
    ut.push(`linkedInOptimizer.${f}.description`)
    ut.push(`linkedInOptimizer.${f}.pasteWhere`)
  }
  for (const [del, punkter] of Object.entries(delar)) {
    ut.push(`linkedInOptimizer.audit.sections.${del}.name`)
    ut.push(`linkedInOptimizer.audit.sections.${del}.findWords`)
    for (const p of punkter) ut.push(`linkedInOptimizer.audit.sections.${del}.points.${p}`)
  }
  for (const del of ['rubrik', 'om', 'erfarenhet']) {
    ut.push(`linkedInOptimizer.audit.sections.${del}.exampleBefore`)
    ut.push(`linkedInOptimizer.audit.sections.${del}.exampleAfter`)
  }
  ut.push('linkedInOptimizer.audit.sections.rekommendationer.askTemplate')
  for (const n of ['aiOff', 'login', 'tooMany', 'generic']) ut.push(`linkedInOptimizer.errors.${n}`)
  for (const n of ['check1', 'check2', 'check3']) ut.push(`linkedInOptimizer.result.${n}`)
  return ut
})()

function anvandaNycklar(): string[] {
  const utanKommentarer = kallor
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  const funna = [
    ...utanKommentarer.matchAll(/t\('((?:linkedInOptimizer|focus\.linkedin)\.[a-zA-Z0-9_.]+)'/g),
  ].map((m) => m[1])

  return [...new Set([...funna, ...DYNAMISKA_NYCKLAR])]
}

function slaUpp(paket: unknown, sokvag: string): unknown {
  return sokvag.split('.').reduce<unknown>((acc, del) => {
    if (acc && typeof acc === 'object' && del in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[del]
    }
    return undefined
  }, paket)
}

describe('/linkedin-optimizer: varje i18n-nyckel finns i båda språken', () => {
  const nycklar = anvandaNycklar()

  it('hittar sidans nycklar — utan det här är vakten tom och meningslös', () => {
    expect(nycklar.length).toBeGreaterThan(50)
  })

  describe.each([
    ['sv', sv],
    ['en', en],
  ])('%s.json', (sprak, paket) => {
    it.each(nycklar)('%s löser ut till en sträng', (nyckel) => {
      const varde = slaUpp(paket, nyckel)
      expect(
        typeof varde,
        `${nyckel} saknas i ${sprak}.json — i18next skriver då ut nyckeln som text`,
      ).toBe('string')
      expect((varde as string).length).toBeGreaterThan(0)
    })
  })
})

describe('betygssystemet som togs bort 2026-08-17 ligger inte kvar i språkfilerna', () => {
  // Nycklarna beskrev "Profilhälsa", bokstavsbetyg och fyra fasta "prioriterade
  // åtgärder" — texter som påstod saker om användarens profil utan att något
  // lästs. De togs bort ur koden men blev kvar i JSON, färdiga att plockas upp
  // av nästa person som söker efter en användbar sträng.
  const DODA = [
    'profileHealth', 'grade', 'profileCompleted', 'recommendation',
    'priorityActions', 'high', 'medium', 'action1', 'action2', 'action3', 'action4',
  ]

  it.each([['sv', sv], ['en', en]] as const)('%s.json saknar dem', (sprak, paket) => {
    const kvar = DODA.filter((n) => slaUpp(paket, `linkedInOptimizer.audit.${n}`) !== undefined)
    expect(kvar, `${sprak}.json har kvar: ${kvar.join(', ')}`).toEqual([])
  })
})
