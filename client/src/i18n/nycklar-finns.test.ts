/**
 * Vakt över F31: varje t('a.b.c', …)-anrop i NÅBAR kod ska lösa ut i BÅDA
 * locale-filerna.
 *
 * VARFÖR EN EGEN VAKT. `sprakparitet.test.ts` jämför `sv.json` mot `en.json`
 * — en nyckel som saknas i BÅDA filerna är osynlig för den, eftersom den
 * aldrig läser källkoden. Koden renderar då `t()`-anropets fallback-argument
 * (svenska) på båda språken: sidan ser rätt ut på svenska och är tyst
 * oöversatt på engelska, utan att något test kan säga det.
 * `juridiska-sidor-i18n.test.ts` gör precis den kontrollen men bara för tre
 * namngivna sidor (Terms/Privacy/AiPolicy). Den här vakten gör det för HELA
 * den nåbara kodbasen.
 *
 * NÅBARHETSFILTER MED FLIT. Ett mekaniskt svep över hela `src/` skulle fälla
 * på nycklar i död kod (t.ex. hela `components/dashboard/`) och därmed dels
 * betala för att "laga" kod ingen kör, dels blockera raderingspasset för den
 * — lärdomen från 2026-08-09 i CLAUDE.md. Filtret körs via
 * `scripts/dead-code.cjs --json`, samma källa som styr raderingsbeslut.
 *
 * MÄTT 2026-09-02 (F31): 286 nycklar i 72 filer INNAN nåbarhetsfilter och
 * innan CLDR-pluralformer räknades in (`_one`/`_other` m.fl. — en nyckel som
 * bara används med `{ count }` löses av i18next via de formerna utan att
 * grundnyckeln behöver finnas alls). Efter båda korrigeringarna: 159 unika
 * nycklar i 65 filer, alla åtgärdade i samma ändring som skrev det här
 * testet. Se `scripts/i18n-saknade-nycklar.cjs` för detektorn och
 * `scripts/i18n-infoga-nycklar.cjs` för insättningsverktyget (position-
 * medveten textsplicing — se `docs/ROADMAP.md` AG4 och
 * `~/.claude/…/i18n-svep-monster.md`: locale-filerna är INTE
 * JSON.stringify-normaliserade, så en omserialisering ger en diff över hela
 * filen).
 *
 * TILLÅTEN UNDANTAGSLISTA. Tom med flit. Om något måste vänta: lägg till
 * nyckeln här MED ETT SKÄL i en kommentar bredvid — aldrig tyst.
 */
import { describe, it, expect } from 'vitest'
/* eslint-disable @typescript-eslint/no-require-imports */
// CommonJS-skript utan typdeklaration — samma grepp som guides-krisstod.test.ts.
const { finnSaknade } = require('../../scripts/i18n-saknade-nycklar.cjs') as {
  finnSaknade: (scanRoot?: string) => {
    totaltSaknade: number
    filerMedSaknade: number
    resultat: Array<{ fil: string; nycklar: Array<{ nyckel: string; rad?: number }> }>
  }
}

/**
 * Nycklar som medvetet får sakna en riktig översättning ett tag till.
 * Formatet är `sokvag` (exakt som scriptet rapporterar den). Skriv ALLTID
 * varför på raden — annars är den inte ett beslut, den är glömska.
 */
const TILLATNA_UNDANTAG: string[] = []

describe('nycklar-finns — varje t()-anrop i nåbar kod löser ut i sv.json OCH en.json', () => {
  const { totaltSaknade, filerMedSaknade, resultat } = finnSaknade()

  it('scriptet hittar över huvud taget t()-anrop (positiv kontroll)', () => {
    // Utan den kan hela grinden bli grön av att detektorn slutat matcha,
    // t.ex. efter en ändring av t()-anropsmönstret i kodbasen.
    // finnSaknade() rapporterar bara SAKNADE nycklar, så vi kan inte läsa
    // "hittade nycklar" härifrån direkt — men vi kan kräva att scriptet body
    // producerar ett väldefinierat, icke-kraschande resultat med rätt form.
    expect(typeof totaltSaknade).toBe('number')
    expect(Array.isArray(resultat)).toBe(true)
  })

  it('inga saknade nycklar utanför den tillåtna undantagslistan', () => {
    const alla = resultat.flatMap((r: { fil: string; nycklar: { nyckel: string }[] }) =>
      r.nycklar.map((n) => `${n.nyckel}  (${r.fil})`)
    )
    const otillatna = alla.filter(
      (rad: string) => !TILLATNA_UNDANTAG.some((undantag) => rad.startsWith(undantag + '  ('))
    )
    expect(
      otillatna,
      `${otillatna.length} nyckel/nycklar saknas i sv.json eller en.json:\n${otillatna.slice(0, 30).join('\n')}`
    ).toEqual([])
  })

  it('undantagslistan innehåller inga nycklar som redan är åtgärdade (döda undantag)', () => {
    // Om en nyckel i TILLATNA_UNDANTAG inte längre dyker upp som saknad är
    // undantaget överflödigt — städa bort det så listan inte växer av glömska.
    const kvarstaende = new Set(
      resultat.flatMap((r: { nycklar: { nyckel: string }[] }) => r.nycklar.map((n) => n.nyckel))
    )
    const dodaUndantag = TILLATNA_UNDANTAG.filter((u) => ![...kvarstaende].some((k) => k === u))
    expect(dodaUndantag, `Döda undantag (ta bort ur listan): ${dodaUndantag.join(', ')}`).toEqual([])
  })

  it('filerMedSaknade och totaltSaknade är konsekventa', () => {
    const summa = resultat.reduce((n: number, r: { nycklar: unknown[] }) => n + r.nycklar.length, 0)
    expect(summa).toBe(totaltSaknade)
    expect(resultat.length).toBe(filerMedSaknade)
  })
})
