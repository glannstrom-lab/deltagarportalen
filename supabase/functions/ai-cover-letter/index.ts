// Edge Function: AI-generering av personligt brev (Uppdaterad för OpenRouter)
// Anropas fran frontend nar anvandare vill generera brev

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenRouter API URL
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface CoverLetterRequest {
  cvData: {
    firstName: string
    lastName: string
    title?: string
    summary?: string
    workExperience?: Array<{
      title: string
      company: string
      description?: string
    }>
    skills?: string[]
  }
  jobDescription: string
  companyName: string
  jobTitle: string
  tone?: 'formal' | 'friendly' | 'enthusiastic'
  focus?: 'experience' | 'skills' | 'motivation'
  model?: string // Optional: override default model
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifiera JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hamta miljovariabler
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!openRouterApiKey) {
      console.error('Missing OPENROUTER_API_KEY')
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please set OPENROUTER_API_KEY secret.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skapa Supabase client med service role
    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    )

    // Hamta anvandaren fran token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const { 
      cvData, 
      jobDescription, 
      companyName, 
      jobTitle, 
      tone = 'friendly', 
      focus = 'experience',
      model: overrideModel
    } = body as CoverLetterRequest

    // Validera input
    if (!jobDescription || !companyName || !jobTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bygg prompt baserat pa tonlage
    const toneInstructions: Record<string, string> = {
      formal: 'ett formellt och professionellt tonlage',
      friendly: 'ett vanligt men professionellt tonlage',
      enthusiastic: 'ett entusiastiskt och energiskt tonlage'
    }

    const focusInstructions: Record<string, string> = {
      experience: 'lyft fram relevant arbetslivserfarenhet och konkreta resultat',
      skills: 'fokusera pa specifika kompetenser och hur de matchar jobbet',
      motivation: 'betona motivation och varfor du vill jobba just hos detta foretag'
    }

    // Bygg CV-sammanfattning
    const workExpText = cvData.workExperience?.length 
      ? `Erfarenhet: ${cvData.workExperience.map(e => `${e.title} pa ${e.company}`).join(', ')}`
      : ''
    
    const skillsText = cvData.skills?.length
      ? `Kompetenser: ${cvData.skills.join(', ')}`
      : ''

    const cvSummary = `
Namn: ${cvData.firstName} ${cvData.lastName}
${cvData.title ? `Yrkestitel: ${cvData.title}` : ''}
${cvData.summary ? `Sammanfattning: ${cvData.summary}` : ''}
${workExpText}
${skillsText}
    `.trim()

    // Bestäm modell
    const defaultModel = Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet'
    const model = overrideModel || defaultModel

    // Anropa OpenRouter
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
          {
            role: 'system',
            content: `Du ar en erfaren svensk karriarcoach som hjalper arbetssokande att skriva personliga brev. 
Skriv pa svenska med ${toneInstructions[tone]}.
Brevet ska vara max 300 ord och ${focusInstructions[focus]}.
Var personlig men professionell. Undvik klicheer.
Fokusera pa konkreta exempel och vad kandidaten kan tillfora foretaget.`
          },
          {
            role: 'user',
            content: `Skriv ett personligt brev for foljande kandidat:

${cvSummary}

Jobb de soker: ${jobTitle}
Foretag: ${companyName}

Jobbeskrivning:
${jobDescription}

Skriv brevet sa att det kanns personligt och visar att kandidaten har last jobbeskrivningen noggrant.`
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter error:', openRouterResponse.status, errorText)
      
      if (openRouterResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key configuration' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (openRouterResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate cover letter' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openRouterData = await openRouterResponse.json()
    const generatedLetter = openRouterData.choices[0]?.message?.content

    if (!generatedLetter) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Logga anvandning (for statistik) - ignorerar fel har
    try {
      await supabaseClient.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: 'ai-cover-letter',
        model: model,
        tokens_used: openRouterData.usage?.total_tokens || 0,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      // Ignorera loggningsfel
      console.log('Logging error (non-critical):', logError)
    }

    // Returnera genererat brev
    return new Response(
      JSON.stringify({
        letter: generatedLetter,
        metadata: {
          tone,
          focus,
          model,
          tokensUsed: openRouterData.usage?.total_tokens,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
