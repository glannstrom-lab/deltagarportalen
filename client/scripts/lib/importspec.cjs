/**
 * Importspecifikationer ur en källfil — det dödkodsanalysen bygger sin graf på.
 *
 * Bruten ut ur scripts/dead-code.cjs 2026-09-22 för att kunna testas:
 * skriptet kör sin analys vid laddning och går inte att importera.
 *
 * FÄLLA (funnen 2026-09-22): kommentarstripparen var två regex efter
 * varandra — blockkommentarer först, sedan radkommentarer. Då öppnade ett
 * "/*" INUTI en radkommentar ("// … under /foretag/*, som Consultant",
 * App.tsx:55) eller inuti en sträng (path="cv/*") en blockkommentar som
 * åt allt fram till nästa stjärna-snedstreck — 60 % av App.tsx försvann,
 * 62 000 rader (288 filer: hela AI-teamet, CV-byggaren, fokusläget)
 * klassades RADERA, och skriptet skrev "dubbelkollad med namnsökning" på
 * var och en. Ett --skriv hade tömt portalen. Scannern nedan går tecken
 * för tecken och vet om den står i en sträng eller inte.
 * Vaktad av src/test/dead-code-kommentarer.test.ts.
 */

function utanKommentarer(kod) {
  let ut = ''
  let i = 0
  const n = kod.length
  while (i < n) {
    const c = kod[i]
    const d = kod[i + 1]
    if (c === '/' && d === '*') {
      const j = kod.indexOf('*/', i + 2)
      ut += ' '
      i = j < 0 ? n : j + 2
      continue
    }
    if (c === '/' && d === '/') {
      const j = kod.indexOf('\n', i)
      ut += ' '
      i = j < 0 ? n : j
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      // Strängen kopieras ordagrant så importspecifikationen överlever.
      // Enkla/dubbla citattecken slutar vid radslut (en apostrof i JSX-text
      // ska inte kunna svälja resten av filen); mallsträngar får löpa.
      let j = i + 1
      while (j < n && kod[j] !== c) {
        if (kod[j] === '\\') j++
        else if (c !== '`' && kod[j] === '\n') break
        j++
      }
      ut += kod.slice(i, j + 1)
      i = j + 1
      continue
    }
    ut += c
    i++
  }
  return ut
}

const MONSTER = [
  // import x from '…' / import '…' / import type … from '…'
  //
  // \p{L} i stället för \w, med flaggan u: \w är ASCII-only, så en importrad
  // med ett svenskt tecken i en identifierare (`AiFöretagsfel` i
  // SearchTab.tsx) matchade aldrig, filen den importerade klassades RADERA,
  // och den felklassningen blev en premiss i ROADMAP (spår AG, 2026-09-02).
  /\bimport\s+(?:type\s+)?(?:[\p{L}\p{N}_*{}\n\r\t ,$]+from\s*)?['"]([^'"]+)['"]/gu,
  // export … from '…'  (inkl. export * from)
  /\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*(?:as\s+\w+\s*)?from\s*['"]([^'"]+)['"]/g,
  // dynamisk import('…')
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // require('…')
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // vi.mock('…') / vi.doMock('…') — testmockar räknas som kanter
  /\bvi\.(?:mock|doMock|unmock)\s*\(\s*['"]([^'"]+)['"]/g,
  // CSS: @import "./styles/x.css" och @import url("./styles/x.css")
  //
  // FÄLLA (funnen 2026-08-05): utan den här raden såg
  // `styles/accessibility.css` död ut trots att `index.css:19` importerar
  // den. Ett raderingspass hade tagit bort fokusringar och skip-links.
  // CSS-grafen är inte JS-grafen.
  /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]/g,
]

function specifikationer(kod) {
  const ren = utanKommentarer(kod)
  const ut = new Set()
  for (const re of MONSTER) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(ren)) !== null) ut.add(m[1])
  }
  return [...ut]
}

module.exports = { utanKommentarer, specifikationer, MONSTER }
