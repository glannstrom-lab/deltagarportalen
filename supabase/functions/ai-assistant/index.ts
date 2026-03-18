// Edge Function: AI Assistant - Universal AI proxy via OpenRouter
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// SECURITY: Sanitize user input before including in AI prompts
function sanitizeInput(input: string | undefined, maxLength: number = 5000): string {
  if (!input) return ''
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML/XML tags
    .trim()
}

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    // Get and validate body
    let body
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        return createCorsResponse({ error: 'Empty request body' }, 400, origin)
      }
      body = JSON.parse(text)
    } catch (e) {
      console.error('JSON parse error:', e)
      return createCorsResponse({ error: 'Invalid JSON body' }, 400, origin)
    }

    const { function: fn, data, model: overrideModel } = body

    if (!fn) {
      return createCorsResponse({ error: 'Missing function parameter' }, 400, origin)
    }

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization' }, 401, origin)
    }

    // Env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return createCorsResponse({ error: 'Server config error' }, 500, origin)
    }

    if (!openRouterKey) {
      return createCorsResponse({ error: 'AI not configured' }, 503, origin)
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

    // Default model
    const defaultModel = Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet'
    const model = overrideModel || defaultModel

    // Build prompt based on function with sanitized inputs
    let systemPrompt = 'Du är en hjälpsam assistent på svenska.'
    let userPrompt = ''
    let maxTokens = 1000

    switch (fn) {
      case 'personligt-brev':
        systemPrompt = 'Du är en karriärcoach som skriver personliga brev på svenska.'
        userPrompt = `Skriv personligt brev för jobb: ${sanitizeInput(data?.jobTitle, 200) || 'titel'} på ${sanitizeInput(data?.companyName || data?.foretag, 200) || 'företaget'}. Jobbannons: ${sanitizeInput(data?.jobbAnnons || data?.jobDescription, 3000)}. Min bakgrund: ${sanitizeInput(data?.erfarenhet, 2000)}. Ton: ${sanitizeInput(data?.ton, 50) || 'professionell'}. Max 300 ord.`
        maxTokens = 1200
        break

      case 'cv-optimering':
        systemPrompt = 'Du är expert på CV-skrivning. Ge konstruktiv feedback på svenska.'
        userPrompt = `Ge feedback på CV för "${sanitizeInput(data?.yrke, 100) || 'jobb'}":\n${sanitizeInput(data?.cvText, 5000)}`
        maxTokens = 1500
        break

      case 'generera-cv-text':
        systemPrompt = 'Du är expert på CV-skrivning på svenska.'
        userPrompt = `Skriv CV-sammanfattning för ${sanitizeInput(data?.yrke, 100)}. Erfarenhet: ${sanitizeInput(data?.erfarenhet, 1000) || 'varierad'}. Max 4 meningar.`
        maxTokens = 500
        break

      case 'intervju-forberedelser':
        systemPrompt = 'Du är jobbcoach på svenska.'
        userPrompt = `Förbered mig för intervju som ${sanitizeInput(data?.jobbTitel, 100) || 'kandidat'}. Erfarenhet: ${sanitizeInput(data?.erfarenhet, 1000) || 'varierad'}.`
        maxTokens = 2000
        break

      case 'jobbtips':
        systemPrompt = 'Du är empatisk jobbcoach på svenska.'
        userPrompt = `Ge jobbsökartips. Intressen: ${sanitizeInput(data?.intressen, 500) || 'varierade'}. Hinder: ${sanitizeInput(data?.hinder, 500) || 'inga'}.`
        maxTokens = 1200
        break

      case 'loneforhandling':
        systemPrompt = 'Du är löneexpert på svenska.'
        userPrompt = `Löneförhandling för ${sanitizeInput(data?.roll, 100)}. Erfarenhet: ${data?.erfarenhetAr || 0} år.`
        maxTokens = 1500
        break

      default:
        return createCorsResponse({ error: `Unknown function: ${fn}` }, 400, origin)
    }

    console.log(`AI call: ${fn}, model: ${model}`)

    // Call OpenRouter
    const aiRes = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
        'X-Title': 'Jobin'
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
      return createCorsResponse({ error: 'AI service error' }, 502, origin)
    }

    const aiData = await aiRes.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createCorsResponse({ error: 'Empty AI response' }, 502, origin)
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

    return createCorsResponse({
      success: true,
      content,
      function: fn,
      model
    }, 200, origin)

  } catch (err) {
    console.error('Error:', err)
    return createCorsResponse({ error: 'Internal error' }, 500, req.headers.get('Origin'))
  }
})
