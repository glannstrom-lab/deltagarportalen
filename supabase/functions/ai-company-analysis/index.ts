/**
 * AI Company Analysis Edge Function
 * Deep company analysis for spontaneous applications using Perplexity Sonar
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'
import {
  AI_GATE_CODES,
  checkAiEnabled,
  checkDailyTokenCap,
  createAiErrorResponse,
  createGateDenialResponse,
  createTokenCapResponse,
  sanitizeForPrompt,
} from '../_shared/aiGate.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Indatagränser — allt användarstyrt interpoleras in i prompten och saneras
// därför först (längd, vinkelparenteser, styrtecken).
const MAX_COMPANY_NAME_LENGTH = 120
const MAX_INDUSTRY_LENGTH = 80

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

    // Sanering före prompt. `orgNumber` normaliseras till exakt 10 siffror
    // eller utelämnas helt — det är det enda formatet Bolagsverket och
    // allabolag använder, och därmed enda formen som är meningsfull att be
    // modellen om.
    const foretagsnamn = sanitizeForPrompt(companyName, MAX_COMPANY_NAME_LENGTH)
    const bransch = sanitizeForPrompt(industry, MAX_INDUSTRY_LENGTH)
    const orgnrRent = String(orgNumber ?? '').replace(/[-\s]/g, '').trim()
    const orgnr = /^\d{10}$/.test(orgnrRent) ? orgnrRent : undefined

    if (foretagsnamn.length < 2) {
      return createAiErrorResponse(AI_GATE_CODES.INVALID_INPUT, 'Företagsnamn krävs', 400, origin)
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createAiErrorResponse(AI_GATE_CODES.UNAUTHORIZED, 'Unauthorized', 401, origin)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!supabaseUrl || !serviceRoleKey || !openRouterKey) {
      return createAiErrorResponse(
        AI_GATE_CODES.SERVER_MISCONFIGURED,
        'Server configuration error',
        500,
        origin,
      )
    }

    // Verify user
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return createAiErrorResponse(AI_GATE_CODES.UNAUTHORIZED, 'Invalid token', 401, origin)
    }

    // ── Grindar, i ordning: flödesskydd → rättighet → kostnad ──────────────
    //
    // 1. RATE LIMIT (per användare). POLICY: FAIL OPEN, medvetet ärvd från
    //    `_shared/rateLimit.ts` — vid RPC-fel degraderar den till en
    //    in-memory-fallback som filens eget huvud kallar trasig på serverless
    //    (räknaren nollas vid cold start, isolat delar inte state). Den
    //    skyddar en PROJEKT-GLOBAL tredjepartskvot (OpenRouter/Perplexity),
    //    alltså pengar — inte en rättighet — och att neka alla analyser när
    //    rate-limit-RPC:n hickar vore fel växel. Kompensationen ligger i steg
    //    3: tokentaket nedan failar CLOSED just för att den här failar open,
    //    så det aldrig blir noll kostnadsskydd samtidigt. Filen delas av åtta
    //    andra funktioner och ändras inte härifrån.
    const rateCheck = await checkRateLimit(user.id, 'ai-company-analysis')
    if (!rateCheck.allowed) {
      return createAiErrorResponse(
        AI_GATE_CODES.RATE_LIMITED,
        'För många förfrågningar. Vänta en stund och försök igen.',
        429,
        origin,
        { retryAfter: rateCheck.retryAfter ?? 60 },
      )
    }

    // 2. AI-BRYTAREN (`profiles.ai_enabled`). POLICY: FAIL CLOSED.
    //    Fram till 2026-08-19 fanns den inte här alls: ett konto med
    //    `ai_enabled = false` fick HTTP 200 med fullt AI-svar, vilket gjorde
    //    portalens löfte om att AI-behandling kan stängas av osant i drift.
    //    Klienten skickas service-role-klienten med avsikt: den går förbi RLS
    //    och når därför användarens profilrad oavsett hur policyerna på
    //    `profiles` ändras. Skickas en klient med bara anon-nyckeln in här
    //    läser den som `anon`, får 0 rader och nekar ALLA (A19). Se aiGate.ts.
    const aiGate = await checkAiEnabled(supabase, user.id)
    if (!aiGate.allowed) {
      console.warn(`[ai-company-analysis] Nekad av AI-grind (${aiGate.reason}) för ${user.id}`)
      return createGateDenialResponse(aiGate.reason ?? 'lookup_failed', origin)
    }

    // 3. DAGLIGT TOKENTAK. POLICY: FAIL CLOSED — se motiveringen i aiGate.ts.
    //    Delar budget med `client/api/ai.js` (samma `ai_usage_logs`).
    const tokenCap = await checkDailyTokenCap(supabase, user.id)
    if (!tokenCap.allowed) {
      console.warn(`[ai-company-analysis] Nekad av tokentak (${tokenCap.reason}) för ${user.id}`)
      return createTokenCapResponse(tokenCap, origin)
    }

    console.log(`[ai-company-analysis] User ${user.id} analyzing: ${foretagsnamn}`)

    // Build prompt
    const prompt = buildCompanyAnalysisPrompt({
      companyName: foretagsnamn,
      orgNumber: orgnr,
      industry: bransch || undefined,
    })

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
      return createAiErrorResponse(
        AI_GATE_CODES.AI_UPSTREAM_ERROR,
        'AI-tjänsten är inte tillgänglig',
        502,
        origin,
      )
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createAiErrorResponse(AI_GATE_CODES.AI_UPSTREAM_ERROR, 'Inget svar från AI', 502, origin)
    }

    const result = parseResponse(content)

    if (!result) {
      console.error('[ai-company-analysis] Failed to parse:', content.substring(0, 500))
      return createAiErrorResponse(
        AI_GATE_CODES.AI_PARSE_ERROR,
        'Kunde inte tolka AI-svaret',
        502,
        origin,
      )
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
    return createAiErrorResponse(AI_GATE_CODES.INTERNAL_ERROR, 'Ett fel uppstod', 500, origin)
  }
})
