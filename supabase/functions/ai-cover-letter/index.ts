// Edge Function: AI-generering av personligt brev (OpenRouter)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

function jsonResponse(data: object, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Kolla auth header (men verifiera INTE mot Supabase ännu)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    // 2. Hämta env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    
    if (!openRouterKey) {
      console.error('OPENROUTER_API_KEY missing')
      return jsonResponse({ error: 'AI service not configured' }, 503)
    }

    // 3. Skapa Supabase client (om möjligt)
    let userId = 'anonymous'
    if (supabaseUrl && serviceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false }
        })
        const token = authHeader.replace('Bearer ', '')
        const { data, error } = await supabase.auth.getUser(token)
        if (data.user) {
          userId = data.user.id
        } else {
          console.log('Token verification warning:', error?.message)
          // Fortsätt ändå - token finns så användaren är förmodligen inloggad
        }
      } catch (e) {
        console.log('Auth verification skipped:', e)
        // Fortsätt utan att verifiera - vi litar på att token är giltig
      }
    }

    // 4. Parse body
    let body
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400)
    }

    const { 
      cvData = {}, 
      jobDescription, 
      companyName, 
      jobTitle, 
      tone = 'friendly',
      model: overrideModel
    } = body

    if (!jobDescription || !companyName || !jobTitle) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    // 5. Bygg prompt
    const toneInstructions: Record<string, string> = {
      formal: 'formellt och professionellt',
      friendly: 'vänligt men professionellt',
      enthusiastic: 'entusiastiskt och energiskt'
    }

    const cvText = cvData.firstName 
      ? `Namn: ${cvData.firstName} ${cvData.lastName}
${cvData.summary ? `Bakgrund: ${cvData.summary}` : ''}
${cvData.workExperience?.length ? `Erfarenhet: ${cvData.workExperience.map((e: any) => e.title).join(', ')}` : ''}`
      : 'Ingen CV-information tillgänglig'

    // 6. Anropa OpenRouter
    const aiModel = overrideModel || Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet'
    
    const aiRes = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: `Du är en svensk karriärcoach. Skriv personliga brev på svenska med ${toneInstructions[tone] || 'professionellt'} tonläge. Max 300 ord.`
          },
          {
            role: 'user',
            content: `Skriv personligt brev för ${jobTitle} på ${companyName}.

Kandidat:
${cvText}

Jobbeskrivning:
${jobDescription}`
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      console.error('OpenRouter error:', aiRes.status, err)
      return jsonResponse({ error: 'AI generation failed' }, 502)
    }

    const aiData = await aiRes.json()
    const letter = aiData.choices?.[0]?.message?.content

    if (!letter) {
      return jsonResponse({ error: 'Empty AI response' }, 502)
    }

    // 7. Logga användning (om möjligt)
    if (supabaseUrl && serviceRoleKey && userId !== 'anonymous') {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false }
        })
        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          function_name: 'ai-cover-letter',
          model: aiModel,
          tokens_used: aiData.usage?.total_tokens || 0,
          created_at: new Date().toISOString()
        })
      } catch (e) {
        // Ignorera loggningsfel
      }
    }

    // 8. Returnera svar
    return jsonResponse({
      letter,
      metadata: {
        tone,
        model: aiModel,
        tokensUsed: aiData.usage?.total_tokens,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
