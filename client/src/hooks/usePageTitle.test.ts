/**
 * UX34 (2026-08-05) — sidtitlar per rutt.
 *
 * Testerna vaktar det som faktiskt gick sönder: att en rutt får sitt eget namn
 * (inte varumärkestiteln), att longest-prefix vinner över kortare paths, och
 * att URL-kodade svenska paths (`/spontanans%C3%B6kan`) matchar.
 */

import { describe, it, expect } from 'vitest'
import {
  PAGE_TITLE_RULES,
  resolvePageTitleRule,
  formatDocumentTitle,
  DEFAULT_TITLE,
} from './usePageTitle'

describe('resolvePageTitleRule', () => {
  it('matchar en exakt rutt', () => {
    expect(resolvePageTitleRule('/diary')?.sv).toBe('Dagbok')
  })

  it('matchar underrutter till en tool-sida', () => {
    expect(resolvePageTitleRule('/cv/builder')?.path).toBe('/cv')
    expect(resolvePageTitleRule('/wellness/mood')?.path).toBe('/wellness')
  })

  it('låter den längre regeln vinna över den kortare', () => {
    expect(resolvePageTitleRule('/oversikt/historik')?.sv).toBe('Din historik')
    expect(resolvePageTitleRule('/oversikt')?.sv).toBe('Översikt')
    expect(resolvePageTitleRule('/profile/shared/abc123')?.sv).toBe('Delad profil')
    expect(resolvePageTitleRule('/profile')?.sv).toBe('Min profil')
    expect(resolvePageTitleRule('/knowledge-base/article/42')?.sv).toBe('Artikel')
  })

  it('matchar URL-kodade svenska paths', () => {
    expect(resolvePageTitleRule('/spontanans%C3%B6kan')?.path).toBe('/spontanansökan')
    expect(resolvePageTitleRule('/n%C3%A4tverk')?.path).toBe('/nätverk')
  })

  it('behandlar roten som exakt match — inte som prefix för allt', () => {
    expect(resolvePageTitleRule('/')?.exact).toBe(true)
    expect(resolvePageTitleRule('/login')?.sv).toBe('Logga in')
  })

  it('ger undefined för okänd rutt (catch-all omdirigerar ändå)', () => {
    expect(resolvePageTitleRule('/finns-inte')).toBeUndefined()
  })

  it('täcker samtliga rutter i App.tsx', () => {
    // Listan speglar <Route path>-tabellen i App.tsx. Faller den här: lägg till
    // raden i PAGE_TITLE_RULES, annars ärver den nya sidan varumärkestiteln.
    const routes = [
      '/', '/login', '/register', '/invite/abc', '/privacy', '/terms', '/ai-policy',
      '/tillganglighet', '/accessibility', '/template-snapshot/modern', '/print/cv',
      '/profile/shared/kod', '/oversikt', '/oversikt/historik', '/jobb', '/karriar',
      '/resurser', '/min-vardag', '/cv', '/cover-letter', '/interest-guide',
      '/knowledge-base', '/knowledge-base/article/1', '/profile', '/my-consultant',
      '/job-search', '/applications', '/career', '/diary', '/wellness', '/settings',
      '/resources', '/help', '/salary', '/education', '/calendar',
      '/spontanansökan', '/nätverk', '/personal-brand', '/linkedin-optimizer',
      '/skills-gap-analysis', '/interview-simulator', '/ai-team', '/exercises',
      '/international', '/externa-resurser', '/consultant', '/admin',
      '/steg-till-arbete',
    ]
    const utan = routes.filter((r) => !resolvePageTitleRule(r))
    expect(utan).toEqual([])
  })

  it('ger varje rutt ett eget namn — inte 45 identiska titlar', () => {
    const namn = PAGE_TITLE_RULES.map((r) => r.sv)
    // Tillgänglighet finns på två paths (/tillganglighet + /accessibility) och
    // Karriär på två (hubben + verktygssidan) — resten ska vara unika.
    const dubbletter = namn.filter((n, i) => namn.indexOf(n) !== i)
    expect(dubbletter.sort()).toEqual(['Karriär', 'Tillgänglighet'])
  })
})

describe('formatDocumentTitle', () => {
  it('följer mönstret <sidnamn> — Jobin', () => {
    expect(formatDocumentTitle('Dagbok')).toBe('Dagbok — Jobin')
  })

  it('dubblerar inte varumärket på landningen', () => {
    expect(formatDocumentTitle(DEFAULT_TITLE)).toBe(DEFAULT_TITLE)
    expect(formatDocumentTitle('')).toBe(DEFAULT_TITLE)
  })
})
