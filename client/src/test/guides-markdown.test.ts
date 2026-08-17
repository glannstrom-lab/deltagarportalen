/**
 * Tester för markdown-renderaren som bygger de publika guidesidorna
 * (scripts/lib/markdown.cjs, spår K2).
 *
 * Renderaren tar innehåll ur databasen och producerar HTML som publiceras
 * publikt utan att någon läser igenom den först. Två saker måste därför
 * hålla: att escapingen inte går att ta sig förbi, och att delmängden som
 * FAKTISKT finns i korpusen renderas rätt.
 *
 * Fixturerna nedan är hämtade ur formen på prod-innehållet (markdown med
 * ##/###, listor, tabeller, checkboxar) — inte ur en bekvämare fantasiform.
 * Jfr lärdomen 2026-08-03 om fixturer som är snällare än verkligheten.
 */

import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const md = require('../../scripts/lib/markdown.cjs') as {
  markdownToHtml: (s: string) => string
  markdownToPlain: (s: string) => string
  escapeHtml: (s: string) => string
  safeHref: (s: string) => string | null
}

describe('escaping och länksäkerhet', () => {
  it('escapar HTML i brödtext', () => {
    expect(md.markdownToHtml('En <script>alert(1)</script> rad')).not.toContain('<script>')
    expect(md.markdownToHtml('En <script>alert(1)</script> rad')).toContain('&lt;script&gt;')
  })

  it('escapar HTML inuti rubriker, listor och tabellceller', () => {
    expect(md.markdownToHtml('## <img src=x onerror=1>')).toContain('&lt;img')
    expect(md.markdownToHtml('- <b>fet</b>')).toContain('&lt;b&gt;')
    expect(md.markdownToHtml('| <i>a</i> |\n| --- |\n| b |')).toContain('&lt;i&gt;')
  })

  it('släpper inte igenom javascript:-länkar', () => {
    const html = md.markdownToHtml('[klicka](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('klicka') // texten behålls, länken tappas
  })

  it('tillåter http, https, mailto och relativa sökvägar', () => {
    expect(md.safeHref('https://example.com')).toBe('https://example.com')
    expect(md.safeHref('mailto:a@b.se')).toBe('mailto:a@b.se')
    expect(md.safeHref('/cv')).toBe('/cv')
    expect(md.safeHref('data:text/html,x')).toBeNull()
    expect(md.safeHref('vbscript:x')).toBeNull()
  })

  it('sätter rel på externa länkar men inte på interna', () => {
    expect(md.markdownToHtml('[x](https://example.com)')).toContain('rel="noopener noreferrer"')
    expect(md.markdownToHtml('[x](/cv)')).not.toContain('rel=')
  })
})

describe('rubriknivåer — h1 är reserverad för sidrubriken', () => {
  it('artikel med bara ## börjar på h2', () => {
    const html = md.markdownToHtml('## Översikt\n\nText.\n\n### Detalj\n\nMer.')
    expect(html).toContain('<h2>Översikt</h2>')
    expect(html).toContain('<h3>Detalj</h3>')
    expect(html).not.toContain('<h1>')
  })

  it('artikel med både # och ## behåller sin inbördes ordning', () => {
    const html = md.markdownToHtml('# Del\n\n## Avsnitt\n\n### Underavsnitt')
    expect(html).toContain('<h2>Del</h2>')
    expect(html).toContain('<h3>Avsnitt</h3>')
    expect(html).toContain('<h4>Underavsnitt</h4>')
  })

  it('genererar aldrig h1, oavsett indata', () => {
    expect(md.markdownToHtml('# A\n\n## B\n\n### C')).not.toContain('<h1')
  })
})

describe('block som finns i korpusen', () => {
  it('renderar punktlista och tar bort checkbox-markering', () => {
    const html = md.markdownToHtml('- [ ] Första\n- [x] Andra\n- Tredje')
    expect(html).toBe('<ul><li>Första</li><li>Andra</li><li>Tredje</li></ul>')
  })

  it('renderar numrerad lista', () => {
    expect(md.markdownToHtml('1. Ett\n2. Två')).toBe('<ol><li>Ett</li><li>Två</li></ol>')
  })

  it('renderar tabell med thead och scope', () => {
    const html = md.markdownToHtml('| Typ | Längd |\n| --- | --- |\n| Vikariat | Ja |')
    expect(html).toContain('<th scope="col">Typ</th>')
    expect(html).toContain('<td>Vikariat</td>')
    expect(html).toContain('class="table-wrap"') // breda tabeller skrollar själva
    expect(html).not.toContain('| Typ |') // ingen rå pipe-text kvar
  })

  it('renderar citat och kodblock', () => {
    expect(md.markdownToHtml('> Ett citat')).toContain('<blockquote><p>Ett citat</p></blockquote>')
    expect(md.markdownToHtml('```\nkod & <här>\n```')).toContain('<pre><code>kod &amp; &lt;här&gt;')
  })

  it('slår ihop löpande rader till ett stycke men bryter på tom rad', () => {
    const html = md.markdownToHtml('Rad ett\nrad två\n\nNytt stycke')
    expect(html).toBe('<p>Rad ett rad två</p>\n<p>Nytt stycke</p>')
  })

  it('renderar fet och kursiv text', () => {
    expect(md.markdownToHtml('**fet** och *kursiv*')).toBe('<p><strong>fet</strong> och <em>kursiv</em></p>')
  })

  it('tolkar inte markdown inuti kod-span', () => {
    expect(md.markdownToHtml('`**inte fet**`')).toContain('<code>**inte fet**</code>')
  })
})

describe('markdownToPlain', () => {
  it('strippar markdown för meta description', () => {
    const plain = md.markdownToPlain('## Rubrik\n\n**Fet** text med [länk](https://x.se).\n\n- punkt')
    expect(plain).toBe('Rubrik Fet text med länk. punkt')
  })

  it('tar bort tabeller och kodblock ur ordräkningen', () => {
    expect(md.markdownToPlain('Text\n\n| a | b |\n| --- | --- |\n\n```\nkod\n```')).toBe('Text')
  })
})

/**
 * TG2 (genomgången 2026-08-17): ✅ och ❌ lästes upp som emojinamn.
 *
 * Korpusen använder dem som betydelsebärande markörer i gör/gör-inte-listor.
 * Uppmätt före fixen: 190 `❌` på 37 av 162 guidesidor (nio på den värsta) och
 * 64 `✅` — alla som bar text, noll inslagna. Skärmläsaren annonserade
 * "kryssmarkering" åtta gånger i rad, och K17:s uppläsning läste samma brus.
 *
 * Att bara stryka tecknen var inte möjligt: utan markören blir
 * "❌ Låta AI ljuga om din bakgrund" en rad som läser som ett råd att göra det.
 */
describe('TG2: statusemoji får textekvivalent', () => {
  it('slår in ❌ i aria-hidden och lägger till ett ord som säger samma sak', () => {
    const html = md.markdownToHtml('❌ Låta AI ljuga om din bakgrund')
    expect(html).toContain('<span aria-hidden="true">❌</span>')
    expect(html).toContain('<span class="sr-only">Undvik: </span>')
    expect(html).toContain('Låta AI ljuga om din bakgrund')
  })

  it('slår in ✅ likadant med sitt eget ord', () => {
    const html = md.markdownToHtml('✅ Beskriv vad du behöver')
    expect(html).toContain('<span aria-hidden="true">✅</span>')
    expect(html).toContain('<span class="sr-only">Gör så här: </span>')
  })

  it('betydelsen vänds inte — markören försvinner aldrig helt', () => {
    // Regressionsskydd mot den "enkla" fixen (stryk emojin). Den hade gjort
    // gör-inte-listan till en gör-lista för alla som inte ser tecknet.
    const html = md.markdownToHtml('❌ Kopiera AI-text rakt av')
    expect(html).toMatch(/Undvik:/)
  })

  it('täcker ALLA markörer i ett hopslaget stycke, inte bara den första', () => {
    // Det här var buggen i mitt första försök: regeln band vid radbörjan, men
    // renderaren slår ihop löpande rader till ett <p>. 139 av 254 fångades.
    const html = md.markdownToHtml('✅ Ett\n✅ Två\n✅ Tre')
    expect(html.match(/aria-hidden="true">✅<\/span>/g)).toHaveLength(3)
    expect(html.match(/sr-only">Gör så här: <\/span>/g)).toHaveLength(3)
  })

  it('fungerar i rubriker (### ❌ Dominera) — sex sådana finns i korpusen', () => {
    const html = md.markdownToHtml('### ❌ Dominera')
    expect(html).toContain('<span aria-hidden="true">❌</span>')
    expect(html).toMatch(/<h3>/)
  })

  it('rör inte annan text', () => {
    expect(md.markdownToHtml('Vanlig rad')).toBe('<p>Vanlig rad</p>')
  })
})
