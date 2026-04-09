/**
 * AI Commute Planner Edge Function
 * Commute analysis and cost estimation using Perplexity Sonar
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimit.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface CommutePlannerRequest {
  homeAddress: string
  workAddress: string
  preferredMode?: 'public' | 'car' | 'bike' | 'any'
}

interface CommutePlannerResult {
  publicTransit: {
    duration: string
    transfers: number
    lines: string[]
    monthlyCost: string
  } | null
  car: {
    duration: string
    distance: string
    monthlyCost: string
    parkingInfo: string
  } | null
  bike: {
    duration: string
    distance: string
    feasibility: string
  } | null
  recommendation: string
  remoteWorkSuggestion: string
  alternativeJobs?: {
    suggestion: string
  }
}

function buildCommutePlannerPrompt(params: CommutePlannerRequest): string {
  const { homeAddress, workAddress } = params

  return `Du är en expert på pendling och transport i Sverige.

UPPGIFT: Analysera pendlingsalternativ mellan två adresser.

HEMADRESS: ${homeAddress}
ARBETSPLATSADRESS: ${workAddress}

Sök efter restider och kostnader via Google Maps, SL, Västtrafik, Skånetrafiken eller annan relevant kollektivtrafik beroende på region.

RETURNERA exakt detta JSON-format:
{
  "publicTransit": {
    "duration": "XX min (enkel väg)",
    "transfers": 0-5,
    "lines": ["Linje 1", "Linje 2"],
    "monthlyCost": "X XXX kr"
  },
  "car": {
    "duration": "XX min (utan trafik)",
    "distance": "XX km (enkel väg)",
    "monthlyCost": "X XXX kr (bensin + slitage)",
    "parkingInfo": "Information om parkering"
  },
  "bike": {
    "duration": "XX min",
    "distance": "XX km",
    "feasibility": "Bedömning av hur genomförbart det är"
  },
  "recommendation": "Sammanfattad rekommendation om bästa alternativet",
  "remoteWorkSuggestion": "Tips om distansarbete kan vara aktuellt baserat på pendlingstiden",
  "alternativeJobs": {
    "suggestion": "Om pendlingen är lång, förslag på att söka jobb närmare hemmet"
  }
}

Om något alternativ inte är rimligt (t.ex. cykel för 50+ km), sätt det fältet till null.

Uppskatta månadskostnader baserat på:
- Kollektivtrafik: Regionalt månadskort
- Bil: 2,5 kr/km för bensin + slitage, baserat på 22 arbetsdagar/månad

Svara ENDAST med giltig JSON.`
}

function parseResponse(content: string): CommutePlannerResult | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CommutePlannerResult
    }
    return null
  } catch (e) {
    console.error('[ai-commute-planner] Parse error:', e)
    return null
  }
}

Deno.serve(async (req) => {
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    const body = await req.json() as CommutePlannerRequest
    const { homeAddress, workAddress } = body

    if (!homeAddress || !workAddress) {
      return createCorsResponse({ error: 'Båda adresser krävs' }, 400, origin)
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

    // Rate limiting
    const rateCheck = checkRateLimit(user.id, 'ai-commute-planner')
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.retryAfter!, origin)
    }

    console.log(`[ai-commute-planner] User ${user.id} planning commute`)

    // Build prompt
    const prompt = buildCommutePlannerPrompt(body)

    // Call Perplexity Sonar
    const aiResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
        'X-Title': 'Jobin Commute Planner',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('[ai-commute-planner] OpenRouter error:', aiResponse.status, errorText)
      return createCorsResponse({ error: 'AI-tjänsten är inte tillgänglig' }, 502, origin)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createCorsResponse({ error: 'Inget svar från AI' }, 502, origin)
    }

    const result = parseResponse(content)

    if (!result) {
      console.error('[ai-commute-planner] Failed to parse:', content.substring(0, 500))
      return createCorsResponse({ error: 'Kunde inte tolka AI-svaret' }, 500, origin)
    }

    // Log usage
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: 'commute-planner',
        model: 'perplexity/sonar',
        tokens_used: aiData.usage?.total_tokens || 0,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.log('[ai-commute-planner] Log error:', e)
    }

    console.log(`[ai-commute-planner] Success`)

    return createCorsResponse({
      success: true,
      type: 'commute-planner',
      result,
      citations: aiData.citations || [],
    }, 200, origin)

  } catch (err) {
    console.error('[ai-commute-planner] Error:', err)
    return createCorsResponse({ error: 'Ett fel uppstod' }, 500, origin)
  }
})
