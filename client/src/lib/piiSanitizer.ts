/**
 * PII-sanitizer för AI-prompts.
 *
 * Vid GDPR-överföring av persondata till tredjelands AI-leverantör (OpenRouter, USA)
 * måste vi minimera onödig PII. Användarens namn/email/telefon krävs för CV och brev
 * — vi tar inte bort det. Men personnummer, kontonummer, kreditkort och liknande
 * är ALDRIG nödvändigt för AI-generering och stryks innan prompten skickas iväg.
 *
 * Strategi:
 *   HARD STRIP:   Personnummer, samordningsnummer, kreditkortsnummer, bankkontonummer.
 *                 Mönstren ersätts med [BORTTAGET-typ]-placeholders och loggas.
 *   SOFT WARN:    Email, telefon, fullständiga gatuadresser, IBAN, BIC.
 *                 Behålls (krävs ofta för output) men registreras för audit.
 *   NEVER STRIP:  Namn, yrkesord, intressen, ort på kommunnivå.
 */

export interface SanitizeResult {
  /** Den saniterade texten — säker att skicka till AI */
  sanitized: string
  /** Antal träffar per HARD-STRIP-kategori */
  stripped: Record<string, number>
  /** Soft warnings — PII som behållits men loggats */
  warnings: Array<{ type: string; count: number }>
}

/**
 * Strikt PII-borttagning innan AI-anrop.
 *
 * @param input Text att sanitera (system prompt, user prompt, eller fritext fält)
 * @param options Konfigurera vilka kategorier som strippas
 */
export function sanitizeForAi(
  input: string,
  options: {
    /** Inkludera soft-warnings för email/telefon/adresser? Default true */
    detectSoftPii?: boolean
  } = {}
): SanitizeResult {
  const { detectSoftPii = true } = options
  const stripped: Record<string, number> = {}
  const warnings: Array<{ type: string; count: number }> = []
  let sanitized = input

  // ============= HARD STRIPS — alltid bort =============

  // Svenska personnummer: YYYYMMDD-XXXX, YYMMDD-XXXX, YYMMDD+XXXX, YYYYMMDDXXXX
  // Plus samordningsnummer (dag + 60)
  const personnummerRegex = /\b(?:19|20)?\d{2}(?:0[1-9]|1[0-2])(?:[0-2][0-9]|3[01]|[6-8][0-9]|9[01])\s*[-+]?\s*\d{4}\b/g
  sanitized = sanitized.replace(personnummerRegex, () => {
    stripped.personnummer = (stripped.personnummer || 0) + 1
    return '[BORTTAGET-PERSONNUMMER]'
  })

  // Kreditkortsnummer (Visa/MC/Amex/Discover) — 13-19 siffror med ev. mellanslag/bindestreck
  // Vi gör en grov match och kollar Luhn-checksum för att undvika false positives
  const ccRegex = /\b(?:\d[ -]?){12,18}\d\b/g
  sanitized = sanitized.replace(ccRegex, (match) => {
    const digits = match.replace(/\D/g, '')
    if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
      stripped.creditCard = (stripped.creditCard || 0) + 1
      return '[BORTTAGET-KORTNUMMER]'
    }
    return match
  })

  // IBAN — svensk: SE + 22 tecken. MÅSTE matchas före bankRegex eftersom siffror överlappar.
  const ibanRegex = /\bSE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/gi
  sanitized = sanitized.replace(ibanRegex, () => {
    stripped.iban = (stripped.iban || 0) + 1
    return '[BORTTAGET-IBAN]'
  })

  // Svenska bankkontonummer: bankkonto = clearing + nummer, t.ex. "12345 123 456 7"
  // Plus PlusGiro (XX XX XX-X) och BankGiro (XXX-XXXX, XXXX-XXXX)
  // Strikt: clearing 4-5 siffror, sedan 5-12 siffror, total 10+ siffror
  const bankRegex = /\b\d{4,5}[\s-]\d{3,4}[\s-]\d{3,4}(?:[\s-]\d{1,4})?\b/g
  sanitized = sanitized.replace(bankRegex, (match) => {
    // Filtrera bort uppenbara icke-bankkonton (datum, telefon)
    const digits = match.replace(/\D/g, '')
    if (digits.length >= 10 && digits.length <= 16) {
      stripped.bankAccount = (stripped.bankAccount || 0) + 1
      return '[BORTTAGET-BANKKONTO]'
    }
    return match
  })

  // ============= SOFT WARNINGS — räkna men behåll =============

  if (detectSoftPii) {
    // Email
    const emailMatches = sanitized.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g)
    if (emailMatches && emailMatches.length > 0) {
      warnings.push({ type: 'email', count: emailMatches.length })
    }

    // Svenska telefonnummer: 070-XXX XX XX, +46 70 XXX XX XX, 08-XX XX XX, etc.
    const phoneMatches = sanitized.match(/\b(?:\+46[-\s]?|0)(?:\d[-\s]?){8,11}\b/g)
    if (phoneMatches && phoneMatches.length > 0) {
      warnings.push({ type: 'phone', count: phoneMatches.length })
    }

    // Fullständig adress (gatunamn + nummer): typ "Storgatan 12B"
    const addressMatches = sanitized.match(/\b[A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|stigen|gränden|torget|allén|leden|backen)\s+\d+[A-Za-z]?\b/g)
    if (addressMatches && addressMatches.length > 0) {
      warnings.push({ type: 'address', count: addressMatches.length })
    }
  }

  return { sanitized, stripped, warnings }
}

/**
 * Luhn-algoritmen — verifierar att en siffersekvens är ett giltigt kreditkortsnummer.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (shouldDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

/**
 * Bekvämlighetsfunktion för objekt med strängvärden — saniterar varje sträng-fält.
 * Returnerar både rensat objekt och samlade strip/warn-rapporter.
 */
export function sanitizeObjectForAi<T extends Record<string, unknown>>(
  obj: T,
  options?: Parameters<typeof sanitizeForAi>[1]
): { sanitized: T; stripped: Record<string, number>; warnings: Array<{ type: string; count: number }> } {
  const stripped: Record<string, number> = {}
  const warningsMap: Record<string, number> = {}
  const sanitized = { ...obj } as Record<string, unknown>

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const result = sanitizeForAi(value, options)
      sanitized[key] = result.sanitized
      for (const [k, v] of Object.entries(result.stripped)) {
        stripped[k] = (stripped[k] || 0) + v
      }
      for (const w of result.warnings) {
        warningsMap[w.type] = (warningsMap[w.type] || 0) + w.count
      }
    }
  }

  const warnings = Object.entries(warningsMap).map(([type, count]) => ({ type, count }))
  return { sanitized: sanitized as T, stripped, warnings }
}
