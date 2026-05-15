import { describe, it, expect } from 'vitest'
import { sanitizeForAi, sanitizeObjectForAi } from './piiSanitizer'

describe('piiSanitizer', () => {
  describe('hard strips — alltid bort', () => {
    it('strippar svenska personnummer (YYYYMMDD-XXXX)', () => {
      const result = sanitizeForAi('Mitt personnummer är 19800101-1234 tack.')
      expect(result.sanitized).toBe('Mitt personnummer är [BORTTAGET-PERSONNUMMER] tack.')
      expect(result.stripped.personnummer).toBe(1)
    })

    it('strippar kortform YYMMDD-XXXX', () => {
      const result = sanitizeForAi('PNR: 800101-1234')
      expect(result.sanitized).toContain('[BORTTAGET-PERSONNUMMER]')
    })

    it('strippar utan bindestreck', () => {
      const result = sanitizeForAi('Födelsenr: 198001011234')
      expect(result.sanitized).toContain('[BORTTAGET-PERSONNUMMER]')
    })

    it('strippar samordningsnummer (dag + 60)', () => {
      const result = sanitizeForAi('Samordn: 800161-1234')
      expect(result.sanitized).toContain('[BORTTAGET-PERSONNUMMER]')
    })

    it('strippar Visa-kortnummer (luhn-validerat)', () => {
      // Test Visa: 4532015112830366 (luhn-giltigt)
      const result = sanitizeForAi('Kort: 4532 0151 1283 0366')
      expect(result.sanitized).toContain('[BORTTAGET-KORTNUMMER]')
      expect(result.stripped.creditCard).toBe(1)
    })

    it('strippar INTE slumpsiffror som inte är luhn-giltiga', () => {
      const result = sanitizeForAi('Slumpnummer: 1234567812345678')
      expect(result.sanitized).toBe('Slumpnummer: 1234567812345678')
    })

    it('strippar svenskt IBAN', () => {
      const result = sanitizeForAi('IBAN: SE45 5000 0000 0583 9825 7466')
      expect(result.sanitized).toContain('[BORTTAGET-IBAN]')
    })
  })

  describe('soft warnings — räknar men behåller', () => {
    it('flaggar emails men behåller dem', () => {
      const result = sanitizeForAi('Maila mig på anna@exempel.se')
      expect(result.sanitized).toContain('anna@exempel.se')
      expect(result.warnings).toContainEqual({ type: 'email', count: 1 })
    })

    it('flaggar svenska telefonnummer', () => {
      const result = sanitizeForAi('Ring 070-123 45 67 eller +46 8 555 555 55')
      expect(result.sanitized).toContain('070-123 45 67')
      expect(result.warnings.find(w => w.type === 'phone')?.count).toBeGreaterThanOrEqual(1)
    })

    it('flaggar fullständiga gatuadresser', () => {
      const result = sanitizeForAi('Bor på Storgatan 12B i Stockholm')
      expect(result.sanitized).toContain('Storgatan 12B')
      expect(result.warnings.find(w => w.type === 'address')?.count).toBe(1)
    })

    it('kan stänga av soft warnings', () => {
      const result = sanitizeForAi('anna@exempel.se 070-123 45 67', { detectSoftPii: false })
      expect(result.warnings).toEqual([])
    })
  })

  describe('inga falska positiva', () => {
    it('saniterar inte vanlig text utan PII', () => {
      const input = 'Jag heter Anna och söker jobb som lärare i Stockholm. Jag har 5 års erfarenhet.'
      const result = sanitizeForAi(input)
      expect(result.sanitized).toBe(input)
      expect(Object.keys(result.stripped)).toHaveLength(0)
    })

    it('rör inte yrkesnamn med siffror', () => {
      const input = 'Sökt jobb som Säljare 2024, läst kurs CS101'
      const result = sanitizeForAi(input)
      expect(result.sanitized).toBe(input)
    })

    it('rör inte år eller månader', () => {
      const input = 'Arbetade 2018-2022 som projektledare'
      const result = sanitizeForAi(input)
      expect(result.sanitized).toBe(input)
    })
  })

  describe('sanitizeObjectForAi', () => {
    it('saniterar alla strängfält i ett objekt', () => {
      const obj = {
        name: 'Anna Andersson',
        personnummer: '800101-1234',
        about: 'Jag heter Anna, mitt nr är 800101-1234',
        age: 44,
      }
      const result = sanitizeObjectForAi(obj)
      expect(result.sanitized.name).toBe('Anna Andersson')
      expect(result.sanitized.personnummer).toBe('[BORTTAGET-PERSONNUMMER]')
      expect(result.sanitized.about).toContain('[BORTTAGET-PERSONNUMMER]')
      expect(result.sanitized.age).toBe(44)
      expect(result.stripped.personnummer).toBe(2)
    })

    it('hanterar tomma och null-värden', () => {
      const result = sanitizeObjectForAi({ a: '', b: null as unknown, c: 'inget pnr här' })
      expect(result.sanitized.a).toBe('')
      expect(result.sanitized.b).toBeNull()
      expect(result.sanitized.c).toBe('inget pnr här')
    })
  })
})
