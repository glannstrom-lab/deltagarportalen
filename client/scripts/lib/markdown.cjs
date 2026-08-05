/**
 * Markdown → HTML för de statiska guidesidorna.  (spår K2, 2026-08-05)
 *
 * Ingen ny dependency. Delmängden är MÄTT mot de 133 aktiva artiklarna i
 * prod, inte gissad:
 *
 *   ## rubrik      133 artiklar      | tabell         23
 *   ### rubrik     121               | checkbox-lista 24
 *   - lista        132               | # rubrik        1
 *   1. lista        89               | > citat         9
 *   **fet**        123               | kodblock        4
 *   [länk](url)      1               | rå HTML         0
 *
 * (`# rubrik` var 13 vid mätningen; 12 av dem var ordagranna dubbletter av
 * artikelns `title` och togs bort ur prod 2026-08-05 — se
 * scripts/apply-article-corrections.cjs. Kvar är `latt-svenska-avslag`, där
 * `#`-raden är en riktig sektionsrubrik.)
 *
 * Notera: `Article.tsx` i appen hanterar VARKEN tabeller eller `# `-rubriker.
 * De 23 artiklarna med tabeller visar rå pipe-text i portalen i dag. De här
 * sidorna renderar dem korrekt — se ROADMAP K2 för buggraden som föll ut.
 *
 * Säkerhet: rå HTML escapas alltid (korpusen innehåller noll, så det är
 * förlustfritt), och länkar släpps bara igenom för http/https/mailto samt
 * relativa sökvägar — annars blir `javascript:`-URL:er klickbara.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c])

/** Sentinel för utplockade kod-spans. Kan inte komma ur escapeHtml. */
const SENTINEL = '\u0000'

/** Tillåt bara scheman som inte kan köra kod. */
function safeHref(url) {
  const trimmed = url.trim()
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
  if (/^[/#]/.test(trimmed)) return trimmed // relativ sökväg eller ankare
  return null
}

/**
 * Inline-formatering. Körs ALLTID på redan escapad text — ordningen är
 * säkerhetskritisk, inte kosmetisk.
 */
function renderInline(raw) {
  let out = escapeHtml(raw)

  // Kod-spans plockas UT och läggs tillbaka SIST. Att bara byta dem mot
  // <code> räcker inte — fet/kursiv-reglerna nedan skulle fortfarande matcha
  // innehållet inuti taggen. (Fångat av testet "tolkar inte markdown inuti
  // kod-span".)
  const kod = []
  out = out.replace(
    /`([^`\n]+)`/g,
    (_, code) => `${SENTINEL}${kod.push(code) - 1}${SENTINEL}`
  )

  // [text](url)
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, text, url) => {
    // URL:en är escapad; &amp; måste tillbaka innan den valideras och sätts in
    const href = safeHref(url.replace(/&amp;/g, '&'))
    if (!href) return text
    const external = /^https?:/i.test(href)
    const attrs = external ? ' rel="noopener noreferrer"' : ''
    return `<a href="${escapeHtml(href)}"${attrs}>${text}</a>`
  })

  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

  // Kod-spans tillbaka, orörda av formateringen ovan.
  out = out.replace(
    new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g'),
    (_, i) => `<code>${kod[Number(i)]}</code>`
  )

  return out
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l)
const isTableDivider = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l)
const splitRow = (l) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

/**
 * @param {string} content markdown ur articles.content
 * @returns {string} HTML-fragment (utan omslutande <article>)
 */
function markdownToHtml(content) {
  const text = String(content).replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const out = []

  /**
   * Basnivån beror på artikeln, inte på vad som råkar stå före den i mallen.
   * Mätt i korpusen (2026-08-05, efter rubrikrättningen): 132 artiklar har
   * bara `##`, 1 har både `#` och `##`, 0 har bara `#`.
   *   - Har artikeln `#` är det dess supersektion → `#`→h2, `##`→h3, `###`→h4
   *   - Annars är `##` artikelns toppnivå        → `##`→h2, `###`→h3
   * h1 är alltid reserverad för sidrubriken, så brödtexten börjar på h2 och
   * rubrikordningen kan aldrig hoppa.
   */
  const offset = /(^|\n)# /.test(text) ? 1 : 0

  let para = [] // öppet stycke
  let list = null // { type: 'ul' | 'ol', items: string[] }
  let quote = []
  let table = null // { head: string[], rows: string[][] }
  let code = null // string[]

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${renderInline(para.join(' '))}</p>`)
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      const items = list.items.map((i) => `<li>${renderInline(i)}</li>`).join('')
      out.push(`<${list.type}>${items}</${list.type}>`)
      list = null
    }
  }
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>`)
      quote = []
    }
  }
  const flushTable = () => {
    if (table) {
      const head = table.head.length
        ? `<thead><tr>${table.head.map((c) => `<th scope="col">${renderInline(c)}</th>`).join('')}</tr></thead>`
        : ''
      const body = table.rows.length
        ? `<tbody>${table.rows.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
        : ''
      // Breda tabeller ska skrolla i sin egen behållare, aldrig sidan.
      out.push(`<div class="table-wrap"><table>${head}${body}</table></div>`)
      table = null
    }
  }
  const flushAll = () => {
    flushPara()
    flushList()
    flushQuote()
    flushTable()
  }

  for (const line of lines) {
    // Kodblock slukar allt tills det stängs
    if (/^\s*```/.test(line)) {
      if (code) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
        code = null
      } else {
        flushAll()
        code = []
      }
      continue
    }
    if (code) {
      code.push(line)
      continue
    }

    if (!line.trim()) {
      flushAll()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      flushAll()
      const level = Math.min(Math.max(heading[1].length + offset, 2), 4)
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    if (isTableRow(line)) {
      flushPara()
      flushList()
      flushQuote()
      if (!table) table = { head: [], rows: [] }
      if (isTableDivider(line)) continue
      const cells = splitRow(line)
      if (!table.head.length && !table.rows.length) table.head = cells
      else table.rows.push(cells)
      continue
    }
    flushTable()

    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      flushPara()
      flushQuote()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ol[1])
      continue
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      flushPara()
      flushQuote()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      // `- [ ]` / `- [x]` är checklistmarkering i korpusen, inte innehåll
      list.items.push(ul[1].replace(/^\[[ xX]\]\s*/, ''))
      continue
    }

    const bq = line.match(/^\s*>\s?(.*)$/)
    if (bq) {
      flushPara()
      flushList()
      quote.push(bq[1])
      continue
    }

    // Vanlig textrad: fortsätt stycket, men stäng lista/citat först
    flushList()
    flushQuote()
    para.push(line.trim())
  }

  if (code) out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  flushAll()

  return out.join('\n')
}

/** Ren text ur markdown — för meta description och ordräkning. */
function markdownToPlain(content) {
  return String(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*\|.*$/gm, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+(\[[ xX]\]\s*)?/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

module.exports = { markdownToHtml, markdownToPlain, renderInline, escapeHtml, safeHref }
