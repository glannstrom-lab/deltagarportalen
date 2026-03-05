// Edge Function: AI Assistant - Universal AI proxy via OpenRouter
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function createResponse(body: object, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // Get and validate body
    let body
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        return createResponse({ error: 'Empty request body' }, 400)
      }
      body = JSON.parse(text)
    } catch (e) {
      console.error('JSON parse error:', e)
      return createResponse({ error: 'Invalid JSON body' }, 400)
    }

    const { function: fn, data, model: overrideModel } = body

    if (!fn) {
      return createResponse({ error: 'Missing function parameter' }, 400)
    }

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createResponse({ error: 'Missing authorization' }, 401)
    }

    // Env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return createResponse({ error: 'Server config error' }, 500)
    }

    if (!openRouterKey) {
      return createResponse({ error: 'AI not configured' }, 503)
    }

    // Verify user
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return createResponse({ error: 'Invalid token' }, 401)
    }

    // Default model
    const defaultModel = Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet'
    const model = overrideModel || defaultModel

    // Build prompt based on function
    let systemPrompt = 'Du är en hjälpsam assistent på svenska.'
    let userPrompt = ''
    let maxTokens = 1000

    switch (fn) {
      case 'personligt-brev':
        systemPrompt = 'Du är en karriärcoach som skriver personliga brev på svenska.'
        userPrompt = `Skriv personligt brev för jobb: ${data?.jobTitle || 'titel'} på ${data?.companyName || data?.foretag || 'företaget'}. Jobbannons: ${data?.jobbAnnons || data?.jobDescription || ''}. Min bakgrund: ${data?.erfarenhet || ''}. Ton: ${data?.ton || 'professionell'}. Max 300 ord.`
        maxTokens = 1200
        break
      
      case 'cv-optimering':
        systemPrompt = 'Du är expert på CV-skrivning. Ge konstruktiv feedback på svenska.'
        userPrompt = `Ge feedback på CV för "${data?.yrke || 'jobb'}":\n${data?.cvText || ''}`
        maxTokens = 1500
        break
      
      case 'generera-cv-text':
        systemPrompt = 'Du är expert på CV-skrivning på svenska.'
        userPrompt = `Skriv CV-sammanfattning för ${data?.yrke}. Erfarenhet: ${data?.erfarenhet || 'varierad'}. Max 4 meningar.`
        maxTokens = 500
        break
      
      case 'intervju-forberedelser':
        systemPrompt = 'Du är jobbcoach på svenska.'
        userPrompt = `Förbered mig för intervju som ${data?.jobbTitel || 'kandidat'}. Erfarenhet: ${data?.erfarenhet || 'varierad'}.`
        maxTokens = 2000
        break
      
      case 'jobbtips':
        systemPrompt = 'Du är empatisk jobbcoach på svenska.'
        userPrompt = `Ge jobbsökartips. Intressen: ${data?.intressen || 'varierade'}. Hinder: ${data?.hinder || 'inga'}.`
        maxTokens = 1200
        break
      
      case 'loneforhandling':
        systemPrompt = 'Du är löneexpert på svenska.'
        userPrompt = `Löneförhandling för ${data?.roll}. Erfarenhet: ${data?.erfarenhetAr || 0} år.`
        maxTokens = 1500
        break
      
      default:
        return createResponse({ error: `Unknown function: ${fn}` }, 400)
    }

    console.log(`AI call: ${fn}, model: ${model}`)

    // Call OpenRouter
    const aiRes = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      console.error('OpenRouter error:', aiRes.status, err)
      return createResponse({ error: 'AI service error' }, 502)
    }

    const aiData = await aiRes.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createResponse({ error: 'Empty AI response' }, 502)
    }

    // Log usage (non-blocking)
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: fn,
        model,
        tokens_used: aiData.usage?.total_tokens || 0,
        created_at: new Date().toISOString()
      })
    } catch (e) {
      console.log('Log error:', e)
    }

    return createResponse({
      success: true,
      content,
      function: fn,
      model
    })

  } catch (err) {
    console.error('Error:', err)
    return createResponse({ error: 'Internal error' }, 500)
  }
})
