/**
 * Tester för artikelrenderaren (`ArticleContent`).
 *
 * Buggen som föranledde komponenten: `pages/Article.tsx` delade innehållet på
 * `\n\n` och kände varken igen markdown-tabeller eller `# `-rubriker. Mätt i
 * `content/articles.snapshot.json`: 23 av 133 artiklar innehåller tabeller och
 * visade rå pipe-text (`| Typ | Tidsbegränsning | …`) för deltagarna, och 13
 * artiklar använder `# ` som renderades som brödtext.
 *
 * Fixturerna nedan är KOPIERADE ORDAGRANT ur prod-innehållet
 * (`content/articles.snapshot.json`, artiklarna `anstallningsformer-guide` och
 * `anpassningar-arbetsplatsen`) — inte påhittade. Jfr lärdomen 2026-08-03 om
 * fixturer som är snällare än verkligheten: tabellen nedan har till exempel en
 * avdelarrad utan blanksteg (`|-----|---…`) och en sista rad med en TOM cell,
 * två saker en påhittad fixtur hade missat.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import ArticleContent from './ArticleContent'
import { parseArticleMarkdown, safeHref } from './articleMarkdown'

afterEach(cleanup)

/** Ordagrant ur `anstallningsformer-guide` (rad 1–12 av artikelns content). */
const ANSTALLNINGSFORMER = [
  'Att förstå olika anställningsformer hjälper dig göra medvetna val och veta vad du har rätt till. Här är en komplett guide.',
  '',
  '## Översikt: Anställningsformer i Sverige',
  '',
  '| Typ | Tidsbegränsning | Uppsägningsskydd | Vanligast för |',
  '|-----|-----------------|------------------|---------------|',
  '| Tillsvidare | Nej | Starkast | Ordinarie tjänster |',
  '| Visstid | Ja | Begränsat | Projekt, säsong |',
  '| Vikariat | Ja | Begränsat | Ersätta frånvarande |',
  '| Provanställning | Max 6 mån | Svagast | Nya anställningar |',
  '| Timanställning | Varierande | Begränsat | Extrajobb |',
  '',
  '## Tillsvidareanställning (Fast anställning)',
].join('\n')

/** Ordagrant ur samma artikel — tabellen med en tom sista cell. */
const PROVANSTALLNING = [
  '### Dina rättigheter under provanställning',
  '',
  '| Du HAR rätt till | Du har INTE rätt till |',
  '|------------------|----------------------|',
  '| Samma lön som utlyst | Motivering vid avbrott |',
  '| Arbetsmiljöskydd | Turordningsskydd |',
  '| Semester | Uppsägningsskydd |',
  '| Kollektivavtalets villkor | |',
].join('\n')

/** Ordagrant ur `anpassningar-arbetsplatsen` — en av de 13 med `# `-rubrik. */
const ANPASSNINGAR = [
  '# Anpassningar på arbetsplatsen - dina möjligheter',
  '',
  'Om du har en funktionsnedsättning eller hälsoutmaning har du rätt till anpassningar som gör att du kan utföra ditt arbete. Här är vad du behöver veta.',
  '',
  '## Vad är arbetsplatsanpassningar?',
  '',
  '### Definition',
  'Förändringar i arbetsmiljön, arbetsuppgifter eller arbetstider som gör att en person med funktionsnedsättning kan utföra sitt jobb på lika villkor som andra.',
].join('\n')

