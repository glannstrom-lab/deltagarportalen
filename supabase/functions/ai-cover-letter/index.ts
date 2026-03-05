// Edge Function: AI-generering av personligt brev
// Kräver bara OPENROUTER_API_KEY - ingen service_role key behövs!

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export default async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Kolla att användaren skickat med token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Hämta OpenRouter key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterKey) {
      console.error('OPENROUTER_API_KEY saknas')
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Parse request body
    let body
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { 
      cvData = {}, 
      jobDescription, 
      companyName, 
      jobTitle, 
      tone = 'friendly'
    } = body

    if (!jobDescription || !companyName || !jobTitle) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Bygg prompt
    const toneText = tone === 'formal' ? 'formellt' : tone === 'enthusiastic' ? 'entusiastiskt' : 'vänligt'
    
    const cvInfo = cvData.firstName 
      ? `${cvData.firstName} ${cvData.lastName}. ${cvData.summary || ''}`
      : 'Kandidat'

    // 5. Anropa OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `Du är en svensk karriärcoach. Skriv personliga brev på svenska med ${toneText} ton. Max 300 ord.`
          },
          {
            role: 'user',
            content: `Skriv ett personligt brev för tjänsten "${jobTitle}" på ${companyName}.

Om kandidaten: ${cvInfo}

Jobbeskrivning: ${jobDescription}`
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', response.status, errorText)
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const letter = data.choices?.[0]?.message?.content

    if (!letter) {
      return new Response(JSON.stringify({ error: 'No letter generated' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 6. Returnera brevet
    return new Response(JSON.stringify({
      letter,
      metadata: {
        tone,
        tokensUsed: data.usage?.total_tokens
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
