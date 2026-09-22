/**
 * Tolkning av modellsvaret i ai-company-search — utbrutet ur index.ts
 * 2026-09-22 så att det går att köra i test (index.ts kör Deno.serve vid import).
 */

export interface CompanySearchResult {
  name: string
  orgNumber: string | null
  description: string
  city: string | null
  industry: string | null
  verified: boolean
  verifiedData?: Record<string, unknown>
}

/**
 * Normalize org number to 10 digits
 */
export function normalizeOrgNumber(orgNr: string | null | undefined): string | null {
  if (!orgNr) return null
  const cleaned = String(orgNr).replace(/[-\s]/g, '').trim()
  // Must be exactly 10 digits
  if (/^\d{10}$/.test(cleaned)) {
    return cleaned
  }
  // Try to extract 10 digits from longer strings
  const match = cleaned.match(/\d{10}/)
  return match ? match[0] : null
}

/**
 * Första JSON-arrayen i texten vars element är objekt. Går igenom varje `[`
 * och letar den matchande `]` med hänsyn till strängar (så att `]` inne i en
 * sträng inte avslutar arrayen), och provar att tolka utsnittet.
 */
export function hittaJsonArrayMedObjekt(text: string): unknown[] | null {
  for (let start = text.indexOf('['); start !== -1; start = text.indexOf('[', start + 1)) {
    let djup = 0
    let iStrang = false
    let escape = false
    for (let i = start; i < text.length; i++) {
      const t = text[i]
      if (iStrang) {
        if (escape) escape = false
        else if (t === '\\') escape = true
        else if (t === '"') iStrang = false
        continue
      }
      if (t === '"') iStrang = true
      else if (t === '[') djup++
      else if (t === ']') {
        djup--
        if (djup === 0) {
          try {
            const tolkat = JSON.parse(text.slice(start, i + 1))
            if (Array.isArray(tolkat) && tolkat.some((e) => e !== null && typeof e === 'object')) return tolkat
          } catch { /* inte JSON — prova nästa `[` */ }
          break
        }
      }
    }
  }
  return null
}

/**
 * Parse AI response to extract companies
 */
export function parseCompaniesFromResponse(content: string): CompanySearchResult[] {
  const companies: CompanySearchResult[] = []
  const seenOrgNumbers = new Set<string>()

  // Hitta JSON-arrayen i svaret. Var `content.match(/\[[\s\S]*?\]/)`, som
  // stannar vid första `]` — en källhänvisning som `[1]` före eller inne i
  // arrayen gav fel utsnitt, och allt föll till regex-reserven nedan.
  const parsed = hittaJsonArrayMedObjekt(content)
  if (parsed) {
    for (const post of parsed) {
      // deno-lint-ignore no-explicit-any
      const c = (post ?? {}) as Record<string, any>
      const name = c.name || c.namn || c.företag || c.company || ''
      if (!name || typeof name !== 'string') continue

      const orgNumber = normalizeOrgNumber(c.orgNumber || c.organisationsnummer || c.org_number || c.orgnr)

      // Skip duplicates
      if (orgNumber && seenOrgNumbers.has(orgNumber)) continue
      if (orgNumber) seenOrgNumbers.add(orgNumber)

      companies.push({
        name: name.trim(),
        orgNumber,
        description: c.description || c.beskrivning || c.info || '',
        city: c.city || c.stad || c.ort || c.location || null,
        industry: c.industry || c.bransch || c.sector || null,
        verified: false,
      })
    }
    if (companies.length > 0) {
      return companies
    }
  }

  // Fallback: Try to extract org numbers with regex patterns
  // Pattern 1: 10 digits together or with dash
  const orgNumberRegex = /(\d{6}[-\s]?\d{4})/g
  let match

  while ((match = orgNumberRegex.exec(content)) !== null) {
    const orgNumber = normalizeOrgNumber(match[1])
    if (!orgNumber || seenOrgNumbers.has(orgNumber)) continue
    seenOrgNumbers.add(orgNumber)

    // Try to find company name near the org number (look backwards)
    const contextStart = Math.max(0, match.index - 150)
    const contextEnd = Math.min(content.length, match.index + 50)
    const context = content.substring(contextStart, contextEnd)

    // Look for company name patterns
    const namePatterns = [
      /([A-ZÅÄÖ][A-Za-zåäöÅÄÖ\s&\-]+(?:\s+AB|\s+HB|\s+KB))/i,
      /([A-ZÅÄÖ][A-Za-zåäöÅÄÖ\s&\-]+(?:Aktiebolag|Handelsbolag))/i,
      /\*\*([^*]+)\*\*/,  // Markdown bold
      /"([^"]+)"/,  // Quoted names
    ]

    let companyName = null
    for (const pattern of namePatterns) {
      const nameMatch = context.match(pattern)
      if (nameMatch && nameMatch[1].trim().length > 2) {
        companyName = nameMatch[1].trim()
        break
      }
    }

    if (companyName) {
      companies.push({
        name: companyName,
        orgNumber,
        description: '',
        city: null,
        industry: null,
        verified: false,
      })
    }
  }

  return companies
}

/**
 * Fyller i organisationsnummer ur den andra sökningens svar på de företag som
 * saknar ett. Returnerar antalet ifyllda.
 *
 * Två fel rättade 2026-09-22 (flyttat ur index.ts för att gå att testa):
 *  - Svaret letades med det giriga `/\[[\s\S]*\]/`, som tog med en avslutande
 *    källhänvisning ("… [1]") och gav ogiltig JSON — inga nummer alls.
 *  - Ett tomt namn i svaret matchade VARJE företag (`'x'.includes('')` är sant)
 *    och gav det första företaget ett annat företags organisationsnummer, som
 *    sedan "verifierades" mot Bolagsverket under det andra företagets namn.
 */
export function fyllIOrgnummer(companies: CompanySearchResult[], svar: string): number {
  let antal = 0
  for (const post of hittaJsonArrayMedObjekt(svar) ?? []) {
    const result = (post ?? {}) as { name?: unknown; orgNumber?: unknown }
    const namn = typeof result.name === 'string' ? result.name.trim().toLowerCase() : ''
    const nummer = typeof result.orgNumber === 'string' ? result.orgNumber.replace(/[-\s]/g, '') : ''
    if (namn.length < 3 || !/^\d{10}$/.test(nummer)) continue
    const company = companies.find((c) =>
      !c.orgNumber && (c.name.toLowerCase().includes(namn) || namn.includes(c.name.toLowerCase()))
    )
    if (company) {
      company.orgNumber = nummer
      antal++
    }
  }
  return antal
}
