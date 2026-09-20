/**
 * GG1 (2026-09-20) — grind: de två ytor som rapporterar "underlag lämnat"
 * måste hämta överlämningsraderna och skicka in dem.
 *
 * Varför en källtextgrind och inte bara enhetstester: felet satt aldrig i
 * räknefunktionen. `ivoKvartalsunderlag()` hade fått sin `handovers`-parameter
 * redan 2026-09-13 (F10) — men BÅDA anropsställena fortsatte anropa den utan,
 * och föll då tillbaka på planens kolumn `nedsattning_underlag_lamnat_at`.
 * Den kolumnen skriver triggern `activity_plan_handovers_sync_plan()` om
 * retroaktivt till `max(handed_over_at)` över all tid, utan kvartalsfilter, så
 * ett underlag lämnat i Q2 gör att Q1 tyst tappar sin räkning i en rapport
 * nämnden eller IVO redan fått.
 *
 * Enhetstesterna i `ivoKvartal.test.ts` och `namndrapportPdf.test.ts` kan inte
 * fälla det, för de anropar funktionen direkt. Det som måste vaktas är
 * anropsstället. Samma lärdom som `ai-sanningsregel.test.ts`: en grind som
 * bara prövar standardgrenen prövar den gren som redan var rätt.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const las = (relativ: string) =>
  readFileSync(resolve(__dirname, '..', relativ), 'utf-8').replace(/\r\n/g, '\n')

const YTOR = [
  {
    fil: 'components/consultant/IvoUnderlagSektion.tsx',
    beskrivning: 'IVO-kvartalsunderlaget',
    rakneFunktion: 'ivoKvartalsunderlag(',
  },
  {
    fil: 'components/consultant/ReportGeneratorDialog.tsx',
    beskrivning: 'nämndrapporten',
    rakneFunktion: 'namndrapportUnderlag(',
  },
] as const

describe('GG1: underlagen hämtas och skickas in på varje rapportyta', () => {
  it.each(YTOR)('$beskrivning hämtar överlämningsraderna', ({ fil }) => {
    expect(las(fil)).toContain('underlagApi.listIPeriod(')
  })

  it.each(YTOR)('$beskrivning skickar in dem i räkningen', ({ fil, rakneFunktion }) => {
    const kalla = las(fil)
    const start = kalla.indexOf(rakneFunktion)
    expect(start, `${rakneFunktion} anropas inte i ${fil}`).toBeGreaterThan(-1)

    // Argumentlistan fram till radslut: fyra argument krävs, och det fjärde
    // ska bära underlagen. Tre argument = reservvägen, alltså buggen igen.
    const anrop = kalla.slice(start, kalla.indexOf('\n', start))
    const argument = anrop
      .slice(rakneFunktion.length, anrop.lastIndexOf(')'))
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    expect(argument.length, `${rakneFunktion} i ${fil} anropas med ${argument.length} argument — det fjärde (underlagen) saknas`).toBeGreaterThanOrEqual(4)
    expect(argument[3].toLowerCase()).toMatch(/underlag|handover/)
  })

  it('reservvägen finns kvar men är dokumenterad som reserv, inte som likvärdig', () => {
    const kalla = las('services/ivoKvartal.ts')
    // Den gamla kommentaren påstod "samma tal, för triggern håller kolumnen
    // lika med senaste ej ångrade underlaget" — fel, och det var påståendet
    // som gjorde att ingen skickade in listan.
    expect(kalla).not.toContain('samma tal, för triggern håller kolumnen')
    expect(kalla).toContain('Skicka alltid listan')
  })
})
