/**
 * A35 — javascript:-href i AI-genererad markdown.
 *
 * MarkdownRenderer parsar AI-svar med en egen inline-parser och bygger
 * `<a href={...}>` direkt i JSX — en väg som aldrig går genom DOMPurify
 * (den skyddar bara dangerouslySetInnerHTML-callsites, se utils/sanitize.ts).
 * React saniterar INTE href mot javascript:-URLer, så en modell (eller en
 * prompt-injektion den lyder) kan lägga en `[Klicka här](javascript:...)`-
 * länk i sitt svar och få kod att exekvera i deltagarens session vid klick.
 *
 * Testet renderar komponenten på riktigt och läser den faktiska DOM:en —
 * inte bara att en hjälpfunktion anropades.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from './MarkdownRenderer'

// RÄTTAT 2026-08-23: här stod tidigare att inline-regexen kräver minst ett
// tecken FÖRE markeringen, och testfallet valdes för att gå runt det — som om
// begränsningen vore avsiktlig. Den var en bugg: alla fyra mönstren (fet,
// kursiv, kod, länk) misslyckades i början av en rad, och systemprompten i
// `client/api/ai.js` instruerar uttryckligen modellen att inleda varje punkt
// med `**Rubrik**`. Se testerna längst ned i filen.
describe('MarkdownRenderer — länksanering', () => {
  it('renderar INTE en javascript:-URL som klickbar href', () => {
    render(<MarkdownRenderer content="Läs mer här: [Klicka här](javascript:alert(1))" />)

    const link = screen.queryByRole('link', { name: /Klicka här/i })
    expect(link).toBeNull()
    // Texten ska finnas kvar — bara klickbarheten på den farliga URL:en tas bort.
    expect(screen.getByText('Klicka här', { exact: false })).toBeInTheDocument()
  })

  it('renderar INTE en obfuskerad javascript:-URL (tab-tecken) som href', () => {
    render(<MarkdownRenderer content={'Läs mer här: [Öppna](java\tscript:alert(1))'} />)

    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renderar INTE en HTML-entitet-obfuskerad javascript:-URL som href', () => {
    render(<MarkdownRenderer content="Läs mer här: [Öppna](&#106;avascript:alert(1))" />)

    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renderar INTE en data:-URL som href', () => {
    render(<MarkdownRenderer content="Läs mer här: [Öppna](data:text/html,<script>alert(1)</script>)" />)

    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renderar EN vanlig https-länk som klickbar href', () => {
    render(<MarkdownRenderer content="Se annonsen: [Arbetsförmedlingen](https://arbetsformedlingen.se)" />)

    const link = screen.getByRole('link', { name: /Arbetsförmedlingen/i })
    expect(link).toHaveAttribute('href', 'https://arbetsformedlingen.se')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

/**
 * Fetstil, kursiv, kod och länk i BÖRJAN av en rad.
 *
 * Alla fyra inline-mönstren inleddes med `^(.+?)` — minst ett tecken före
 * markeringen. En rad som börjar med `**Rubrik**` matchade alltså aldrig, och
 * asteriskerna renderades som synlig text. Det är inte ett kantfall: systemprompten
 * i `client/api/ai.js` säger ordagrant "Formatera så här: **Rubrik 1**", så
 * modellen inleder nästan varje punkt precis så. Uppmätt i webbläsaren
 * 2026-08-23: hela AI-svaret fullt av `**`.
 *
 * Mutationskontroll: ändra tillbaka något mönster till `^(.+?)` och testet faller.
 */
describe('MarkdownRenderer — inline-markering först på raden', () => {
  it('renderar fetstil som inleder en rad', () => {
    render(<MarkdownRenderer content="**Ansök till sparade jobb** Skicka in ansökningarna." />)

    expect(screen.getByText('Ansök till sparade jobb').tagName).toBe('STRONG')
    expect(screen.queryByText(/\*\*/)).toBeNull()
  })

  it('renderar kursiv som inleder en rad', () => {
    render(<MarkdownRenderer content="*Observera* att villkoren ändras." />)

    expect(screen.getByText('Observera').tagName).toBe('EM')
  })

  it('renderar en länk som inleder en rad', () => {
    render(<MarkdownRenderer content="[Arbetsförmedlingen](https://arbetsformedlingen.se) har mer information." />)

    const länk = screen.getByRole('link', { name: /Arbetsförmedlingen/i })
    expect(länk).toHaveAttribute('href', 'https://arbetsformedlingen.se')
    expect(länk).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renderar fetstil mitt i en rad också — den vägen var aldrig trasig', () => {
    render(<MarkdownRenderer content="Du bör **verkligen** söka." />)

    expect(screen.getByText('verkligen').tagName).toBe('STRONG')
  })
})

/**
 * Tabeller.
 *
 * `parseMarkdown` hade ingen tabellgren. Rader som börjar med `|` föll ned i
 * paragraf-grenen, som slog ihop dem till en enda rad — varken seende eller
 * skärmläsare kunde läsa strukturen.
 */
describe('MarkdownRenderer — tabeller', () => {
  const TABELL = ['| Villkor | Betyder |', '| --- | --- |', '| Medlemsvillkoret | Hur länge du varit medlem |'].join('\n')

  it('renderar en riktig tabell med kolumnrubriker', () => {
    render(<MarkdownRenderer content={TABELL} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    const rubrik = screen.getByRole('columnheader', { name: 'Villkor' })
    expect(rubrik).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('cell', { name: 'Medlemsvillkoret' })).toBeInTheDocument()
  })

  it('lämnar inga pipes kvar som text', () => {
    const { container } = render(<MarkdownRenderer content={TABELL} />)

    expect(container.textContent).not.toMatch(/\|\s*---/)
  })
})
