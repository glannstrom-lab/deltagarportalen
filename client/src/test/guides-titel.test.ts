import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const mall = require('../../scripts/lib/guide-template.cjs') as {
  renderGuide: (a: unknown, relaterade: unknown[]) => string
  sidtitel: (t: string) => string
  titelForLang: (t: string) => boolean
  TITEL_MAX: number
}
/* eslint-enable @typescript-eslint/no-require-imports */

/** Formen är hämtad ur `articles.snapshot.json`. */
function artikel(over: Record<string, unknown> = {}) {
  return {
    slug: 'cv-grunder',
    title: 'Så skriver du ett CV',
    summary: 'Vad som ska stå i ett CV och hur du får med det viktigaste.',
    content: '## Rubrik\n\nEn kort brödtext.\n',
    category_key: 'cv',
    difficulty: 'medium',
    reading_time: 4,
    checklist: null,
    related_tools: null,
    actions: null,
    ...over,
  }
}

/**
 * SE3 (genomgången 2026-08-17): titellängd.
 *
 * Mallen la på " — Jobin" utan längdkontroll. Uppmätt: **48 av 162 titlar över
 * 60 tecken**, längst 80. Google klipper runt den bredden, så det som föll bort
 * var slutet — ofta just det ord som skiljer artikeln från sitt syskon (SE1,
 * SE2) — plus varumärket. Sämsta av två: sidan tappade både sin särskiljande
 * del och sitt namn.
 *
 * Lösningen släpper suffixet i stället för att trunkera. En titel som slutar på
 * "…" ser trasig ut i sökresultatet; "Jobin" är den minst informativa delen för
 * någon som söker på "a-kassa villkor". Efter fixen: **2 av 162 kvar**, och de
 * kan bara lösas redaktionellt — bygget rapporterar dem.
 */
describe('SE3: titeln kapas inte i sökresultatet', () => {
  it('lägger på varumärket när det får plats', () => {
    const t = mall.sidtitel('Vad är ett CV?')
    expect(t).toBe('Vad är ett CV? — Jobin')
    expect(t.length).toBeLessThanOrEqual(mall.TITEL_MAX)
  })

  it('släpper varumärket i stället för att gå över gränsen', () => {
    const lang = 'Jobbsökning med funktionsnedsättning – rättigheter och stöd'
    const t = mall.sidtitel(lang)
    expect(t).toBe(lang)
    expect(t).not.toContain('Jobin')
  })

  it('trunkerar aldrig — en titel som slutar på … ser trasig ut i Google', () => {
    const lang = 'Jobbsökning med funktionsnedsättning – rättigheter och strategier'
    expect(mall.sidtitel(lang)).not.toContain('…')
    expect(mall.sidtitel(lang)).toContain('strategier')
  })

  it('gränsfallet: exakt på taket behåller varumärket', () => {
    const exakt = 'x'.repeat(mall.TITEL_MAX - ' — Jobin'.length)
    expect(mall.sidtitel(exakt).length).toBe(mall.TITEL_MAX)
    expect(mall.sidtitel(exakt)).toContain('Jobin')
  })

  it('ett tecken till och varumärket åker ut', () => {
    const enOver = 'x'.repeat(mall.TITEL_MAX - ' — Jobin'.length + 1)
    expect(mall.sidtitel(enOver)).not.toContain('Jobin')
  })

  it('titelForLang pekar bara ut det som kräver redaktionell omskrivning', () => {
    expect(mall.titelForLang('Kort titel')).toBe(false)
    expect(mall.titelForLang('x'.repeat(mall.TITEL_MAX))).toBe(false)
    expect(mall.titelForLang('x'.repeat(mall.TITEL_MAX + 1))).toBe(true)
  })

  it('renderad guidesida får en titel inom gränsen', () => {
    const html = mall.renderGuide(artikel({ title: 'Vad är ett CV?' }), [])
    const m = html.match(/<title>([^<]*)<\/title>/)
    expect(m).not.toBeNull()
    expect(m![1].length).toBeLessThanOrEqual(mall.TITEL_MAX)
  })
})
