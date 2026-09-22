/**
 * CV-PDF:en föll för namn utanför Latin-1 (2026-09-22).
 *
 * `cv-pdf.js` satte `Content-Disposition: attachment; filename="CV_<namn>.pdf"`
 * med namnet rått. Node kastar `ERR_INVALID_CHAR` för headervärden med tecken
 * över U+00FF, så Łukasz, Nguyễn eller محمد fick en 500 med texten "Invalid
 * character in header content" — efter att Chromium redan renderat hela PDF:en.
 * Portalens målgrupp inkluderar nyanlända; det är inget kantfall.
 *
 * Testet använder Nodes egen `validateHeaderValue`, samma kontroll som
 * `res.setHeader` gör i drift.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { validateHeaderValue } from 'node:http'

const require = createRequire(import.meta.url)
const { byggContentDisposition } = require(resolve(__dirname, '../../api/cv-pdf.js')) as {
  byggContentDisposition: (f: unknown, l: unknown) => string
}

describe('cv-pdf: Content-Disposition', () => {
  it.each([
    ['Łukasz', 'Kowalski'],
    ['Nguyễn', 'Văn An'],
    ['محمد', 'علي'],
    ['Åsa', 'Öberg'],
    ['Anna "Annie"', 'Svensson'],
  ])('%s %s ger en giltig header', (fornamn, efternamn) => {
    const header = byggContentDisposition(fornamn, efternamn)
    expect(() => validateHeaderValue('Content-Disposition', header)).not.toThrow()
    // Reserven i filename= är ren ASCII och har inga citattecken inuti.
    const reserv = header.match(/filename="([^"]*)"/)?.[1] ?? ''
    expect(reserv).toMatch(/^[A-Za-z0-9._-]+\.pdf$/)
  })

  it('bär det riktiga namnet i filename*', () => {
    const header = byggContentDisposition('Łukasz', 'Kowalski')
    const utf8 = header.match(/filename\*=UTF-8''(.+)$/)?.[1] ?? ''
    expect(decodeURIComponent(utf8)).toBe('CV_Łukasz_Kowalski.pdf')
  })

  it('faller tillbaka på "cv" när namnet saknas', () => {
    expect(byggContentDisposition(undefined, undefined)).toContain('filename="CV_cv_.pdf"')
  })

  it('den gamla formen var det som föll', () => {
    // Dokumenterar premissen: utan omkodning kastar Node.
    expect(() => validateHeaderValue('Content-Disposition', 'attachment; filename="CV_Łukasz_Kowalski.pdf"')).toThrow()
  })
})
