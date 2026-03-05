// Edge Function: AI-generering av personligt brev
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: object, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Cover letter request started')

    // 1. Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Authorization required' }, 401)
    }

    // 2. Get OpenRouter key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterKey) {
      console.error('OPENROUTER_API_KEY missing')
      return jsonResponse({ error: 'AI not configured - add OPENROUTER_API_KEY secret' }, 503)
    }

    // 3. Parse body
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
      tone = 'friendly'
    } = body

    if (!jobDescription || !companyName || !jobTitle) {
      return jsonResponse({ 
        error: 'Missing required fields',
        required: ['jobDescription', 'companyName', 'jobTitle'],
        received: { jobDescription: !!jobDescription, companyName: !!companyName, jobTitle: !!jobTitle }
      }, 400)
    }

    // 4. Build prompt
    const toneText = tone === 'formal' ? 'formellt och professionellt' 
                   : tone === 'enthusiastic' ? 'entusiastiskt och energiskt' 
                   : 'vänligt men professionellt'
    
    const cvInfo = cvData.firstName 
      ? `Kandidat: ${cvData.firstName} ${cvData.lastName}${cvData.summary ? `. ${cvData.summary}` : ''}`
      : 'Kandidat med relevant erfarenhet'

    // 5. Get model from env or use default
    const model = Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet'
    console.log(`Using model: ${model}`)

    // 6. Call OpenRouter with timeout
    console.log('Calling OpenRouter...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
    
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://deltagarportalen.se',
          'X-Title': 'Deltagarportalen'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `Du är en erfaren svensk karriärcoach som hjälper arbetssökande att skriva personliga brev. Skriv på svenska med ${toneText} tonläge. Brevet ska vara max 300 ord, personligt och professionellt.`
            },
            {
              role: 'user',
              content: `Skriv ett personligt brev för tjänsten "${jobTitle}" på ${companyName}.

${cvInfo}

Jobbeskrivning:
${jobDescription}

Skriv ett personligt brev som visar varför kandidaten passar för rollen.`
            }
          ],
          temperature: 0.7,
          max_tokens: 600
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenRouter error:', response.status, errorText)
        return jsonResponse({ 
          error: 'AI generation failed', 
          details: `Status ${response.status}` 
        }, 502)
      }

      const data = await response.json()
      const letter = data.choices?.[0]?.message?.content

      if (!letter) {
        console.error('No letter in response:', data)
        return jsonResponse({ error: 'No letter generated' }, 502)
      }

      console.log('Letter generated successfully')

      // 7. Return letter
      return jsonResponse({
        letter,
        metadata: {
          tone,
          model,
          tokensUsed: data.usage?.total_tokens,
          generatedAt: new Date().toISOString()
        }
      })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('OpenRouter timeout')
        return jsonResponse({ error: 'AI request timed out (25s)' }, 504)
      }
      throw fetchError
    }

  } catch (error: any) {
    console.error('Server error:', error)
    return jsonResponse({ 
      error: 'Server error', 
      message: error.message 
    }, 500)
  }
})
