// Edge Function: AI-generering av personligt brev
// Anropas från frontend när användare vill generera brev

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      console.error('❌ Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hämta miljövariabler
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!serviceRoleKey 
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error - missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skapa Supabase client med service role
    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    )

    // Hämta användaren från token
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Validating token...', token.substring(0, 20) + '...')
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError) {
      console.error('❌ Token validation error:', userError)
      return new Response(
        JSON.stringify({ error: `Invalid token: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!user) {
      console.error('❌ No user found for token')
      return new Response(
        JSON.stringify({ error: 'Invalid token - user not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('✅ User authenticated:', user.id)

    // Parse request body
    const { cvData, jobDescription, companyName, jobTitle, tone = 'friendly', focus = 'experience' }: CoverLetterRequest = await req.json()

    // Validera input
    if (!jobDescription || !companyName || !jobTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hämta OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bygg prompt baserat på tonläge
    const toneInstructions = {
      formal: 'ett formellt och professionellt tonläge',
      friendly: 'ett vänligt men professionellt tonläge',
      enthusiastic: 'ett entusiastiskt och energiskt tonläge'
    }

    const focusInstructions = {
      experience: 'lyft fram relevant arbetslivserfarenhet och konkreta resultat',
      skills: 'fokusera på specifika kompetenser och hur de matchar jobbet',
      motivation: 'betona motivation och varför du vill jobba just hos detta företag'
    }

    // Bygg CV-sammanfattning
    const cvSummary = `
Namn: ${cvData.firstName} ${cvData.lastName}
${cvData.title ? `Yrkestitel: ${cvData.title}` : ''}
${cvData.summary ? `Sammanfattning: ${cvData.summary}` : ''}
${cvData.workExperience?.length ? `Erfarenhet: ${cvData.workExperience.map(e => `${e.title} på ${e.company}`).join(', ')}` : ''}
${cvData.skills?.length ? `Kompetenser: ${cvData.skills.join(', ')}` : ''}
    `.trim()

    // Anropa OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Du är en erfaren svensk karriärcoach som hjälper arbetssökande att skriva personliga brev. 
Skriv på svenska med ${toneInstructions[tone]}.
Brevet ska vara max 300 ord och ${focusInstructions[focus]}.
Var personlig men professionell. Undvik klichéer som "jag är en social person".
Fokusera på konkreta exempel och vad kandidaten kan tillföra företaget.`
          },
          {
            role: 'user',
            content: `Skriv ett personligt brev för följande kandidat:

${cvSummary}

Jobb de söker: ${jobTitle}
Företag: ${companyName}

Jobbeskrivning:
${jobDescription}

Skriv brevet så att det känns personligt och visar att kandidaten har läst jobbeskrivningen noggrant.`
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate cover letter' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openAIData = await openAIResponse.json()
    const generatedLetter = openAIData.choices[0]?.message?.content

    if (!generatedLetter) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Logga användning (för statistik)
    await supabaseClient.from('ai_usage_logs').insert({
      user_id: user.id,
      function_name: 'ai-cover-letter',
      tokens_used: openAIData.usage?.total_tokens || 0,
      created_at: new Date().toISOString()
    })

    // Returnera genererat brev
    return new Response(
      JSON.stringify({
        letter: generatedLetter,
        metadata: {
          tone,
          focus,
          tokensUsed: openAIData.usage?.total_tokens,
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
