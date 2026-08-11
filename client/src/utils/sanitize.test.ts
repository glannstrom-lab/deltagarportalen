import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  sanitizeHTMLWithLineBreaks,
  stripHTML,
  containsDangerousHTML,
  sanitizeHref,
} from './sanitize'

/**
 * XSS-skyddet för allt externt HTML-innehåll (jobbannonser från AF,
 * artikeltexter) som renderas med dangerouslySetInnerHTML. Går det här
 * sönder blir det inte ett fult UI — det blir körbar främmande kod i
 * deltagarens session.
 */
describe('sanitizeHTML', () => {
  it('släpper igenom ofarlig formatering', () => {
    const out = sanitizeHTML('<p>Vi söker en <strong>lagerarbetare</strong></p>')

    expect(out).toContain('<strong>lagerarbetare</strong>')
    expect(out).toContain('<p>')
  })

  it('tar bort script-taggar helt', () => {
    const out = sanitizeHTML('<p>Hej</p><script>alert("xss")</script>')

    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert')
    expect(out).toContain('<p>Hej</p>')
  })

  it('tar bort iframe, object och embed', () => {
    for (const tag of ['iframe', 'object', 'embed']) {
      const out = sanitizeHTML(`<p>ok</p><${tag} src="evil"></${tag}>`)
      expect(out).not.toContain(`<${tag}`)
    }
  })

  it('tar bort inline event-handlers', () => {
    const out = sanitizeHTML('<div onclick="stealCookies()">Klicka</div>')

    expect(out).not.toContain('onclick')
    expect(out).not.toContain('stealCookies')
    expect(out).toContain('Klicka')
  })

  it('nollar javascript:-länkar', () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">Klicka</a>')

    expect(out).not.toContain('javascript:')
  })

  it('nollar data:-länkar', () => {
    const out = sanitizeHTML('<a href="data:text/html;base64,PHNjcmlwdD4=">Klicka</a>')

    expect(out).not.toContain('data:text/html')
  })

  it('ger externa länkar target=_blank och rel=noopener noreferrer', () => {
    const out = sanitizeHTML('<a href="https://arbetsformedlingen.se/jobb">Annonsen</a>')

    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('lämnar interna länkar utan target=_blank', () => {
    const out = sanitizeHTML(`<a href="https://${window.location.hostname}/jobb">Internt</a>`)

    expect(out).not.toContain('target="_blank"')
  })

  it('returnerar tom sträng för null, undefined och tomt', () => {
    expect(sanitizeHTML(null)).toBe('')
    expect(sanitizeHTML(undefined)).toBe('')
    expect(sanitizeHTML('')).toBe('')
  })

  it('tar bort taggar som inte står på tillåtlistan men behåller texten', () => {
    const out = sanitizeHTML('<table><tr><td>Lön</td></tr></table>')

    expect(out).not.toContain('<table')
    expect(out).toContain('Lön')
  })
})

describe('sanitizeHTMLWithLineBreaks', () => {
  it('gör om radbrytningar till <br/>', () => {
    const out = sanitizeHTMLWithLineBreaks('Rad ett\nRad två')

    expect(out).toBe('Rad ett<br/>Rad två')
  })

  it('saniterar först och bryter rader sedan', () => {
    const out = sanitizeHTMLWithLineBreaks('Rad ett\nRad två<script>evil()</script>')

    expect(out).not.toContain('<script')
    expect(out).not.toContain('evil()')
    expect(out).toBe('Rad ett<br/>Rad två')
  })

  it('returnerar tom sträng för tomt innehåll', () => {
    expect(sanitizeHTMLWithLineBreaks(null)).toBe('')
    expect(sanitizeHTMLWithLineBreaks(undefined)).toBe('')
  })
})

describe('stripHTML', () => {
  it('tar bort all markup men behåller texten', () => {
    const out = stripHTML('<p>Ett <strong>viktigt</strong> jobb</p>')

    expect(out).not.toContain('<')
    expect(out).toContain('Ett')
    expect(out).toContain('viktigt')
    expect(out).toContain('jobb')
  })

  it('tar bort script-innehåll, inte bara taggen', () => {
    const out = stripHTML('Text<script>alert(1)</script>')

    expect(out).not.toContain('alert(1)')
  })

  it('returnerar tom sträng för tomt innehåll', () => {
    expect(stripHTML(null)).toBe('')
    expect(stripHTML(undefined)).toBe('')
    expect(stripHTML('')).toBe('')
  })
})

/**
 * A35: MarkdownRenderer.tsx bygger `<a href={...}>` direkt i JSX från
 * AI-genererad markdown — utanför DOMPurify, som bara skyddar
 * dangerouslySetInnerHTML-vägen ovan. sanitizeHref() är den enda spärren
 * mellan modellens/en prompt-injektions text och en klickbar javascript:-URL.
 */
describe('sanitizeHref', () => {
  it('avvisar javascript:-URLer', () => {
    expect(sanitizeHref('javascript:alert(1)')).toBeNull()
  })

  it('avvisar javascript: oavsett skiftläge', () => {
    expect(sanitizeHref('JavaScript:alert(1)')).toBeNull()
    expect(sanitizeHref('JAVASCRIPT:alert(1)')).toBeNull()
  })

  it('avvisar javascript: med inbäddat tab-tecken (java\\tscript:)', () => {
    expect(sanitizeHref('java\tscript:alert(1)')).toBeNull()
  })

  it('avvisar javascript: med inbäddad radbrytning (java\\nscript:)', () => {
    expect(sanitizeHref('java\nscript:alert(1)')).toBeNull()
  })

  it('avvisar javascript: obfuskerad med HTML-entiteter (&#106;avascript:)', () => {
    expect(sanitizeHref('&#106;avascript:alert(1)')).toBeNull()
  })

  it('avvisar javascript: obfuskerad med hex-HTML-entiteter (&#x6A;avascript:)', () => {
    expect(sanitizeHref('&#x6A;avascript:alert(1)')).toBeNull()
  })

  it('avvisar data:-URLer', () => {
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('avvisar vbscript:-URLer', () => {
    expect(sanitizeHref('vbscript:msgbox(1)')).toBeNull()
  })

  it('avvisar file:-URLer', () => {
    expect(sanitizeHref('file:///etc/passwd')).toBeNull()
  })

  it('släpper igenom https-länkar', () => {
    expect(sanitizeHref('https://arbetsformedlingen.se/jobb')).toBe('https://arbetsformedlingen.se/jobb')
  })

  it('släpper igenom http-länkar', () => {
    expect(sanitizeHref('http://example.com')).toBe('http://example.com')
  })

  it('släpper igenom mailto-länkar', () => {
    expect(sanitizeHref('mailto:test@example.com')).toBe('mailto:test@example.com')
  })

  it('släpper igenom tel-länkar', () => {
    expect(sanitizeHref('tel:+46701234567')).toBe('tel:+46701234567')
  })

  it('släpper igenom relativa länkar', () => {
    expect(sanitizeHref('/jobb/123')).toBe('/jobb/123')
  })

  it('släpper igenom ankarlänkar', () => {
    expect(sanitizeHref('#sektion')).toBe('#sektion')
  })

  it('returnerar null för tomt/null/undefined', () => {
    expect(sanitizeHref('')).toBeNull()
    expect(sanitizeHref(null)).toBeNull()
    expect(sanitizeHref(undefined)).toBeNull()
    expect(sanitizeHref('   ')).toBeNull()
  })
})

describe('containsDangerousHTML', () => {
  it.each([
    ['<script>x</script>'],
    ['<SCRIPT>x</SCRIPT>'],
    ['<a href="javascript:x">'],
    ['<div onclick="x">'],
    ['<div onerror = "x">'],
    ['<iframe src="x">'],
    ['<object data="x">'],
    ['<embed src="x">'],
  ])('flaggar %s', (html) => {
    expect(containsDangerousHTML(html)).toBe(true)
  })

  it.each([
    ['<p>Vanlig text</p>'],
    ['<strong>Fet</strong> och <em>kursiv</em>'],
    ['<a href="https://example.com">Länk</a>'],
    ['Ren text utan markup'],
    [''],
  ])('flaggar INTE %s', (html) => {
    expect(containsDangerousHTML(html)).toBe(false)
  })
})
