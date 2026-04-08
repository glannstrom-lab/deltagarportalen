/**
 * AI Company Search Edge Function
 * Uses Perplexity Sonar (via OpenRouter) to search for companies
 * Then verifies against Bolagsverket API
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const BOLAGSVERKET_API_BASE = 'https://gw.api.bolagsverket.se/vardefulla-datamangder/v1'
const BOLAGSVERKET_TOKEN_URL = 'https://portal.api.bolagsverket.se/oauth2/token'

// Token cache for Bolagsverket
let cachedToken: { token: string; expiresAt: number } | null = null

interface CompanySearchResult {
  name: string
  orgNumber: string | null
  description: string
  city: string | null
  industry: string | null
  verified: boolean
  verifiedData?: Record<string, unknown>
}

/**
 * Get Bolagsverket access token
 */
async function getBolagsverketToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  const clientId = Deno.env.get('BOLAGSVERKET_CLIENT_ID')
  const clientSecret = Deno.env.get('BOLAGSVERKET_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Bolagsverket credentials not configured')
  }

  const credentials = btoa(`${clientId}:${clientSecret}`)

  const response = await fetch(BOLAGSVERKET_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=vardefulla-datamangder:read vardefulla-datamangder:ping',
  })

  if (!response.ok) {
    throw new Error(`Failed to get Bolagsverket token: ${response.status}`)
  }

  const data = await response.json()
  const expiresIn = data.expires_in || 3600

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn * 1000),
  }

  return data.access_token
}

/**
 * Verify company against Bolagsverket
 */
