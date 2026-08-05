/**
 * Markdown-parsern bakom `ArticleContent`.
 *
 * Ligger i en egen fil av två skäl: den är ren logik utan JSX och går därför
 * att testa direkt, och `react-refresh` tillåter bara komponentexporter i en
 * `.tsx`-fil.
 *
 * Semantiken är portad från `scripts/lib/markdown.cjs`, som löser samma
 * problem för de statiska guidesidorna. Att de två hålls i takt är poängen:
 * samma artikel ska se likadan ut i portalen som på guidesidan.
 */

export type ArticleBlock =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'rule' }

const ärTabellrad = (rad: string) => /^\s*\|.*\|\s*$/.test(rad)
const ärTabellavdelare = (rad: string) => /^\s*\|[\s:|-]+\|\s*$/.test(rad)

/** `| a | b |` → `['a', 'b']`. Yttre pipes hör till syntaxen, inte innehållet. */
const delaTabellrad = (rad: string) =>
  rad
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())

/**
 * Markdown → block. En rad i taget, precis som referensen — att dela på `\n\n`
 * går inte när ett block (tabell, lista) är flera rader utan tomrad emellan.
 * Det var just den delningen som gjorde att tabeller aldrig kändes igen.
 */
export function parseArticleMarkdown(content: string): ArticleBlock[] {
  const text = String(content ?? '').replace(/\r\n/g, '\n')
  const rader = text.split('\n')
  const block: ArticleBlock[] = []

  /**
   * Basnivån beror på artikeln, inte på mallen runt omkring. h1 är reserverad
   * för sidrubriken (artikelns titel), så brödtexten börjar alltid på h2 och
   * rubrikordningen kan aldrig hoppa ett steg.
   *   - Har artikeln `#` är det dess supersektion → `#`→h2, `##`→h3, `###`→h4
   *   - Annars är `##` artikelns toppnivå        → `##`→h2, `###`→h3
   * Mätt i korpusen: 120 artiklar har bara `##`, 13 har både `#` och `##`.
   */
  const nivåtillägg = /(^|\n)# /.test(text) ? 1 : 0

  let stycke: string[] = []
  let lista: { ordered: boolean; items: string[] } | null = null
  let citat: string[] = []
  let tabell: { head: string[]; rows: string[][] } | null = null
  let kod: string[] | null = null

  const stängStycke = () => {
    if (stycke.length) {
      block.push({ kind: 'paragraph', text: stycke.join(' ') })
      stycke = []
    }
  }
  const stängLista = () => {
    if (lista) {
      block.push({ kind: 'list', ordered: lista.ordered, items: lista.items })
      lista = null
    }
  }
  const stängCitat = () => {
    if (citat.length) {
      block.push({ kind: 'quote', text: citat.join(' ') })
      citat = []
    }
  }
  const stängTabell = () => {
    if (tabell) {
      block.push({ kind: 'table', head: tabell.head, rows: tabell.rows })
      tabell = null
    }
  }
  const stängAllt = () => {
    stängStycke()
    stängLista()
    stängCitat()
    stängTabell()
  }

  for (const rad of rader) {
    // Kodblock slukar allt tills det stängs
    if (/^\s*```/.test(rad)) {
      if (kod) {
        block.push({ kind: 'code', text: kod.join('\n') })
        kod = null
      } else {
        stängAllt()
        kod = []
      }
      continue
    }
    if (kod) {
      kod.push(rad)
      continue
    }

    if (!rad.trim()) {
      stängAllt()
      continue
    }

    const rubrik = rad.match(/^(#{1,4})\s+(.*)$/)
    if (rubrik) {
      stängAllt()
      const nivå = Math.min(Math.max(rubrik[1].length + nivåtillägg, 2), 4) as 2 | 3 | 4
      block.push({ kind: 'heading', level: nivå, text: rubrik[2] })
      continue
    }

    if (ärTabellrad(rad)) {
      stängStycke()
      stängLista()
      stängCitat()
      if (!tabell) tabell = { head: [], rows: [] }
      // `| --- |` är syntax, inte data
      if (ärTabellavdelare(rad)) continue
      const celler = delaTabellrad(rad)
      if (!tabell.head.length && !tabell.rows.length) tabell.head = celler
      else tabell.rows.push(celler)
      continue
    }
    stängTabell()

    // Avdelare — `---` på egen rad. Måste testas efter tabellraden ovan så att
    // `|---|---|` inte fångas här.
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(rad)) {
      stängAllt()
      block.push({ kind: 'rule' })
      continue
    }

    const numrerad = rad.match(/^\s*\d+\.\s+(.*)$/)
    if (numrerad) {
      stängStycke()
      stängCitat()
      if (!lista || !lista.ordered) {
        stängLista()
        lista = { ordered: true, items: [] }
      }
      lista.items.push(numrerad[1])
      continue
    }

    const punkt = rad.match(/^\s*[-*]\s+(.*)$/)
    if (punkt) {
      stängStycke()
      stängCitat()
      if (!lista || lista.ordered) {
        stängLista()
        lista = { ordered: false, items: [] }
      }
      // `- [ ]` / `- [x]` är checklistmarkering i korpusen, inte innehåll
      lista.items.push(punkt[1].replace(/^\[[ xX]\]\s*/, ''))
      continue
    }

    const bq = rad.match(/^\s*>\s?(.*)$/)
    if (bq) {
      stängStycke()
      stängLista()
      citat.push(bq[1])
      continue
    }

    // Vanlig textrad: fortsätt stycket, men stäng lista/citat först
    stängLista()
    stängCitat()
    stycke.push(rad.trim())
  }

  if (kod) block.push({ kind: 'code', text: kod.join('\n') })
  stängAllt()

  return block
}

/**
 * Tillåt bara scheman som inte kan köra kod. Innehållet kommer ur databasen,
 * så utan den här grinden blir `javascript:`-URL:er klickbara i artikeltexten.
 */
export function safeHref(url: string): string | null {
  const trimmad = url.trim()
  if (/^(https?:|mailto:)/i.test(trimmad)) return trimmad
  if (/^[/#]/.test(trimmad)) return trimmad // relativ sökväg eller ankare
  return null
}

/**
 * Ett inline-segment ur en textrad. Ordningen i alternationen är
 * betydelsebärande: kod-span först (så att `**fet**` inuti backticks inte
 * tolkas), sedan länk, sedan fet före kursiv.
 */
export type InlineSegment =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'strong'; text: string }
  | { kind: 'em'; text: string }

const INLINE = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g

/** Delar en textrad i inline-segment. `ArticleContent` gör element av dem. */
export function parseInline(text: string): InlineSegment[] {
  if (!text) return []

  const segment: InlineSegment[] = []
  let senast = 0
  INLINE.lastIndex = 0

  let träff: RegExpExecArray | null
  while ((träff = INLINE.exec(text)) !== null) {
    if (träff.index > senast) {
      segment.push({ kind: 'text', text: text.slice(senast, träff.index) })
    }

    if (träff[1] !== undefined) {
      segment.push({ kind: 'code', text: träff[1] })
    } else if (träff[2] !== undefined) {
      const href = safeHref(träff[3])
      // Osäkert schema — texten behålls, länken tappas
      segment.push(href ? { kind: 'link', text: träff[2], href } : { kind: 'text', text: träff[2] })
    } else if (träff[4] !== undefined) {
      segment.push({ kind: 'strong', text: träff[4] })
    } else {
      segment.push({ kind: 'em', text: träff[5] })
    }

    senast = träff.index + träff[0].length
  }
  if (senast < text.length) segment.push({ kind: 'text', text: text.slice(senast) })

  return segment
}
