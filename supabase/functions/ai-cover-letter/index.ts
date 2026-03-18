// Edge Function: AI-generering av personligt brev
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// SECURITY: Sanitize user input
function sanitizeInput(input: string | undefined, maxLength: number = 3000): string {
  if (!input) return ''
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim()
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  try {
    console.log('Cover letter request started')

    // 1. Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Authorization required' }, 401, origin)
    }

    // 2. Get OpenRouter key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterKey) {
      console.error('OPENROUTER_API_KEY missing')
      return createCorsResponse({ error: 'AI not configured - add OPENROUTER_API_KEY secret' }, 503, origin)
    }

    // 3. Parse body
    let body
    try {
      body = await req.json()
    } catch {
      return createCorsResponse({ error: 'Invalid JSON' }, 400, origin)
    }

    const {
      cvData = {},
      jobDescription,
      companyName,
      jobTitle,
      tone = 'friendly'
    } = body

    if (!jobDescription || !companyName || !jobTitle) {
      return createCorsResponse({
        error: 'Missing required fields',
        required: ['jobDescription', 'companyName', 'jobTitle'],
        received: { jobDescription: !!jobDescription, companyName: !!companyName, jobTitle: !!jobTitle }
      }, 400, origin)
    }

    // 4. Build prompt with sanitized inputs
    const sanitizedJobTitle = sanitizeInput(jobTitle, 200)
    const sanitizedCompanyName = sanitizeInput(companyName, 200)
    const sanitizedJobDescription = sanitizeInput(jobDescription, 3000)

    const toneText = tone === 'formal' ? 'formellt och professionellt'
                   : tone === 'enthusiastic' ? 'entusiastiskt och energiskt'
                   : 'vänligt men professionellt'

    const cvInfo = cvData.firstName
      ? `Kandidat: ${sanitizeInput(cvData.firstName, 50)} ${sanitizeInput(cvData.lastName, 50)}${cvData.summary ? `. ${sanitizeInput(cvData.summary, 500)}` : ''}`
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
          'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
          'X-Title': 'Jobin'
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
              content: `Skriv ett personligt brev för tjänsten "${sanitizedJobTitle}" på ${sanitizedCompanyName}.

${cvInfo}

Jobbeskrivning:
${sanitizedJobDescription}

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
        return createCorsResponse({
          error: 'AI generation failed',
          details: `Status ${response.status}`
        }, 502, origin)
      }

      const data = await response.json()
      const letter = data.choices?.[0]?.message?.content

      if (!letter) {
        console.error('No letter in response:', data)
        return createCorsResponse({ error: 'No letter generated' }, 502, origin)
      }

      console.log('Letter generated successfully')

      // 7. Return letter
      return createCorsResponse({
        letter,
        metadata: {
          tone,
          model,
          tokensUsed: data.usage?.total_tokens,
          generatedAt: new Date().toISOString()
        }
      }, 200, origin)

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('OpenRouter timeout')
        return createCorsResponse({ error: 'AI request timed out (25s)' }, 504, origin)
      }
      throw fetchError
    }

  } catch (error: any) {
    console.error('Server error:', error)
    return createCorsResponse({
      error: 'Server error',
      message: error.message
    }, 500, origin)
  }
})