async function verifyCompany(orgNumber: string): Promise<Record<string, unknown> | null> {
  try {
    const normalized = orgNumber.replace(/[-\s]/g, '').trim()

    if (!/^\d{10}$/.test(normalized)) {
      return null
    }

    const token = await getBolagsverketToken()

    const response = await fetch(`${BOLAGSVERKET_API_BASE}/organisationer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ identitetsbeteckning: normalized }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.organisationer && data.organisationer.length > 0) {
      const org = data.organisationer[0]

      // Extract key fields
      const orgNamn = org.organisationsnamn?.organisationsnamnLista?.[0]?.namn
      const orgForm = org.organisationsform?.klartext
      const postAddr = org.postadressOrganisation?.postadress

      return {
        orgNumber: normalized,
        name: orgNamn || '',
        legalForm: orgForm || '',
        address: {
          street: postAddr?.utdelningsadress || '',
          postalCode: postAddr?.postnummer || '',
          city: postAddr?.postort || '',
        },
        verified: true,
      }
    }

    return null
  } catch (err) {
    console.error('Verification error:', err)
    return null
  }
}

/**
 * Normalize org number to 10 digits
 */
function normalizeOrgNumber(orgNr: string | null | undefined): string | null {
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
 * Parse AI response to extract companies
 */
function parseCompaniesFromResponse(content: string): CompanySearchResult[] {
  const companies: CompanySearchResult[] = []
  const seenOrgNumbers = new Set<string>()

  // Try to find JSON in the response
  const jsonMatch = content.match(/\[[\s\S]*?\]/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        for (const c of parsed) {
          const name = c.name || c.namn || c.företag || c.company || ''
          if (!name) continue

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
    } catch (e) {
      console.log('[ai-company-search] JSON parse error, trying regex fallback')
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    // Parse request
    const body = await req.json()
    const { query, maxResults = 10 } = body

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return createCorsResponse({ error: 'Söktermen måste vara minst 3 tecken' }, 400, origin)
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Unauthorized' }, 401, origin)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!supabaseUrl || !serviceRoleKey || !openRouterKey) {
      return createCorsResponse({ error: 'Server configuration error' }, 500, origin)
    }

    // Verify user
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return createCorsResponse({ error: 'Invalid token' }, 401, origin)
    }

    console.log(`[ai-company-search] User ${user.id} searching: "${query}"`)

    // Build prompt for Perplexity - optimized for finding org numbers
    const systemPrompt = `Du är expert på att hitta svenska företag med deras organisationsnummer.

UPPGIFT: Sök på allabolag.se, proff.se, företagsfakta.se och hitta företag som matchar användarens beskrivning.

KRITISKT VIKTIGT:
1. För VARJE företag du hittar, SÖK AKTIVT efter dess organisationsnummer på allabolag.se
2. URL-mönster på allabolag.se: allabolag.se/[orgnummer]/[företagsnamn]
3. Organisationsnummer är ALLTID 10 siffror (t.ex. 5560747551)
4. Om du nämner ett företag MÅSTE du söka upp dess org.nr

RETURNERA exakt detta JSON-format (inget annat):
[
  {
    "name": "Företagsnamn AB",
    "orgNumber": "5560123456",
    "description": "Vad företaget gör",
    "city": "Stad",
    "industry": "Bransch"
  }
]

REGLER:
- Max ${maxResults} företag
- Endast AKTIVA företag (ej konkurs/likvidation)
- orgNumber MÅSTE vara exakt 10 siffror eller null
- Sök ALLTID på allabolag.se för att hitta org.nr
- Svara ENDAST med JSON-array`

    const userPrompt = `Sök efter svenska företag: "${query.trim()}"

För varje företag du hittar, gå till allabolag.se och hämta organisationsnumret. Det är kritiskt viktigt att inkludera org.nr.`

    // Call Perplexity via OpenRouter
    const aiResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
        'X-Title': 'Jobin Company Search',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('[ai-company-search] OpenRouter error:', aiResponse.status, errorText)
      return createCorsResponse({ error: 'AI-tjänsten är inte tillgänglig' }, 502, origin)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createCorsResponse({ error: 'Inget svar från AI' }, 502, origin)
    }

    console.log('[ai-company-search] AI response received, parsing...')

    // Parse companies from response
    let companies = parseCompaniesFromResponse(content)

    console.log(`[ai-company-search] Parsed ${companies.length} companies, ${companies.filter(c => c.orgNumber).length} with org numbers`)

    // Secondary search for companies missing org numbers
    const companiesWithoutOrgNr = companies.filter(c => !c.orgNumber && c.name)
    if (companiesWithoutOrgNr.length > 0 && companiesWithoutOrgNr.length <= 5) {
      console.log(`[ai-company-search] Searching for org numbers for ${companiesWithoutOrgNr.length} companies...`)

      const orgNrSearchPrompt = `Hitta organisationsnummer för dessa svenska företag. Sök på allabolag.se för varje företag.

Företag att söka:
${companiesWithoutOrgNr.map(c => `- ${c.name}${c.city ? ` (${c.city})` : ''}`).join('\n')}

RETURNERA exakt detta format (endast JSON):
[
  {"name": "Företagsnamn", "orgNumber": "5560123456"}
]

Om du inte hittar org.nr för ett företag, inkludera det inte i svaret.`

      try {
        const orgNrResponse = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
            'X-Title': 'Jobin OrgNr Lookup',
          },
          body: JSON.stringify({
            model: 'perplexity/sonar',
            messages: [
              { role: 'user', content: orgNrSearchPrompt },
            ],
            max_tokens: 1000,
            temperature: 0.1,
          }),
        })

        if (orgNrResponse.ok) {
          const orgNrData = await orgNrResponse.json()
          const orgNrContent = orgNrData.choices?.[0]?.message?.content

          if (orgNrContent) {
            const jsonMatch = orgNrContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              try {
                const orgNrResults = JSON.parse(jsonMatch[0])

                // Update companies with found org numbers
                for (const result of orgNrResults) {
                  if (result.orgNumber && /^\d{10}$/.test(result.orgNumber.replace(/[-\s]/g, ''))) {
                    const company = companies.find(c =>
                      c.name.toLowerCase().includes(result.name.toLowerCase()) ||
                      result.name.toLowerCase().includes(c.name.toLowerCase())
                    )
                    if (company && !company.orgNumber) {
                      company.orgNumber = result.orgNumber.replace(/[-\s]/g, '')
                      console.log(`[ai-company-search] Found org number for ${company.name}: ${company.orgNumber}`)
                    }
                  }
                }
              } catch (e) {
                console.log('[ai-company-search] Failed to parse org number results')
              }
            }
          }
        }
      } catch (e) {
        console.log('[ai-company-search] Secondary org number search failed:', e)
      }
    }

    // Verify each company against Bolagsverket (in parallel)
    const verificationPromises = companies.slice(0, maxResults).map(async (company) => {
      if (company.orgNumber) {
        const verified = await verifyCompany(company.orgNumber)
        if (verified) {
          return {
            ...company,
            name: verified.name || company.name,
            verified: true,
            verifiedData: verified,
          }
        }
      }
      return company
    })

    companies = await Promise.all(verificationPromises)

    // Sort: verified first
    companies.sort((a, b) => {
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      return 0
    })

    // Log usage
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: 'company-search',
        model: 'perplexity/sonar',
        tokens_used: aiData.usage?.total_tokens || 0,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.log('[ai-company-search] Log error:', e)
    }

    console.log(`[ai-company-search] Found ${companies.length} companies, ${companies.filter(c => c.verified).length} verified`)

    return createCorsResponse({
      success: true,
      query: query.trim(),
      companies,
      totalFound: companies.length,
      verified: companies.filter(c => c.verified).length,
    }, 200, origin)

  } catch (err) {
    console.error('[ai-company-search] Error:', err)
    return createCorsResponse({ error: 'Ett fel uppstod' }, 500, origin)
  }
})
