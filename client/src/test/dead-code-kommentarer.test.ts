/**
 * Vakt för dödkodsanalysens kommentarstrippare (scripts/lib/importspec.cjs).
 *
 * VARFÖR: 2026-09-22 klassade `node scripts/dead-code.cjs` 288 filer /
 * 62 000 rader som RADERA — hela AI-teamet, CV-byggaren, fokusläget — och
 * skrev "dubbelkollad med namnsökning" på var och en. Orsaken var att
 * stripparen tog blockkommentarer FÖRE radkommentarer: ett `/*` inuti en
 * radkommentar (App.tsx:55, "… under /foretag/*, som Consultant") eller
 * inuti en sträng (`path="cv/*"`) öppnade en blockkommentar som åt allt
 * fram till nästa stjärna-snedstreck. 60 % av App.tsx försvann, och med
 * den varje lazy-import efter rad 55.
 *
 * Testerna nedan är just de formerna, hämtade ur App.tsx — inte en
 * bekvämare fantasiform. Faller ett av dem ska skriptet inte köras
 * med --skriv förrän det är lagat.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { utanKommentarer, specifikationer } = require('../../scripts/lib/importspec.cjs') as {
  utanKommentarer: (kod: string) => string
  specifikationer: (kod: string) => string[]
}

describe('utanKommentarer', () => {
  it('ett /* inuti en radkommentar öppnar ingen blockkommentar', () => {
    const kod = [
      "// AG6: företagskontots sida — egna <Routes> under /foretag/*, som Consultant.",
      "const Foretag = lazy(() => import('./pages/Foretag'))",
      '/** riktig blockkommentar */',
      "const AITeam = lazy(() => import('./pages/AITeam'))",
    ].join('\n')
    expect(specifikationer(kod)).toEqual(['./pages/Foretag', './pages/AITeam'])
  })

  it('ett /* inuti en sträng (path="cv/*") öppnar ingen blockkommentar', () => {
    const kod = [
      '<Route path="cv/*" element={<CVPage />} />',
      "const Salary = lazy(() => import('./pages/Salary'))",
      '{/* JSX-kommentar */}',
      "const Foo = lazy(() => import('./pages/Foo'))",
    ].join('\n')
    expect(specifikationer(kod)).toEqual(['./pages/Salary', './pages/Foo'])
  })

  it('tar bort riktiga kommentarer så en utkommenterad import inte räknas', () => {
    const kod = [
      "// import { Gammal } from './Gammal'",
      "/* import { Aldre } from './Aldre' */",
      "import { Ny } from './Ny'",
    ].join('\n')
    expect(specifikationer(kod)).toEqual(['./Ny'])
  })

  it('ett // inuti en sträng (https://…) är ingen radkommentar', () => {
    const kod = [
      "const url = 'https://www.jobin.se' // kommentar",
      "import x from './x'",
    ].join('\n')
    expect(utanKommentarer(kod)).toContain("'https://www.jobin.se'")
    expect(specifikationer(kod)).toEqual(['./x'])
  })

  it('en apostrof i JSX-text sväljer inte resten av filen', () => {
    const kod = [
      "<p>Don't panic</p>",
      "import y from './y'",
    ].join('\n')
    expect(specifikationer(kod)).toEqual(['./y'])
  })

  it('den skarpa filen: alla lazy-importer i App.tsx överlever', () => {
    const app = readFileSync(join(__dirname, '..', 'App.tsx'), 'utf8')
    const lazyRader = app.match(/lazy\(\(\) => import\('([^']+)'\)\)/g) ?? []
    expect(lazyRader.length).toBeGreaterThan(40)
    const specar = new Set(specifikationer(app))
    for (const rad of lazyRader) {
      const spec = rad.match(/import\('([^']+)'\)/)![1]
      expect(specar.has(spec), `${spec} försvann i kommentarstripparen`).toBe(true)
    }
  })
})
