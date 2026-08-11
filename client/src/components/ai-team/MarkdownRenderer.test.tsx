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

// InlineMarkdown-regexet för länkar (`^(.+?)\[...\]\(...\)`) kräver minst ett
// tecken FÖRE `[` för att träffa — samma mönster som fet/kursiv-reglerna i
// samma parser. En rad som redan innehåller inledande text (precis som ett
// AI-svar normalt formulerar sig, "Läs mer här: [länk](url)") är alltså det
// realistiska testfallet, inte en länk som absolut första tecken.
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