describe('tabeller — buggen som fick 23 artiklar att visa pipe-text', () => {
  it('renderar en riktig tabell i stället för rå pipe-text', () => {
    const { container } = render(<ArticleContent content={ANSTALLNINGSFORMER} />)

    const tabell = container.querySelector('table')
    expect(tabell, 'ingen <table> renderades').not.toBeNull()

    // Det som deltagarna såg förut får inte finnas kvar någonstans i texten
    expect(container.textContent).not.toContain('| Typ |')
    expect(container.textContent).not.toContain('|-----|')
  })

  it('gör första raden till thead med scope="col"', () => {
    render(<ArticleContent content={ANSTALLNINGSFORMER} />)

    const rubriker = screen.getAllByRole('columnheader')
    expect(rubriker.map((c) => c.textContent)).toEqual([
      'Typ',
      'Tidsbegränsning',
      'Uppsägningsskydd',
      'Vanligast för',
    ])
    rubriker.forEach((c) => expect(c.getAttribute('scope')).toBe('col'))
  })

  it('hoppar över avdelarraden och lägger resten i tbody', () => {
    const { container } = render(<ArticleContent content={ANSTALLNINGSFORMER} />)

    const tbody = container.querySelector('tbody')
    expect(tbody).not.toBeNull()
    const rader = within(tbody as HTMLElement).getAllByRole('row')
    expect(rader).toHaveLength(5) // fem anställningsformer, ingen avdelarrad

    const celler = within(rader[0]).getAllByRole('cell')
    expect(celler.map((c) => c.textContent)).toEqual([
      'Tillsvidare',
      'Nej',
      'Starkast',
      'Ordinarie tjänster',
    ])
  })

  it('behåller tomma celler så att kolumnerna inte glider ur led', () => {
    const { container } = render(<ArticleContent content={PROVANSTALLNING} />)
    const rader = within(container.querySelector('tbody') as HTMLElement).getAllByRole('row')

    // Sista raden i prod-tabellen har en tom andra cell
    const sista = within(rader[rader.length - 1]).getAllByRole('cell')
    expect(sista).toHaveLength(2)
    expect(sista[0].textContent).toBe('Kollektivavtalets villkor')
    expect(sista[1].textContent).toBe('')
  })

  it('avslutar tabellen när brödtexten börjar igen', () => {
    const block = parseArticleMarkdown(ANSTALLNINGSFORMER)
    const typer = block.map((b) => b.kind)
    expect(typer).toEqual(['paragraph', 'heading', 'table', 'heading'])
  })

  it('renderar flera tabeller i samma artikel var för sig', () => {
    const { container } = render(
      <ArticleContent content={`${ANSTALLNINGSFORMER}\n\n${PROVANSTALLNING}`} />
    )
    expect(container.querySelectorAll('table')).toHaveLength(2)
  })

  it('formaterar inline-markdown inuti tabellceller', () => {
    render(<ArticleContent content={'| **Typ** |\n| --- |\n| *vikariat* |'} />)
    expect(screen.getByRole('columnheader').querySelector('strong')?.textContent).toBe('Typ')
    expect(screen.getByRole('cell').querySelector('em')?.textContent).toBe('vikariat')
  })
})

describe('tabellen skrollar i sin egen behållare', () => {
  it('lägger tabellen i en behållare med overflow-x-auto', () => {
    render(<ArticleContent content={ANSTALLNINGSFORMER} />)
    const behållare = screen.getByTestId('artikel-tabell-skroll')

    // Sidan får aldrig skrolla i sidled — behållaren gör det i stället
    expect(behållare.className).toContain('overflow-x-auto')
    expect(behållare.querySelector('table')).not.toBeNull()
  })

  it('är inte ett tabbstopp när tabellen får plats', () => {
    render(<ArticleContent content={ANSTALLNINGSFORMER} />)
    const behållare = screen.getByTestId('artikel-tabell-skroll')

    // Onödiga tabbstopp kostar mest för dem som navigerar med tangentbord
    expect(behållare).not.toHaveAttribute('tabindex')
    expect(behållare).not.toHaveAttribute('role')
  })

  it('blir fokuserbar och namngiven när innehållet svämmar över', () => {
    // jsdom har ingen layout — vi simulerar en tabell bredare än behållaren
    const scrollWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollWidth'
    )
    const clientWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientWidth'
    )
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 800,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 320,
    })

    try {
      render(<ArticleContent content={ANSTALLNINGSFORMER} />)
      const behållare = screen.getByTestId('artikel-tabell-skroll')

      // WCAG 2.1.1 — skrollbart innehåll måste gå att nå med tangentbord
      expect(behållare).toHaveAttribute('tabindex', '0')
      expect(behållare).toHaveAttribute('role', 'region')
      expect(behållare.getAttribute('aria-label')).toBeTruthy()
    } finally {
      if (scrollWidth) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidth)
      if (clientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidth)
    }
  })
})

describe('rubriknivåer — h1 är reserverad för artikelns titel', () => {
  it('artikel utan # börjar på h2 och går vidare till h3', () => {
    const { container } = render(
      <ArticleContent content={'## Översikt\n\nText.\n\n### Detalj\n\nMer.'} />
    )
    expect(container.querySelector('h2')?.textContent).toBe('Översikt')
    expect(container.querySelector('h3')?.textContent).toBe('Detalj')
    expect(container.querySelector('h1')).toBeNull()
  })

  it('artikel med # skjuter ner alla nivåer ett steg', () => {
    const { container } = render(<ArticleContent content={ANPASSNINGAR} />)

    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('h2')?.textContent).toBe(
      'Anpassningar på arbetsplatsen - dina möjligheter'
    )
    expect(container.querySelector('h3')?.textContent).toBe('Vad är arbetsplatsanpassningar?')
    expect(container.querySelector('h4')?.textContent).toBe('Definition')
  })

  it('hoppar aldrig ett rubriksteg', () => {
    const { container } = render(<ArticleContent content={ANPASSNINGAR} />)
    const nivåer = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) =>
      Number(h.tagName.slice(1))
    )
    nivåer.forEach((nivå, i) => {
      if (i === 0) return
      expect(nivå - nivåer[i - 1]).toBeLessThanOrEqual(1)
    })
  })

  it('renderade tidigare # som brödtext — nu är det en rubrik', () => {
    const { container } = render(<ArticleContent content={ANPASSNINGAR} />)
    expect(container.textContent).not.toContain('# Anpassningar')
  })
})

