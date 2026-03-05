// Edge Function: AI Assistant - Universal AI proxy via OpenRouter
// Stödjer flera modeller: OpenAI, Anthropic, Google, etc.
// Konfigureras via Supabase Secrets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Konfiguration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Tillgängliga AI-funktioner
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
  model?: string  // Optional: override default model
}

// Prompts för olika funktioner
const prompts: Record<AIFunction, (data: any) => { system: string; user: string; maxTokens: number }> = {
  'cv-optimering': (data) => ({
    system: `Du är en expert på CV-skrivning för arbetssökande som vill tillbaka till arbetsmarknaden. 
Ditt mål är att ge konstruktiv feedback på CV:n och föreslå förbättringar.
Var uppmuntrande och konkret. Fokusera på styrkor, inte svagheter.
Svara på svenska med tydliga rubriker och punkter.`,
    user: `Ge feedback på detta CV för yrket "${data.yrke || 'ospecificerat'}".

CV-TEXT:
${data.cvText}

Ge följande i ditt svar:
1. ÖVERGRIPANDE BEDÖMNING - en positiv sammanfattning av CV:ns styrkor
2. FÖRBÄTTRINGSFÖRSLAG - 3-5 konkreta förslag på förbättringar
3. SAKNAD INFORMATION - vad bör läggas till?
4. FRÅGOR ATT REFLECTERA ÖVER - 2-3 frågor som hjälper användaren tänka vidare`,
    maxTokens: 1500
  }),
  
  'generera-cv-text': (data) => ({
    system: `Du är en expert på CV-skrivning. Din uppgift är att skriva professionella CV-texter.
Skriv på svenska. Använd ett professionellt men personligt språk.
Fokusera på resultat och prestationer, inte bara arbetsuppgifter.`,
    user: `Skriv en professionell CV-sammanfattning (3-4 meningar) för:

Yrke: ${data.yrke}
Tidigare erfarenhet: ${data.erfarenhet || 'Varierad arbetslivserfarenhet'}
Utbildning: ${data.utbildning || 'Ej specificerad'}
Styrkor: ${data.styrkor || 'Pålitlig, arbetsvillig, positiv'}

Texten ska:
- Vara professionell men personlig
- Lyfta fram relevanta erfarenheter
- Nämna 2-3 styrkor
- Vara max 4 meningar`,
    maxTokens: 500
  }),
  
  'personligt-brev': (data) => {
    const tonInstructions: Record<string, string> = {
      professionell: ' professionell och balanserad',
      entusiastisk: ' entusiastisk och energisk',
      formell: ' formell och traditionell'
    }
    const ton = data.ton || 'professionell'
    return {
      system: `Du är en expert på att skriva personliga brev för jobbansökningar.
Skriv på svenska med en${tonInstructions[ton]} ton.
Brevet ska vara personligt, engagerande och visa varför just denna person passar för jobbet.`,
      user: `Skriv ett personligt brev baserat på:

JOBBANNONS:
${data.jobbAnnons}

MIN BAKGRUND:
${data.erfarenhet || 'Varierad arbetslivserfarenhet'}

VARFÖR JAG VILL HA JOBBET:
${data.motivering || 'Jag söker nya utmaningar och vill utvecklas'}

${data.namn ? `Mitt namn: ${data.namn}` : ''}

Struktur:
1. Inledning - fånga intresset, nämn varför du söker jobbet
2. Kropp - koppla din erfarenhet till jobbets krav (2-3 stycken)
3. Avslutning - call-to-action, uttryck intresse för intervju

Max 300-400 ord. Professionellt men personligt.`,
      maxTokens: 1200
    }
  },
  
  'intervju-forberedelser': (data) => ({
    system: `Du är en erfaren jobbcoach som hjälper personer förbereda sig för anställningsintervjuer.
Ge konkreta, praktiska råd. Svara på svenska.`,
    user: `Hjälp mig förbereda mig för en intervju som ${data.jobbTitel}${data.foretag ? ` på ${data.foretag}` : ''}.

MIN BAKGRUND:
${data.erfarenhet || 'Varierad erfarenhet'}

MINA STYRKOR:
${data.egenskaper || 'Pålitlig, samarbetsvillig, positiv'}

Ge följande:

1. TROLIGA INTERVJUFRÅGOR (5 frågor)
   Lista 5 vanliga frågor för denna roll

2. FÖRBEREDDA SVAR
   Ge förslag på hur jag kan svara på 3 av frågorna (använd STAR-metoden)

3. FRÅGOR ATT STÄLLA TILL ARBETSGIVAREN (3 frågor)
   Visa engagemang och intresse

4. TIPS FÖR INTERVJUN
   3-4 konkreta tips för att lyckas`,
    maxTokens: 2000
  }),
  
  'jobbtips': (data) => ({
    system: `Du är en empatisk jobbcoach som hjälper personer att hitta tillbaka till arbetsmarknaden.
Ge konkreta, uppmuntrande råd. Var realistisk men positiv.
Svara på svenska med tydliga rubriker.`,
    user: `Ge personliga jobbsökartips baserat på:

Intressen: ${data.intressen || 'Ej angivet'}
Tidigare erfarenhet: ${data.tidigareErfarenhet || 'Ej angivet'}
Eventuella hinder: ${data.hinder || 'Ej angivet'}
Mål: ${data.mal || 'Hitta ett meningsfullt arbete'}

Ge:
1. UPPMUNTRAN - en positiv kommentar om personens bakgrund
2. NÄSTA STEG - 3 konkreta, genomförbara åtgärder
3. YRKEN ATT UTFORSKA - 3-5 förslag på yrken som kan passa
4. BEMÖTA HINDER - praktiska råd för att hantera eventuella hinder`,
    maxTokens: 1200
  }),
  
  'ovningshjalp': (data) => ({
    system: `Du är en stöttande coach som hjälper användare med arbetsrelaterade övningar.
Ge konstruktiv vägledning, inte färdiga svar. Ställ följdfrågor som hjälper användaren tänka själv.
Svara på svenska. Var uppmuntrande och empatisk.`,
    user: `Hjälp mig med denna övning:

Övning: ${data.ovningId}
Steg: ${data.steg}
Fråga: ${data.fraga}

${data.anvandarSvar ? `Mitt nuvarande svar: ${data.anvandarSvar}` : 'Jag har inte börjat än och behöver hjälp att komma igång.'}

Ge:
1. VÄGLEDNING - hur kan jag tänka kring denna fråga?
2. EXEMPEL - ett kort exempel (inte ett färdigt svar att kopiera)
3. FÖLJDFRÅGOR - 2-3 frågor som hjälper mig reflektera djupare`,
      maxTokens: 1000
  }),
  
  'loneforhandling': (data) => ({
    system: `Du är en erfaren löneexpert och förhandlare. Du hjälper arbetssökande och anställda att förhandla lön.
Ge konkreta råd om lönenivåer och förhandlingsteknik. Svara på svenska.`,
    user: `Hjälp mig förbereda en löneförhandling:

Roll: ${data.roll}
Erfarenhet: ${data.erfarenhetAr || '0'} år
${data.nuvarandeLon ? `Nuvarande lön: ${data.nuvarandeLon} kr/mån` : 'Nuvarande lön: Ej anställd'}
Företagsstorlek: ${data.foretagsStorlek || 'Medelstort'}
Ort: ${data.ort || 'Stockholm'}

Ge:
1. LÖNESpANN - Vad är rimligt för denna roll? (ange ett spann)
2. FÖRBEREDELSE - Hur ska jag förbereda mig inför samtalet?
3. ARGUMENT - Vilka argument kan jag använda?
4. FÖRMÅNER - Vilka andra förmåner kan jag förhandla om?
5. DIALOG - Ett exempel på hur samtalet kan gå`,
    maxTokens: 1500
  }),
  
  'generell': (data) => ({
    system: data.systemPrompt || 'Du är en hjälpsam assistent. Svara på svenska.',
    user: data.prompt,
    maxTokens: data.maxTokens || 1000
  })
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Endast POST tillåten
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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

    // Hämta miljövariabler
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

    // Hämta användaren från token
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
    const body: AIRequest = await req.json()
    const { function: aiFunction, data, model: overrideModel } = body

    // Validera funktion
    if (!aiFunction || !prompts[aiFunction]) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or missing function',
          availableFunctions: Object.keys(prompts)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generera prompt
    const { system, user: userPrompt, maxTokens } = prompts[aiFunction](data)

    // Bestäm modell (från request, env, eller default)
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
      
      // Hantera specifika fel
      if (openRouterResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key. Please check OPENROUTER_API_KEY configuration.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (openRouterResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openRouterData = await openRouterResponse.json()
    const generatedContent = openRouterData.choices[0]?.message?.content

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI service' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Logga användning (async, vi väntar inte på resultatet)
    try {
      await supabaseClient.from('ai_usage_logs').insert({
        user_id: user.id,
        function_name: aiFunction,
        model: model,
        tokens_used: openRouterData.usage?.total_tokens || 0,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      // Ignorera loggningsfel
      console.log('Logging error (non-critical):', logError)
    }

    // Returnera resultat
    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        function: aiFunction,
        model: model,
        metadata: {
          tokensUsed: openRouterData.usage?.total_tokens,
          promptTokens: openRouterData.usage?.prompt_tokens,
          completionTokens: openRouterData.usage?.completion_tokens,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
