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
 * Parse AI response to extract companies
 */
function parseCompaniesFromResponse(content: string): CompanySearchResult[] {
  const companies: CompanySearchResult[] = []

  // Try to find JSON in the response
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        return parsed.map(c => ({
          name: c.name || c.namn || '',
          orgNumber: c.orgNumber || c.organisationsnummer || c.org_number || null,
          description: c.description || c.beskrivning || '',
          city: c.city || c.stad || c.ort || null,
          industry: c.industry || c.bransch || null,
          verified: false,
        })).filter(c => c.name)
      }
    } catch {
      // Fall through to regex parsing
    }
  }

  // Fallback: Try to extract org numbers with regex
  const orgNumberRegex = /(\d{6}[-\s]?\d{4})/g
  const matches = content.matchAll(orgNumberRegex)

  for (const match of matches) {
    const orgNumber = match[1].replace(/[-\s]/g, '')
    // Try to find company name near the org number
    const contextStart = Math.max(0, match.index! - 100)
    const context = content.substring(contextStart, match.index! + 20)

    // Look for company name patterns
    const nameMatch = context.match(/([A-ZÅÄÖ][A-Za-zåäöÅÄÖ\s&]+(?:AB|HB|KB|Aktiebolag|Handelsbolag))/i)

    companies.push({
      name: nameMatch ? nameMatch[1].trim() : `Företag ${orgNumber}`,
      orgNumber,
      description: '',
      city: null,
      industry: null,
      verified: false,
    })
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

    // Build prompt for Perplexity
    const systemPrompt = `Du är en expert på att hitta svenska företag. Din uppgift är att söka efter företag baserat på användarens beskrivning.

VIKTIGT: Du MÅSTE returnera resultatet som en JSON-array med följande format:
[
  {
    "name": "Företagsnamn AB",
    "orgNumber": "5560123456",
    "description": "Kort beskrivning av företaget",
    "city": "Stockholm",
    "industry": "IT-konsult"
  }
]

Regler:
- Sök på allabolag.se, företagsfakta.se, hitta.se och liknande källor
- Inkludera ALLTID organisationsnummer (10 siffror utan bindestreck) om du hittar det
- Returnera max ${maxResults} företag
- Fokusera på AKTIVA företag (ej avregistrerade/konkurser)
- Om du inte hittar org.nr, sätt det till null
- Svara ENDAST med JSON-arrayen, ingen annan text`

    const userPrompt = `Hitta svenska företag som matchar: "${query.trim()}"`

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

    // Verify each company against Bolagsverket (in parallel, max 5 at a time)
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
