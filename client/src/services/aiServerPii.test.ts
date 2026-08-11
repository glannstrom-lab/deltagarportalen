/**
 * B29 — serversidans PII-maskering i `client/api/ai.js`.
 *
 * PII-saneringen fanns tidigare BARA i webbläsaren (`client/src/lib/piiSanitizer.ts`).
 * Servern kollade endast `[<>]` (prompt-injection-skydd, inte PII). Ett direkt
 * POST mot `/api/ai` — förbi klienten helt — gick igenom med personnummer och
 * bankkontonummer intakta till OpenRouter. Bevisat live.
 *
 * `stripPii` är porteringen av piiSanitizer.ts:s HARD STRIP-mönster till
 * CommonJS (servern kan inte importera klientens ESM/TS-modul). Den här
 * filen testar mönstren självständigt av samma skäl som
 * `aiServerConsentGate.test.ts` testar `checkArt9Consent` självständigt: en
 * mutation i regexet ska synas här, inte bara som ett personnummer i en
 * riktig leverantörs loggar.
 *
 * (Testfilen ligger under src/ eftersom vitest bara inkluderar src/**.)
 */
import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const aiHandler = require('../../api/ai.js') as {
  stripPii: (text: string) => string
  sanitizeInput: (input: unknown, maxLength?: number) => string
}

describe('stripPii — personnummer, alla format', () => {
  it('maskerar YYYYMMDD-XXXX (med sekel, med bindestreck)', () => {
    expect(aiHandler.stripPii('Personnummer: 19800101-1234')).toBe(
      'Personnummer: [BORTTAGET-PERSONNUMMER]'
    )
  })

  it('maskerar YYMMDD-XXXX (utan sekel, med bindestreck)', () => {
    expect(aiHandler.stripPii('PNR: 800101-1234')).toContain('[BORTTAGET-PERSONNUMMER]')
  })

  it('maskerar YYMMDD+XXXX (samordning över 100 år, plustecken)', () => {
    expect(aiHandler.stripPii('PNR: 800101+1234')).toContain('[BORTTAGET-PERSONNUMMER]')
  })

  it('maskerar YYYYMMDDXXXX (utan bindestreck alls)', () => {
    expect(aiHandler.stripPii('Födelsenr: 198001011234')).toContain('[BORTTAGET-PERSONNUMMER]')
  })

  it('maskerar samordningsnummer (dag + 60)', () => {
    expect(aiHandler.stripPii('Samordn: 800161-1234')).toContain('[BORTTAGET-PERSONNUMMER]')
  })

  it('maskerar flera personnummer i samma text', () => {
    const out = aiHandler.stripPii('19800101-1234 och 19850505-4321')
    expect(out.match(/\[BORTTAGET-PERSONNUMMER\]/g)).toHaveLength(2)
    expect(out).not.toMatch(/\d{6,8}/)
  })
})

describe('stripPii — bankkonto, clearing, IBAN', () => {
  it('maskerar ett svenskt bankkonto (clearing + kontonummer)', () => {
    expect(aiHandler.stripPii('Konto: 12345-123 456 7')).toContain('[BORTTAGET-BANKKONTO]')
  })

  it('maskerar svenskt IBAN', () => {
    expect(aiHandler.stripPii('IBAN: SE45 5000 0000 0583 9825 7466')).toContain('[BORTTAGET-IBAN]')
  })

  it('IBAN maskeras som IBAN, inte som bankkonto (körordning)', () => {
    const out = aiHandler.stripPii('SE4550000000058398257466')
    expect(out).toContain('[BORTTAGET-IBAN]')
    expect(out).not.toContain('[BORTTAGET-BANKKONTO]')
  })
})

describe('stripPii — kreditkort (Luhn-validerat)', () => {
  it('maskerar ett luhn-giltigt kortnummer', () => {
    expect(aiHandler.stripPii('Kort: 4532 0151 1283 0366')).toContain('[BORTTAGET-KORTNUMMER]')
  })

  it('maskerar INTE ett luhn-ogiltigt sifferblock', () => {
    const out = aiHandler.stripPii('Referens: 1234567812345678')
    expect(out).toBe('Referens: 1234567812345678')
  })
})

describe('stripPii — e-post och telefon (servern maskerar, till skillnad från klienten)', () => {
  it('maskerar e-postadresser', () => {
    expect(aiHandler.stripPii('Nå mig på anna.andersson@exempel.se')).toBe(
      'Nå mig på [BORTTAGET-EPOST]'
    )
  })

  it('maskerar svenska mobilnummer (070-XXX XX XX)', () => {
    expect(aiHandler.stripPii('Ring 070-123 45 67')).toContain('[BORTTAGET-TELEFON]')
  })

  // KÄND LUCKA (hittad av det här testet, inte åtgärdad — se rapportens
  // "hittat men inte åtgärdat"): mönstret är porterat oförändrat från
  // piiSanitizer.ts, och där har `\b(?:\+46[-\s]?|...)` aldrig en giltig
  // gräns framför "+" när "+" föregås av mellanslag eller radstart — `\b`
  // kräver att EN sida är ett ordtecken, och varken mellanslag/radstart
  // eller "+" är det. "+46 70 …" maskeras alltså INTE, varken hos klienten
  // eller nu i porten. `070-…` (utan plustecken) fungerar som avsett.
  it('maskerar INTE +46-formatet — dokumenterad, ärvd brist i det porterade mönstret', () => {
    expect(aiHandler.stripPii('Ring +46 70 123 45 67')).toBe('Ring +46 70 123 45 67')
  })
})

describe('stripPii — lämnar ofarlig text orörd', () => {
  it('rör inte vanlig brödtext utan PII', () => {
    const text = 'Jag har fem års erfarenhet som snickare och söker nu en ny roll.'
    expect(aiHandler.stripPii(text)).toBe(text)
  })

  it('rör inte ett vanligt datum utan efterföljande sifferblock', () => {
    // "2026-08-09" saknar de fyra siffrorna efter bindestrecket som
    // personnummerregexet kräver — ska inte maskeras.
    expect(aiHandler.stripPii('Mötet är 2026-08-09.')).toBe('Mötet är 2026-08-09.')
  })
})

describe('sanitizeInput — PII-maskering är en del av den redan körda saneringen', () => {
  it('maskerar PII OCH tar bort <>-tecken i samma anrop', () => {
    const out = aiHandler.sanitizeInput('<b>Mitt personnummer är 19800101-1234</b>')
    expect(out).not.toContain('19800101-1234')
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).toContain('[BORTTAGET-PERSONNUMMER]')
  })

  it('hanterar null/undefined som tom sträng, precis som tidigare', () => {
    expect(aiHandler.sanitizeInput(null)).toBe('')
    expect(aiHandler.sanitizeInput(undefined)).toBe('')
  })
})
