import { describe, it, expect } from 'vitest'
import { safeReturnTo, medReturnTo } from './returnTo'

describe('safeReturnTo', () => {
  describe('släpper igenom interna sökvägar', () => {
    it.each([
      ['/cv', '/cv'],
      ['/cv/steg-2', '/cv/steg-2'],
      ['/job-search?q=lager', '/job-search?q=lager'],
      ['/cv#topp', '/cv#topp'],
      ['/knowledge-base/article/cv-grunder', '/knowledge-base/article/cv-grunder'],
      // Procentkodad sökväg — så här kommer den ur URLSearchParams ibland.
      ['%2Fcv', '/cv'],
    ])('%s → %s', (indata, forvantat) => {
      expect(safeReturnTo(indata)).toBe(forvantat)
    })
  })

  describe('nekar allt som kan leda ut ur sajten', () => {
    it.each([
      ['https://ondsajt.se'],
      ['http://ondsajt.se'],
      ['//ondsajt.se'], // protokollrelativ
      ['/\\ondsajt.se'], // normaliseras till // i vissa webbläsare
      ['/cv\\..\\admin'],
      ['javascript:alert(1)'],
      ['data:text/html,<script>'],
      ['cv'], // relativ, inte vår form
      ['/../admin'],
      ['/cv/../../etc'],
      // Dubbelkodning: %252f%252f avkodas i två steg till //
      ['%252F%252Fondsajt.se'],
    ])('nekar %s', (indata) => {
      expect(safeReturnTo(indata)).toBeNull()
    })

    it('nekar sökvägar med kontrolltecken', () => {
      expect(safeReturnTo('/cv\nSet-Cookie: x=1')).toBeNull()
      expect(safeReturnTo('/cv\r\n')).toBeNull()
      expect(safeReturnTo('/cv\tadmin')).toBeNull()
      expect(safeReturnTo(`/cv${String.fromCharCode(0)}`)).toBeNull()
    })

    it('nekar trasig procentkodning i stället för att gissa', () => {
      expect(safeReturnTo('/cv%')).toBeNull()
      expect(safeReturnTo('%E0%A4%A')).toBeNull()
    })
  })

  describe('nekar sökvägar som inte är värda att minnas', () => {
    it.each(['/', '/login', '/register', '/login?x=1', '/register/'])('nekar %s', (indata) => {
      expect(safeReturnTo(indata)).toBeNull()
    })
  })

  it('hanterar tomt och saknat värde', () => {
    expect(safeReturnTo(null)).toBeNull()
    expect(safeReturnTo(undefined)).toBeNull()
    expect(safeReturnTo('')).toBeNull()
  })
})

describe('medReturnTo', () => {
  it('lägger till parametern för en giltig sökväg', () => {
    expect(medReturnTo('/login', '/cv')).toBe('/login?returnTo=%2Fcv')
  })

  it('utelämnar parametern när sökvägen inte är värd att minnas', () => {
    expect(medReturnTo('/login', '/')).toBe('/login')
    expect(medReturnTo('/login', null)).toBe('/login')
  })

  it('utelämnar parametern för en sökväg som nekas', () => {
    expect(medReturnTo('/login', 'https://ondsajt.se')).toBe('/login')
  })

  it('kodar frågetecken så att parametern inte kan brytas isär', () => {
    expect(medReturnTo('/login', '/job-search?q=lager')).toBe(
      '/login?returnTo=%2Fjob-search%3Fq%3Dlager'
    )
  })
})