describe('övriga block som finns i korpusen', () => {
  it('renderar punktlista och tar bort checkbox-markering', () => {
    render(<ArticleContent content={'- [ ] Första\n- [x] Andra\n- Tredje'} />)
    const punkter = screen.getAllByRole('listitem')
    expect(punkter.map((p) => p.textContent)).toEqual(['Första', 'Andra', 'Tredje'])
  })

  it('renderar numrerad lista som <ol>', () => {
    const { container } = render(<ArticleContent content={'1. Ett\n2. Två'} />)
    expect(container.querySelector('ol')).not.toBeNull()
    expect(container.querySelectorAll('ol > li')).toHaveLength(2)
  })

  it('renderar citat, avdelare och kodblock', () => {
    const { container } = render(
      <ArticleContent content={'> Ett citat\n\n---\n\n```\nkod & <här>\n```'} />
    )
    expect(container.querySelector('blockquote')?.textContent).toBe('Ett citat')
    expect(container.querySelector('hr')).not.toBeNull()
    expect(container.querySelector('pre code')?.textContent).toBe('kod & <här>')
  })

  it('slår ihop löpande rader till ett stycke men bryter på tom rad', () => {
    const { container } = render(
      <ArticleContent content={'Rad ett\nrad två\n\nNytt stycke'} />
    )
    const stycken = Array.from(container.querySelectorAll('p')).map((p) => p.textContent)
    expect(stycken).toEqual(['Rad ett rad två', 'Nytt stycke'])
  })

  it('renderar fet och kursiv text', () => {
    const { container } = render(<ArticleContent content={'**fet** och *kursiv*'} />)
    expect(container.querySelector('strong')?.textContent).toBe('fet')
    expect(container.querySelector('em')?.textContent).toBe('kursiv')
  })

  it('tolkar inte markdown inuti kod-span', () => {
    const { container } = render(<ArticleContent content={'`**inte fet**`'} />)
    expect(container.querySelector('code')?.textContent).toBe('**inte fet**')
    expect(container.querySelector('strong')).toBeNull()
  })

  it('klarar tomt innehåll utan att krascha', () => {
    const { container } = render(<ArticleContent content={''} />)
    expect(container.textContent).toBe('')
  })
})

describe('säkerhet — innehållet kommer ur databasen', () => {
  it('renderar HTML i innehållet som text, aldrig som element', () => {
    const { container } = render(
      <ArticleContent content={'En <script>alert(1)</script> rad'} />
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('<script>alert(1)</script>')
  })

  it('injicerar inte HTML via tabellceller eller rubriker', () => {
    const { container } = render(
      <ArticleContent content={'## <img src=x onerror=1>\n\n| <b>a</b> |\n| --- |\n| b |'} />
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })

  it('släpper inte igenom javascript:-länkar men behåller texten', () => {
    const { container } = render(<ArticleContent content={'[klicka](javascript:alert(1))'} />)
    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toContain('klicka')
  })

  it('tillåter http, https, mailto och relativa sökvägar', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com')
    expect(safeHref('mailto:a@b.se')).toBe('mailto:a@b.se')
    expect(safeHref('/cv')).toBe('/cv')
    expect(safeHref('data:text/html,x')).toBeNull()
    expect(safeHref('vbscript:x')).toBeNull()
  })

  it('sätter rel på externa länkar men inte på interna', () => {
    const { container: extern } = render(<ArticleContent content={'[x](https://example.com)'} />)
    expect(extern.querySelector('a')).toHaveAttribute('rel', 'noopener noreferrer')

    cleanup()
    const { container: intern } = render(<ArticleContent content={'[x](/cv)'} />)
    expect(intern.querySelector('a')).not.toHaveAttribute('rel')
  })
})

describe('textstorleken påverkar rubrikskalan', () => {
  it('växer när läsaren väljer större text', () => {
    const { container: normal } = render(<ArticleContent content={'## Rubrik'} />)
    const normalKlass = normal.querySelector('h2')?.className ?? ''

    cleanup()
    const { container: stor } = render(
      <ArticleContent content={'## Rubrik'} fontSize="xlarge" />
    )
    const storKlass = stor.querySelector('h2')?.className ?? ''

    expect(normalKlass).toContain('text-xl')
    expect(storKlass).toContain('text-3xl')
  })
})
