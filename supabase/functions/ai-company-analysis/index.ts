/**
 * AI Company Analysis Edge Function
 * Deep company analysis for spontaneous applications using Perplexity Sonar
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimit.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface CompanyAnalysisRequest {
  companyName: string
  orgNumber?: string
  industry?: string
}

interface CompanyAnalysisResult {
  recentNews: {
    title: string
    date: string
    summary: string
    sentiment: 'positive' | 'neutral' | 'negative'
  }[]
  financialStatus: {
    summary: string
    revenue?: string
    employees?: string
    growth?: string
  }
  recruitmentNeeds: {
    hiring: boolean
    roles: string[]
    signals: string[]
  }
  companyCulture: {
    summary: string
    values: string[]
    workEnvironment: string
    ratings?: {
      glassdoor?: string
      indeed?: string
    }
  }
  spontaneousApplicationTips: {
    bestApproach: string
    talkingPoints: string[]
    avoidTopics: string[]
    bestTimeToApply: string
  }
}

function buildCompanyAnalysisPrompt(params: CompanyAnalysisRequest): string {
  return `Du är en expert på företagsanalys för jobbsökare i Sverige.

UPPGIFT: Gör en djupanalys av följande företag för att hjälpa en person som överväger en spontanansökan.

FÖRETAG: ${params.companyName}
${params.orgNumber ? `ORG.NR: ${params.orgNumber}` : ''}
${params.industry ? `BRANSCH: ${params.industry}` : ''}

Sök på nätet efter aktuell information om företaget. Använd allabolag.se, proff.se, LinkedIn, Glassdoor, nyhetsartiklar, och företagets hemsida.

RETURNERA exakt detta JSON-format:
{
  "recentNews": [
    {
      "title": "Nyhetsrubrik",
      "date": "2024-XX-XX",
      "summary": "Kort sammanfattning",
      "sentiment": "positive" | "neutral" | "negative"
    }
  ],
  "financialStatus": {
    "summary": "Sammanfattning av ekonomisk status",
    "revenue": "Omsättning om känd",
    "employees": "Antal anställda om känt",
    "growth": "Tillväxttrend om känd"
  },
  "recruitmentNeeds": {
    "hiring": true/false,
    "roles": ["Roll 1", "Roll 2"],
    "signals": ["Signal som indikerar behov 1", "Signal 2"]
  },
  "companyCulture": {
    "summary": "Sammanfattning av företagskultur",
    "values": ["Värdering 1", "Värdering 2"],
    "workEnvironment": "Beskrivning av arbetsmiljö",
    "ratings": {
      "glassdoor": "X.X/5 om tillgängligt",
      "indeed": "X.X/5 om tillgängligt"
    }
  },
  "spontaneousApplicationTips": {
    "bestApproach": "Bästa sättet att kontakta företaget",
    "talkingPoints": ["Ämne att lyfta 1", "Ämne 2", "Ämne 3"],
    "avoidTopics": ["Undvik att nämna 1", "Undvik 2"],
    "bestTimeToApply": "Rekommenderad tidpunkt"
  }
}

Svara ENDAST med giltig JSON.`
}

function parseResponse(content: string): CompanyAnalysisResult | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CompanyAnalysisResult
    }
    return null
  } catch (e) {
    console.error('[ai-company-analysis] Parse error:', e)
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
    const body = await req.json() as CompanyAnalysisRequest
    const { companyName, orgNumber, industry } = body

    if (!companyName || companyName.trim().length < 2) {
      return createCorsResponse({ error: 'Företagsnamn krävs' }, 400, origin)
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
    const rateCheck = checkRateLimit(user.id, 'ai-company-analysis')
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.retryAfter!, origin)
    }

    console.log(`[ai-company-analysis] User ${user.id} analyzing: ${companyName}`)

    // Build prompt
    const prompt = buildCompanyAnalysisPrompt({ companyName, orgNumber, industry })

    // Call Perplexity Sonar
    const aiResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
        'X-Title': 'Jobin Company Analysis',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('[ai-company-analysis] OpenRouter error:', aiResponse.status, errorText)
      return createCorsResponse({ error: 'AI-tjänsten är inte tillgänglig' }, 502, origin)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createCorsResponse({ error: 'Inget svar från AI' }, 502, origin)
    }

    const result = parseResponse(content)

    if (!result) {
      console.error('[ai-company-analysis] Failed to parse:', content.substring(0, 500))
      return createCorsResponse({ error: 'Kunde inte tolka AI-svaret' }, 500, origin)
    }

    // Log usage
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: 'company-analysis',
        model: 'perplexity/sonar',
        tokens_used: aiData.usage?.total_tokens || 0,
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.log('[ai-company-analysis] Log error:', e)
    }

    console.log(`[ai-company-analysis] Success for ${companyName}`)

    return createCorsResponse({
      success: true,
      type: 'company-analysis',
      result,
      citations: aiData.citations || [],
    }, 200, origin)

  } catch (err) {
    console.error('[ai-company-analysis] Error:', err)
    return createCorsResponse({ error: 'Ett fel uppstod' }, 500, origin)
  }
})
