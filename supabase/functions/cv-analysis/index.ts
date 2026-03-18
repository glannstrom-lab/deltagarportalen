// Edge Function: AI-analys av CV mot jobbannons
// Ger matchningsprocent och förslag på förbättringar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'

interface CVAnalysisRequest {
  cvData: {
    summary?: string
    workExperience?: Array<{
      title: string
      company: string
      description?: string
    }>
    skills?: string[]
    education?: Array<{
      degree: string
      school: string
    }>
    languages?: string[]
  }
  jobDescription: string
  jobRequirements?: string[]
}

interface AnalysisResult {
  matchPercentage: number
  matchingSkills: string[]
  missingSkills: string[]
  strengths: string[]
  improvements: string[]
  atsScore: number
  keywords: string[]
}

// SECURITY: Sanitize user input
function sanitizeText(input: string | undefined, maxLength: number = 5000): string {
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization header' }, 401, origin)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return createCorsResponse({ error: 'Invalid token' }, 401, origin)
    }

    const { cvData, jobDescription, jobRequirements = [] }: CVAnalysisRequest = await req.json()

    if (!jobDescription) {
      return createCorsResponse({ error: 'Missing job description' }, 400, origin)
    }

    // Hämta OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    // Förbered CV-text med sanitering
    const cvText = `
${sanitizeText(cvData.summary, 1000)}

Erfarenhet:
${cvData.workExperience?.map(e => `${sanitizeText(e.title, 100)} på ${sanitizeText(e.company, 100)}: ${sanitizeText(e.description, 500)}`).join('\n') || ''}

Kompetenser: ${cvData.skills?.map(s => sanitizeText(s, 50)).join(', ') || ''}
Utbildning: ${cvData.education?.map(e => sanitizeText(e.degree, 100)).join(', ') || ''}
Språk: ${cvData.languages?.map(l => sanitizeText(l, 30)).join(', ') || ''}
    `.trim()

    const sanitizedJobDescription = sanitizeText(jobDescription, 5000)
    const sanitizedRequirements = jobRequirements.map(r => sanitizeText(r, 200))

    let analysisResult: AnalysisResult

    if (openAIApiKey) {
      // Använd OpenAI för avancerad analys
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
              content: `Du är en expert på rekrytering och CV-optimering.
Analysera matchningen mellan kandidatens CV och jobbeskrivningen.
Returnera svaret som ett JSON-objekt med följande struktur:
{
  "matchPercentage": 0-100,
  "matchingSkills": ["lista av matchande kompetenser"],
  "missingSkills": ["lista av saknade kompetenser"],
  "strengths": ["3-4 styrkor med jobbet"],
  "improvements": ["3-4 konkreta förslag på förbättringar"],
  "atsScore": 0-100,
  "keywords": ["viktiga nyckelord att inkludera"]
}
Var ärlig men konstruktiv. Fokusera på konkreta, handlingsbara råd.`
            },
            {
              role: 'user',
              content: `CV:\n${cvText}\n\nJobbeskrivning:\n${sanitizedJobDescription}\n\nKrav:\n${sanitizedRequirements.join('\n')}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      const openAIData = await openAIResponse.json()
      const aiResponse = openAIData.choices[0]?.message?.content

      try {
        analysisResult = JSON.parse(aiResponse)
      } catch {
        // Fallback om AI inte returnerar valid JSON
        analysisResult = generateFallbackAnalysis(cvText, sanitizedJobDescription)
      }
    } else {
      // Fallback utan AI - enkel nyckelordsmatchning
      analysisResult = generateFallbackAnalysis(cvText, sanitizedJobDescription)
    }

    // Spara analysen i databasen
    await supabaseClient.from('cv_analyses').upsert({
      user_id: user.id,
      job_description: sanitizedJobDescription.substring(0, 1000),
      match_percentage: analysisResult.matchPercentage,
      matching_skills: analysisResult.matchingSkills,
      missing_skills: analysisResult.missingSkills,
      recommendations: analysisResult.improvements,
      ats_score: analysisResult.atsScore,
      created_at: new Date().toISOString()
    })

    return createCorsResponse(analysisResult, 200, origin)

  } catch (error) {
    console.error('Error:', error)
    return createCorsResponse({ error: 'Internal server error' }, 500, origin)
  }
})

// Fallback-analys utan AI
function generateFallbackAnalysis(cvText: string, jobDescription: string): AnalysisResult {
  const cvLower = cvText.toLowerCase()
  const jobLower = jobDescription.toLowerCase()

  // Vanliga kompetenser att söka efter
  const commonSkills = [
    'kommunikation', ' teamwork', 'ledarskap', 'projektledning', 'excel', 'word',
    'powerpoint', 'svenska', 'engelska', 'kundservice', 'försäljning', 'administration',
    'programmering', 'javascript', 'python', 'react', 'sql', 'analys', 'problemlösning'
  ]

  const matchingSkills: string[] = []
  const missingSkills: string[] = []

  commonSkills.forEach(skill => {
    const inJob = jobLower.includes(skill)
    const inCv = cvLower.includes(skill)

    if (inJob && inCv) {
      matchingSkills.push(skill)
    } else if (inJob && !inCv) {
      missingSkills.push(skill)
    }
  })

  // Beräkna matchningsprocent
  const jobWords = jobLower.split(/\s+/)
  const cvWords = new Set(cvLower.split(/\s+/))
  const matchingWords = jobWords.filter(w => cvWords.has(w)).length
  const matchPercentage = Math.min(95, Math.round((matchingWords / jobWords.length) * 100))

  // ATS-score baserat på format
  const atsScore = calculateFallbackATSScore(cvText)

  return {
    matchPercentage,
    matchingSkills: matchingSkills.slice(0, 5),
    missingSkills: missingSkills.slice(0, 5),
    strengths: [
      'CV:et innehåller relevant information',
      'Strukturen är tydlig',
      'Erfarenheter är beskrivna'
    ],
    improvements: [
      missingSkills.length > 0 ? `Överväg att lägga till: ${missingSkills.slice(0, 3).join(', ')}` : 'Lägg till fler specifika kompetenser',
      'Använd nyckelord från jobbeskrivningen',
      'Kvantifiera resultat där det är möjligt (t.ex. "ökade försäljningen med 20%")'
    ],
    atsScore,
    keywords: missingSkills.slice(0, 5)
  }
}

function calculateFallbackATSScore(cvText: string): number {
  let score = 70 // Baspoäng

  // Positiva faktorer
  if (cvText.length > 500) score += 5
  if (cvText.includes('erfarenhet')) score += 5
  if (cvText.includes('utbildning')) score += 5
  if (/\d+%/.test(cvText)) score += 5 // Kvantifierade resultat

  // Negativa faktorer
  if (cvText.includes(' jag ')) score -= 5 // För mycket "jag"
  if (cvText.split(' ').length > 800) score -= 5 // För långt

  return Math.max(0, Math.min(100, score))
}
