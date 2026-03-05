// Edge Function: AI Assistant - Universal AI proxy via OpenRouter
// Stödjer flera modeller: OpenAI, Anthropic, Google, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers - tillåt alla origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Hjälpfunktion för att skapa CORS-respons
function corsResponse(body: object, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

// Hjälpfunktion för felrespons
function errorResponse(message: string, status: number = 500) {
  return corsResponse({ error: message }, status)
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

type AIFunction = 
  | 'cv-optimering' 
  | 'generera-cv-text' 
  | 'personligt-brev' 
  | 'intervju-forberedelser' 
  | 'jobbtips' 
  | 'ovningshjalp' 
  | 'loneforhandling'
  | 'generell'

interface AIRequest {
  function: AIFunction
  data: Record<string, any>
  model?: string
}

const prompts: Record<AIFunction, (data: any) => { system: string; user: string; maxTokens: number }> = {
  'cv-optimering': (data) => ({
    system: `Du är en expert på CV-skrivning för arbetssökande. Ge konstruktiv feedback på svenska.`,
    user: `Ge feedback på detta CV för "${data.yrke || 'ospecificerat'}":\n\n${data.cvText}`,
    maxTokens: 1500
  }),
  
  'generera-cv-text': (data) => ({
    system: `Du är en expert på CV-skrivning. Skriv professionella CV-texter på svenska.`,
    user: `Skriv CV-sammanfattning för ${data.yrke}. Erfarenhet: ${data.erfarenhet || 'varierad'}. Styrkor: ${data.styrkor || 'pålitlig'}. Max 4 meningar.`,
    maxTokens: 500
  }),
  
  'personligt-brev': (data) => {
    const ton = data.ton || 'professionell'
    return {
      system: `Du är en karriärcoach som skriver personliga brev på svenska.`,
      user: `Skriv personligt brev för jobb: ${data.jobTitle || 'titel'} på ${data.companyName || 'företag'}.\n\nJobbannons: ${data.jobbAnnons}\n\nMin bakgrund: ${data.erfarenhet || ''}\n\nMotivering: ${data.motivering || ''}\n\nTon: ${ton}. Max 300 ord.`,
      maxTokens: 1200
    }
  },
  
  'intervju-forberedelser': (data) => ({
    system: `Du är en jobbcoach som förbereder personer för intervjuer på svenska.`,
    user: `Förbered mig för intervju som ${data.jobbTitel}${data.foretag ? ` på ${data.foretag}` : ''}. Min erfarenhet: ${data.erfarenhet || 'varierad'}.`,
    maxTokens: 2000
  }),
  
  'jobbtips': (data) => ({
    system: `Du är en empatisk jobbcoach på svenska.`,
    user: `Ge jobbsökartips. Intressen: ${data.intressen || 'varierade'}. Hinder: ${data.hinder || 'ingen'}. Mål: ${data.mal || 'hitta jobb'}.`,
    maxTokens: 1200
  }),
  
  'ovningshjalp': (data) => ({
    system: `Du är en stöttande coach för arbetsrelaterade övningar på svenska.`,
    user: `Hjälp med övning "${data.ovningId}" steg ${data.steg}. Fråga: ${data.fraga}. Svar: ${data.anvandarSvar || 'inget än'}`,
    maxTokens: 1000
  }),
  
  'loneforhandling': (data) => ({
    system: `Du är löneexpert på svenska.`,
    user: `Löneförhandling för ${data.roll}. Erfarenhet: ${data.erfarenhetAr || 0} år. Ort: ${data.ort || 'Sverige'}.`,
    maxTokens: 1500
  }),
  
  'generell': (data) => ({
    system: data.systemPrompt || 'Du är en hjälpsam assistent på svenska.',
    user: data.prompt,
    maxTokens: data.maxTokens || 1000
  })
}

serve(async (req) => {
  // === ALLTID hantera OPTIONS (CORS preflight) först ===
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // === Validera att det är POST ===
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // === Hämta auth header ===
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    // === Hämta miljövariabler ===
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase env vars')
      return errorResponse('Server configuration error', 500)
    }

    if (!openRouterApiKey) {
      console.error('Missing OPENROUTER_API_KEY')
      return errorResponse('AI service not configured', 503)
    }

    // === Verifiera användare ===
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return errorResponse('Invalid token', 401)
    }

    // === Parse request body ===
    let body: AIRequest
    try {
      body = await req.json()
    } catch (e) {
      return errorResponse('Invalid JSON body', 400)
    }

    const { function: aiFunction, data, model: overrideModel } = body

    // === Validera funktion ===
    if (!aiFunction || !prompts[aiFunction]) {
      return errorResponse(`Invalid function: ${aiFunction}`, 400)
    }

    // === Generera prompt ===
    const { system, user: userPrompt, maxTokens } = prompts[aiFunction](data)

    // === Bestäm modell ===
    const defaultModel = Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet'
    const model = overrideModel || defaultModel

    console.log(`AI call: ${aiFunction}, model: ${model}, user: ${user.id}`)

    // === Anropa OpenRouter ===
    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter error:', openRouterResponse.status, errorText)
      
      if (openRouterResponse.status === 401) {
        return errorResponse('Invalid API key', 503)
      }
      if (openRouterResponse.status === 429) {
        return errorResponse('Rate limit exceeded', 429)
      }
      
      return errorResponse('AI service error', 502)
    }

    const openRouterData = await openRouterResponse.json()
    const generatedContent = openRouterData.choices[0]?.message?.content

    if (!generatedContent) {
      return errorResponse('Empty response from AI', 502)
    }

    // === Logga användning (non-blocking) ===
    try {
      await supabaseClient.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: aiFunction,
        model: model,
        tokens_used: openRouterData.usage?.total_tokens || 0,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.log('Logging error (non-critical):', logError)
    }

    // === Returnera resultat ===
    return corsResponse({
      success: true,
      content: generatedContent,
      function: aiFunction,
      model: model,
      metadata: {
        tokensUsed: openRouterData.usage?.total_tokens,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})
