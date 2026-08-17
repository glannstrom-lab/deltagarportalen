/**
 * Vakt för krisstödet på de publika guidesidorna (BF1, genomgången 2026-08-17).
 *
 * Bakgrunden: portalen visar `CrisisSupport` i TopBar, BottomBar och Layout —
 * alltså på varje inloggad sida — och behåller den medvetet i fokusläge när
 * allt annat döljs. De 165 publika sidorna hade den inte: 10 av 162 nämnde ett
 * kristelefonnummer, och bara för att just den artikelns brödtext råkade göra
 * det. Det är sidor som en person i djup arbetslöshetsstress hittar via Google
 * *innan* hon loggar in, alltså innan komponenten har laddats en enda gång.
 *
 * Testet renderar mallen direkt i stället för att läsa `dist/` — dels för att
 * det ska gå att köra utan ett föregående bygge, dels för att det då fäller
 * *innan* något publiceras i stället för efteråt.
 *
 * Det asserterar tre saker, och skälet till var och en:
 *
 *  1. **Alla sex sidtyper**, inte bara guidesidan. Det var precis den sortens
 *     glapp som gjorde att blocket saknades från början: en sidtyp till som
 *     ingen tänkte på. Lägger någon till en sjunde `render*`-funktion ska den
 *     här listan tvinga fram ett aktivt val.
 *  2. **Numren står i HTML:en, inte bakom JS eller en `<details>`.** Sidorna
 *     ska fungera utan JS, och den som behöver numret ska inte behöva klicka.
 *  3. **Lättläst-sidor får lättläst-varianten.** Att beskriva krishjälp i
 *     krånglig text vore en motsägelse just för den grupp som behöver den mest
 *     — samma regel som `vadArDetHar` redan följer.
 *
 * Numren nedan är förlagan i `src/components/CrisisSupport.tsx`
 * (`crisisResourceDefs`). Ändras de där ska de ändras här — testet är den enda
 * kopplingen mellan de två renderingsvägarna.
 */

import { describe, it, expect } from 'vitest'

/* eslint-disable @typescript-eslint/no-require-imports */
const mall = require('../../scripts/lib/guide-template.cjs') as {
  renderGuide: (a: unknown, relaterade: unknown[]) => string
  renderIndex: (a: unknown[]) => string
  renderLattlast: (a: unknown[]) => string
  renderKategori: (k: unknown, a: unknown[], s: unknown[]) => string
  renderTool: (t: unknown, g: unknown[]) => string
  renderToolIndex: (v: unknown[]) => string
}
const { KATEGORIER } = require('../../scripts/lib/guides.cjs') as {
  KATEGORIER: { key: string; rubrik: string }[]
}
// Verktygen läses ur den riktiga content/tools.json — samma källa som bygget.
// En handskriven verktygsfixtur hade gått sönder tyst så fort formen ändrades,
// och det är precis den fällan projektet redan gått i tre gånger.
const VERKTYG = (require('../../content/tools.json') as { verktyg: Record<string, unknown>[] }).verktyg
/* eslint-enable @typescript-eslint/no-require-imports */

/** Formen är hämtad ur `articles.snapshot.json`, inte ur en bekvämare fantasiform. */
function artikel(over: Record<string, unknown> = {}) {
  return {
    slug: 'cv-grunder',
    title: 'Så skriver du ett CV',
    summary: 'Vad som ska stå i ett CV och hur du får med det viktigaste.',
    content: '## Rubrik\n\nEn kort brödtext.\n\n- ett\n- två\n',
    category_key: 'cv',
    difficulty: 'medium',
    reading_time: 4,
    checklist: null,
    related_tools: null,
    actions: null,
    ...over,
  }
}

const NUMMER = ['901 01', '1177', '112']

/** Varje publik sidtyp mallen kan producera. Listan ska växa med mallen. */
const sidtyper: [string, () => string][] = [
  ['guidesida', () => mall.renderGuide(artikel(), [])],
  ['guideindex', () => mall.renderIndex([artikel()])],
  ['lättläst-index', () => mall.renderLattlast([artikel({ difficulty: 'easy-swedish' })])],
  ['kategorisida', () => mall.renderKategori(KATEGORIER[0], [artikel()], KATEGORIER.slice(0, 2))],
  ['verktygssida', () => mall.renderTool(VERKTYG[0], [artikel()])],
  ['verktygsindex', () => mall.renderToolIndex(VERKTYG)],
]

describe('krisstöd finns på varje publik sidtyp', () => {
  it.each(sidtyper)('%s har krisstödsblocket', (_namn, rendera) => {
    const html = rendera()
    expect(html).toContain('class="krisstod"')
    // Landmärket ska ha ett namn — annars är det bara en till region i
    // skärmläsarens lista.
    expect(html).toMatch(/<aside class="krisstod" aria-label="[^"]+"/)
  })

  it.each(sidtyper)('%s har alla tre numren som ringbara länkar', (_namn, rendera) => {
    const html = rendera()
    for (const nr of NUMMER) expect(html).toContain(nr)
    // tel:-länkar, inte bara text: på mobil är ett klick skillnaden mellan att
    // ringa och att skriva av en siffra.
    expect(html).toContain('href="tel:90101"')
    expect(html).toContain('href="tel:1177"')
    expect(html).toContain('href="tel:112"')
  })

  it.each(sidtyper)('%s visar numren utan JS och utan att något fälls ut', (_namn, rendera) => {
    const html = rendera()
    const block = html.match(/<aside class="krisstod"[\s\S]*?<\/aside>/)
    expect(block).not.toBeNull()
    // Inget <details>/<script> inuti blocket: numren ska stå framme direkt.
    expect(block![0]).not.toContain('<details')
    expect(block![0]).not.toContain('<script')
  })
})

describe('lättläst får lättläst krisrad', () => {
  it('en lättläst artikel får den korta varianten', () => {
    const html = mall.renderGuide(artikel({ difficulty: 'easy-swedish' }), [])
    expect(html).toContain('Du kan alltid ringa och prata med någon.')
    expect(html).not.toContain('Du behöver inte vara i akut kris')
  })

  it('en vanlig artikel får den vanliga varianten', () => {
    const html = mall.renderGuide(artikel(), [])
    expect(html).toContain('Du behöver inte vara i akut kris')
    expect(html).not.toContain('Du kan alltid ringa och prata med någon.')
  })

  it('lättläst känns igen även när bara category_key säger det', () => {
    // Märkningen sitter på flera ställen i datat (difficulty, category_key,
    // slug-prefix) — samma skäl som `arLattlast()` i K5 testar alla tre.
    const html = mall.renderGuide(artikel({ difficulty: 'medium', category_key: 'easy-swedish' }), [])
    expect(html).toContain('Du kan alltid ringa och prata med någon.')
  })

  it('lättläst-indexet är självt lättläst', () => {
    const html = mall.renderLattlast([artikel({ difficulty: 'easy-swedish' })])
    expect(html).toContain('Du kan alltid ringa och prata med någon.')
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('hittar inte blocket i HTML som saknar det', () => {
    // Utan den här kontrollen bevisar de gröna testerna ovan ingenting om att
    // de skulle fälla vid en regression. Jfr lärdomen 2026-08-09: fråga aldrig
    // "finns det ett test?", fråga "vad händer om jag går sönder koden?".
    const utan = mall.renderGuide(artikel(), []).replace(/<aside class="krisstod"[\s\S]*?<\/aside>/, '')
    expect(utan).not.toContain('class="krisstod"')
    expect(utan).not.toContain('href="tel:90101"')
  })
})
