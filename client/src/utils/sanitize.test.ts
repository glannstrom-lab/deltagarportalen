import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  sanitizeHTMLWithLineBreaks,
  stripHTML,
  containsDangerousHTML,
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
