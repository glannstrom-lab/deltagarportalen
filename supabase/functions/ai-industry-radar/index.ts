/**
 * AI Industry Radar Edge Function
 * Market trends and industry insights using Perplexity Sonar
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimit.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface IndustryRadarRequest {
  userInterests?: string[]
  currentOccupation?: string
  region?: string
}

interface IndustryRadarResult {
  trendingIndustries: {
    name: string
    growthIndicator: 'up' | 'stable' | 'down'
    growthPercent: number
    demandLevel: 'high' | 'medium' | 'low'
    salaryTrend: string
  }[]
  emergingSkills: {
    skill: string
    demandGrowth: string
    industries: string[]
    learningTime: string
  }[]
  marketInsights: {
    title: string
    summary: string
    impact: string
  }[]
  personalizedRecommendations: string[]
  lastUpdated: string
}

function buildIndustryRadarPrompt(params: IndustryRadarRequest): string {
  const { userInterests, currentOccupation, region } = params

  return `Du är en expert på arbetsmarknadstrender i Sverige.

UPPGIFT: Ge aktuella arbetsmarknadsinsikter och trender.

${currentOccupation ? `NUVARANDE YRKE: ${currentOccupation}` : ''}
${userInterests && userInterests.length > 0 ? `INTRESSEN: ${userInterests.join(', ')}` : ''}
${region ? `REGION: ${region}` : 'REGION: Hela Sverige'}

Sök efter aktuell data från SCB, Arbetsförmedlingen, branschtidningar och jobbsajter.

RETURNERA exakt detta JSON-format:
{
  "trendingIndustries": [
    {
      "name": "Branschnamn",
      "growthIndicator": "up" | "stable" | "down",
      "growthPercent": 15,
      "demandLevel": "high" | "medium" | "low",
      "salaryTrend": "Beskrivning av lönetrend"
    }
  ],
  "emergingSkills": [
    {
      "skill": "Kompetensnamn",
      "demandGrowth": "+X% senaste året",
      "industries": ["Bransch 1", "Bransch 2"],
      "learningTime": "X månader"
    }
  ],
  "marketInsights": [
    {
      "title": "Insiktstitel",
      "summary": "Kort sammanfattning",
      "impact": "Hur det påverkar jobbsökare"
    }
  ],
  "personalizedRecommendations": [
    "Personlig rekommendation 1",
    "Personlig rekommendation 2"
  ],
  "lastUpdated": "YYYY-MM-DD"
}

Inkludera minst:
- 5 trendande branscher
- 4 kompetenser på uppgång
- 3 marknadsinsikter
- 3 personliga rekommendationer${userInterests ? ` baserat på användarens intressen` : ''}

Svara ENDAST med giltig JSON.`
}

function parseResponse(content: string): IndustryRadarResult | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as IndustryRadarResult
    }
    return null
  } catch (e) {
    console.error('[ai-industry-radar] Parse error:', e)
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
    const body = await req.json() as IndustryRadarRequest

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
    const rateCheck = checkRateLimit(user.id, 'ai-industry-radar')
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.retryAfter!, origin)
    }

    console.log(`[ai-industry-radar] User ${user.id} requesting trends`)

    // Build prompt
    const prompt = buildIndustryRadarPrompt(body)

    // Call Perplexity Sonar
    const aiResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
        'X-Title': 'Jobin Industry Radar',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('[ai-industry-radar] OpenRouter error:', aiResponse.status, errorText)
      return createCorsResponse({ error: 'AI-tjänsten är inte tillgänglig' }, 502, origin)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createCorsResponse({ error: 'Inget svar från AI' }, 502, origin)
    }

    const result = parseResponse(content)

    if (!result) {
      console.error('[ai-industry-radar] Failed to parse:', content.substring(0, 500))
      return createCorsResponse({ error: 'Kunde inte tolka AI-svaret' }, 500, origin)
    }

    // Ensure lastUpdated is set
    if (!result.lastUpdated) {
      result.lastUpdated = new Date().toISOString().split('T')[0]
    }

    // Log usage
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: 'industry-radar',
        model: 'perplexity/sonar',
        tokens_used: aiData.usage?.total_tokens || 0,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.log('[ai-industry-radar] Log error:', e)
    }

    console.log(`[ai-industry-radar] Success`)

    return createCorsResponse({
      success: true,
      type: 'industry-radar',
      result,
      citations: aiData.citations || [],
    }, 200, origin)

  } catch (err) {
    console.error('[ai-industry-radar] Error:', err)
    return createCorsResponse({ error: 'Ett fel uppstod' }, 500, origin)
  }
})
