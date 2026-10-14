/**
 * CV-mallarnas gemensamma typografi (CVK1 + mallslipningen 2026-10-11).
 *
 * Tolv mallar skrevs vid olika tillfällen och hade var sitt sätt att visa
 * datum, var sin syn på rubriknivåer och ingen gemensam grundstil. Det här är
 * det som ska vara lika i alla — personligheten bor kvar i mallfilerna.
 *
 * - `periodText` / `periodDelar` — "mar 2023 – nu" i stället för "2023-03 — Nu".
 *   Ett datum utan slut ritade förut ett hängande streck ("2023-03 — ").
 * - `rubrikTaggar` — en h1 per dokument. I PDF:en är namnet h1; i portalens
 *   förhandsvisning har sidan redan en h1, så där börjar mallen på h2.
 * - `CV_GRUNDSTIL` — avstavning, tabulära siffror, punktlistor, sidbrytningar.
 * - `beskrivningsblock` — användarens radbrytningar och punktlistor. 18 av 72
 *   jobbeskrivningar i prod (mätt 2026-10-11) hade radbrytningar som alla tolv
 *   mallar slog ihop till en enda klump.
 */

const MANADER = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/**
 * "2023-03" → "mar 2023", "2023-03-15" → "mar 2023", "2019" → "2019".
 * Allt annat (fritext som "våren 2019") visas som det skrevs — hellre
 * användarens ord än en gissning.
 */
export function datumText(datum?: string | null): string {
  const d = (datum ?? '').trim()
  if (!d) return ''
  const m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(d)
  if (m) {
    const manad = Number(m[2])
    if (manad >= 1 && manad <= 12) return `${MANADER[manad - 1]} ${m[1]}`
  }
  return d
}

export interface Period {
  fran: string
  till: string
}

/**
 * Periodens två ändar, var för sig — för mallar som ställer datumen i en
 * egen kolumn på två rader.
 */
export function periodDelar(
  start?: string | null,
  slut?: string | null,
  pagaende?: boolean,
  nu = 'nu',
): Period {
  return {
    fran: datumText(start),
    till: pagaende ? nu : datumText(slut),
  }
}

/**
 * "mar 2023 – nu". Tankstreck (–) med mellanrum, som svensk typografi vill
 * ha det mellan två ord. Saknas ena änden står den andra ensam — aldrig ett
 * hängande streck.
 */
export function periodText(
  start?: string | null,
  slut?: string | null,
  pagaende?: boolean,
  nu = 'nu',
): string {
  const { fran, till } = periodDelar(start, slut, pagaende, nu)
  if (fran && till) return `${fran} – ${till}`
  return fran || till
}

export type Rubrikniva = 1 | 2

type Rubriktagg = 'h1' | 'h2' | 'h3' | 'h4'

/**
 * Rubriktaggarna för en mall. `niva` är namnets nivå: 1 i PDF:en (dokumentet
 * står ensamt), 2 i portalens förhandsvisning (sidan har redan sin h1).
 * Sektionsrubriker och poster följer med ett steg ned, så hierarkin hoppar
 * aldrig över en nivå.
 */
export function rubrikTaggar(niva: Rubrikniva = 1): { Namn: Rubriktagg; Sektion: Rubriktagg; Post: Rubriktagg } {
  if (niva === 2) return { Namn: 'h2', Sektion: 'h3', Post: 'h4' }
  return { Namn: 'h1', Sektion: 'h2', Post: 'h3' }
}

export type Beskrivningsblock =
  | { typ: 'stycke'; rader: string[] }
  | { typ: 'lista'; punkter: string[] }

const PUNKT = /^\s*(?:[-–•*·▪●]|\d+[.)])\s+/

/**
 * Delar en beskrivning i stycken och punktlistor.
 *
 * - Tom rad = nytt stycke.
 * - Rader som börjar med -, –, •, * eller "1." blir en riktig lista (`<ul>`),
 *   så att en parser läser dem som punkter och inte som tecken i texten.
 * - En enkel radbrytning inne i ett stycke behålls som radbrytning.
 */
export function beskrivningsblock(text?: string | null): Beskrivningsblock[] {
  const t = (text ?? '').replace(/\r\n?/g, '\n').trim()
  if (!t) return []
  const block: Beskrivningsblock[] = []
  let stycke: string[] = []
  let lista: string[] = []
  const tomStycke = () => {
    if (stycke.length) block.push({ typ: 'stycke', rader: stycke })
    stycke = []
  }
  const tomLista = () => {
    if (lista.length) block.push({ typ: 'lista', punkter: lista })
    lista = []
  }
  for (const rad of t.split('\n')) {
    const r = rad.trim()
    if (!r) {
      tomStycke()
      tomLista()
      continue
    }
    if (PUNKT.test(r)) {
      tomStycke()
      lista.push(r.replace(PUNKT, ''))
    } else {
      tomLista()
      stycke.push(r)
    }
  }
  tomStycke()
  tomLista()
  return block
}

/**
 * Grundstilen för alla mallar, scopad till `.cv-preview`. Renderas av både
 * förhandsvisningen (`CVPreview`) och PDF-vägen (`CVPrintLayout`) — samma
 * regler på båda ställena, annars ser förhandsvisningen inte ut som PDF:en.
 */
export const CV_GRUNDSTIL = `
.cv-preview {
  font-kerning: normal;
  font-variant-ligatures: common-ligatures;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -webkit-hyphens: auto;
  hyphens: auto;
  hyphenate-limit-chars: 8 4 4;
  overflow-wrap: break-word;
}
.cv-preview h1, .cv-preview h2, .cv-preview h3, .cv-preview h4,
.cv-preview .cv-kontakt, .cv-preview .cv-url {
  -webkit-hyphens: manual;
  hyphens: manual;
}
.cv-preview .cv-kontakt, .cv-preview .cv-url { overflow-wrap: anywhere; }
.cv-preview .cv-datum {
  font-variant-numeric: tabular-nums lining-nums;
  -webkit-hyphens: manual;
  hyphens: manual;
}
.cv-preview p, .cv-preview li { orphans: 2; widows: 2; }
.cv-preview ul.cv-punkter {
  list-style: disc;
  margin: 0.25em 0 0;
  padding-left: 1.15em;
}
.cv-preview ul.cv-punkter > li { padding-left: 0.15em; }
.cv-preview ul.cv-punkter > li + li { margin-top: 0.2em; }
.cv-preview .cv-stycke + .cv-stycke,
.cv-preview .cv-stycke + .cv-punkter,
.cv-preview .cv-punkter + .cv-stycke { margin-top: 0.45em; }
.cv-preview h1, .cv-preview h2, .cv-preview h3, .cv-preview h4 {
  break-after: avoid;
  page-break-after: avoid;
}
.cv-preview .cv-entry, .cv-preview .cv-keep {
  break-inside: avoid;
  page-break-inside: avoid;
}
/* PostSektion lägger posterna i en tabellcell, där sista postens marginal inte
   längre kollapsar med sektionens. Utan nollningen blev glappet till nästa
   sektion större — och i PDF:en kunde marginalen ensam spilla över på en ny
   sida, där tabellhuvudet då upprepades ovanför ingenting. !important
   eftersom mallarna sätter marginalen inline på posten. */
.cv-preview .cv-postsektion td > :last-child,
.cv-preview .cv-postsektion td > :last-child > .cv-entry:last-child {
  margin-bottom: 0 !important;
}
`
