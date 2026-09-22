/**
 * AI Career Assistant Edge Function
 * Unified handler for career-related AI queries using Perplexity Sonar
 *
 * Supports:
 * - interview-prep: Interview preparation with company research
 * - salary-compass: Salary market data and insights
 * - networking-help: Networking message generation
 * - education-guide: Education paths and course recommendations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse } from '../_shared/cors.ts'
import { checkRateLimit, createRateLimitResponse } from '../_shared/rateLimit.ts'
import {
  checkAiEnabled,
  valjModell,
  UTAN_SOKNING_TILLAGG,
  createGateDenialResponse,
  checkDailyTokenCap,
  createTokenCapResponse,
  sanitizeForPrompt,
  loggaAiAnvandning,
  tokensIUsage,
} from '../_shared/aiGate.ts'
import { medFelrapport } from '../_shared/sentry.ts'
import { fetchMedTimeout, TIDSGRANS_AI_MS } from '../_shared/fetchMedTimeout.ts'
import { felstatus } from '../_shared/felstatus.ts'
import { tolkaBegaran } from './begaran.ts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Indatagränser — SÄK1 (2026-09-22): den här filen interpolerade alla fyra
// param-uppsättningarna rakt in i prompten utan `sanitizeForPrompt`, till
// skillnad från de andra fyra Perplexity-funktionerna (commute-planner,
// industry-radar, company-analysis, company-search), som alla saniterar
// innan prompten byggs. En `jobDescription` eller `userBackground` med
// radbrytningar och egna instruktioner gick alltså rakt in som om den vore
// en del av systemprompten — samma injektionsklass som `aiGate.ts`
// dokumenterar för `maxResults` i company-search. Längdtaken matchar de
// andra funktionernas (företagsnamn/yrke ~120, fritext/beskrivning längre).
const MAX_KORT = 120
const MAX_MEDEL = 300
const MAX_LANG = 2000
const MAX_ANTAL_KOMPETENSER = 20
const MAX_KOMPETENS_LANGD = 60

/** Saniterar varje sträng i en lista (kompetenser, färdigheter) och kapar antalet. */
function sanitizeLista(v: unknown, maxAntal: number, maxLangd: number): string[] {
  if (!Array.isArray(v)) return []
  return v
    .slice(0, maxAntal)
    .map((item) => sanitizeForPrompt(item, maxLangd))
    .filter(Boolean)
}

// Assistant types och begärans form: se ./begaran.ts (tolkaBegaran).

// Response structures
interface InterviewPrepResponse {
  companyInfo: {
    summary: string
    recentNews: string[]
    culture: string
    challenges: string[]
  }
  interviewQuestions: {
    common: string[]
    roleSpecific: string[]
    behavioral: string[]
  }
  tipsForCandidate: string[]
  questionsToAsk: string[]
  salaryExpectations: {
    range: string
    negotiationTips: string[]
  }
}

interface SalaryCompassResponse {
  marketData: {
    averageSalary: string
    salaryRange: string
    percentile25: string
    percentile75: string
  }
  progression: {
    year1: string
    year3: string
    year5: string
  }
  comparisons: {
    industry: string
    region: string
    experience: string
  }[]
  highValueSkills: {
    skill: string
    salaryImpact: string
  }[]
  negotiationInsights: string[]
  sources: string[]
}

interface NetworkingHelpResponse {
  suggestedMessage: string
  alternativeOpenings: string[]
  followUpStrategy: string[]
  networkingTips: string[]
  relevantGroups: {
    name: string
    platform: string
    relevance: string
  }[]
  linkedInTips: string[]
}

interface EducationGuideResponse {
  freeCourses: {
    title: string
    provider: string
    url: string
    duration: string
    level: string
  }[]
  certifications: {
    name: string
    provider: string
    cost: string
    value: string
    timeToComplete: string
  }[]
  formalEducation: {
    type: string
    provider: string
    duration: string
    location: string
  }[]
  learningPath: {
    step: number
    action: string
    timeframe: string
    outcome: string
  }[]
  roiAnalysis: {
    investmentTime: string
    estimatedCost: string
    expectedSalaryIncrease: string
    paybackPeriod: string
  }
}

// Prompt templates
function buildInterviewPrepPrompt(params: Record<string, unknown>): string {
  const companyName = sanitizeForPrompt(params.companyName, MAX_KORT)
  // Org.nr normaliseras, saneras inte som fritext — samma regel som
  // ai-company-analysis: bara siffror/bindestreck är meningsfulla här.
  const orgNumber = sanitizeForPrompt(params.orgNumber, 20)
  const jobTitle = sanitizeForPrompt(params.jobTitle, MAX_KORT)
  const jobDescription = sanitizeForPrompt(params.jobDescription, MAX_LANG)

  return `Du är en expert på intervjuförberedelse för den svenska arbetsmarknaden.

UPPGIFT: Förbered en kandidat för en jobbintervju.

FÖRETAG: ${companyName}
${orgNumber ? `ORG.NR: ${orgNumber}` : ''}
TJÄNST: ${jobTitle || 'Ej specificerad'}
${jobDescription ? `BESKRIVNING: ${jobDescription}` : ''}

Sök på nätet efter aktuell information om företaget och branschen.

RETURNERA exakt detta JSON-format:
{
  "companyInfo": {
    "summary": "Kort beskrivning av företaget",
    "recentNews": ["Nyhet 1", "Nyhet 2", "Nyhet 3"],
    "culture": "Beskrivning av företagskultur",
    "challenges": ["Utmaning 1", "Utmaning 2"]
  },
  "interviewQuestions": {
    "common": ["Vanlig fråga 1", "Vanlig fråga 2", "Vanlig fråga 3"],
    "roleSpecific": ["Rollfråga 1", "Rollfråga 2"],
    "behavioral": ["Beteendefråga 1", "Beteendefråga 2"]
  },
  "tipsForCandidate": ["Tips 1", "Tips 2", "Tips 3"],
  "questionsToAsk": ["Fråga till arbetsgivaren 1", "Fråga 2", "Fråga 3"],
  "salaryExpectations": {
    "range": "XX 000 - YY 000 kr/mån",
    "negotiationTips": ["Tips 1", "Tips 2"]
  }
}

Svara ENDAST med giltig JSON.`
}

function buildSalaryCompassPrompt(params: Record<string, unknown>): string {
  const occupation = sanitizeForPrompt(params.occupation, MAX_KORT)
  const region = sanitizeForPrompt(params.region, MAX_KORT)
  // experienceYears ska vara ett litet heltal ("X år") — fritext här hade
  // gått rakt in i prompten precis som de andra fälten.
  const experienceYears = sanitizeForPrompt(params.experienceYears, 10)
  const skills = sanitizeLista(params.skills, MAX_ANTAL_KOMPETENSER, MAX_KOMPETENS_LANGD)

  return `Du är en expert på lönedata för den svenska arbetsmarknaden.

UPPGIFT: Ge aktuell lönestatistik och insikter.

YRKE: ${occupation}
REGION: ${region || 'Sverige'}
ERFARENHET: ${experienceYears || 'Ej specificerad'} år
${skills.length > 0 ? `KOMPETENSER: ${skills.join(', ')}` : ''}

SANNINGSREGEL — läs den innan du skriver något:
- Hitta ALDRIG på lönesiffror. Hittar du inte underlag för ett fält, skriv
  "Vi hittade inget underlag" i stället för ett tal. Ett tomt fält är bättre
  än ett påhittat.
- Påstå aldrig något om personen. Du vet bara yrket, orten och antalet år
  ovan — inget om hens nuvarande lön, anställning eller livssituation.
  Skriv inte "din nuvarande lön" och anta inte att personen har ett arbete.
- Skriv ut vilket år uppgifterna gäller när du vet det, och var siffran
  kommer ifrån. Är underlaget tunt — säg det.
- Rör svaret svenska regelverk (a-kassa, aktivitetsstöd, kollektivavtal):
  hänvisa till Arbetsförmedlingen, facket eller Medlingsinstitutet i stället
  för att återge belopp och villkor ur minnet.

Sök på SCB, Medlingsinstitutet, fackförbundens lönestatistik och andra
källor för aktuell lönedata.

RETURNERA exakt detta JSON-format:
{
  "marketData": {
    "averageSalary": "XX 000 kr/mån",
    "salaryRange": "XX 000 - YY 000 kr/mån",
    "percentile25": "XX 000 kr/mån",
    "percentile75": "YY 000 kr/mån"
  },
  "progression": {
    "year1": "XX 000 kr/mån",
    "year3": "YY 000 kr/mån",
    "year5": "ZZ 000 kr/mån"
  },
  "comparisons": [
    {"industry": "Bransch", "region": "Storstadsområde", "experience": "Senior"}
  ],
  "highValueSkills": [
    {"skill": "Kompetens", "salaryImpact": "+X 000 kr/mån"}
  ],
  "negotiationInsights": ["Insikt 1", "Insikt 2"],
  "sources": ["Källa 1", "Källa 2"]
}

Svara ENDAST med giltig JSON.`
}

function buildNetworkingHelpPrompt(params: Record<string, unknown>): string {
  const contactName = sanitizeForPrompt(params.contactName, MAX_KORT)
  const contactTitle = sanitizeForPrompt(params.contactTitle, MAX_KORT)
  const contactCompany = sanitizeForPrompt(params.contactCompany, MAX_KORT)
  const userGoal = sanitizeForPrompt(params.userGoal, MAX_MEDEL)
  const userBackground = sanitizeForPrompt(params.userBackground, MAX_LANG)
  const platform = sanitizeForPrompt(params.platform, MAX_KORT)

  return `Du är en expert på professionellt nätverkande i Sverige.

UPPGIFT: Hjälp användaren att nätverka effektivt.

KONTAKT: ${contactName || 'Okänd'}
TITEL: ${contactTitle || 'Ej specificerad'}
FÖRETAG: ${contactCompany || 'Ej specificerat'}
PLATTFORM: ${platform || 'LinkedIn'}
ANVÄNDARENS MÅL: ${userGoal || 'Bygga nätverk'}
${userBackground ? `BAKGRUND: ${userBackground}` : ''}

RETURNERA exakt detta JSON-format:
{
  "suggestedMessage": "Komplett meddelande på svenska (max 300 tecken för LinkedIn)",
  "alternativeOpenings": ["Alternativ öppning 1", "Alternativ öppning 2"],
  "followUpStrategy": ["Steg 1", "Steg 2", "Steg 3"],
  "networkingTips": ["Tips 1", "Tips 2", "Tips 3"],
  "relevantGroups": [
    {"name": "Gruppnamn", "platform": "LinkedIn/Meetup", "relevance": "Varför relevant"}
  ],
  "linkedInTips": ["LinkedIn-tips 1", "LinkedIn-tips 2"]
}

Svara ENDAST med giltig JSON.`
}

function buildEducationGuidePrompt(params: Record<string, unknown>): string {
  const targetOccupation = sanitizeForPrompt(params.targetOccupation, MAX_KORT)
  const currentSkills = sanitizeLista(params.currentSkills, MAX_ANTAL_KOMPETENSER, MAX_KOMPETENS_LANGD)
  const budget = sanitizeForPrompt(params.budget, MAX_KORT)
  const timeAvailable = sanitizeForPrompt(params.timeAvailable, MAX_KORT)
  const location = sanitizeForPrompt(params.location, MAX_KORT)

  return `Du är en expert på utbildning och kompetensutveckling för den svenska arbetsmarknaden.

UPPGIFT: Rekommendera utbildningsvägar.

MÅLYRKE: ${targetOccupation}
${currentSkills.length > 0 ? `NUVARANDE KOMPETENSER: ${currentSkills.join(', ')}` : ''}
BUDGET: ${budget || 'Ej specificerad'}
TID TILLGÄNGLIG: ${timeAvailable || 'Ej specificerad'}
PLATS: ${location || 'Sverige'}

Sök efter kurser på Coursera, edX, LinkedIn Learning, Yrkeshögskolor, och universitet.

RETURNERA exakt detta JSON-format:
{
  "freeCourses": [
    {"title": "Kursnamn", "provider": "Coursera/edX/YouTube", "url": "URL om känd", "duration": "X veckor", "level": "Nybörjare/Medel/Avancerad"}
  ],
  "certifications": [
    {"name": "Certifiering", "provider": "Utfärdare", "cost": "X kr", "value": "Hur arbetsgivare värderar den", "timeToComplete": "X månader"}
  ],
  "formalEducation": [
    {"type": "YH/Universitet/Kurs", "provider": "Skola", "duration": "X år", "location": "Ort"}
  ],
  "learningPath": [
    {"step": 1, "action": "Vad göra", "timeframe": "X månader", "outcome": "Vad du kan efteråt"}
  ],
  "roiAnalysis": {
    "investmentTime": "X månader",
    "estimatedCost": "X kr",
    "expectedSalaryIncrease": "X-Y%",
    "paybackPeriod": "X månader"
  }
}

Svara ENDAST med giltig JSON.`
}

// Parse AI response
function parseAIResponse<T>(content: string): T | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    return null
  } catch (e) {
    console.error('[ai-career-assistant] JSON parse error:', e)
    return null
  }
}

Deno.serve(medFelrapport('ai-career-assistant', async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    // Parse request. 2026-09-22: trasig JSON och saknade `params` blev 500
    // (kast i req.json() respektive i promptbyggaren) — och det efter auth,
    // AI-grind, tokentak och rate limit. Nu 400, före allt uppslag.
    // Vaktat av begaran.test.ts.
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return createCorsResponse({ error: 'Ogiltig JSON' }, 400, origin)
    }
    const begaran = tolkaBegaran(body)
    if (!begaran.ok) {
      return createCorsResponse({ error: begaran.error }, 400, origin)
    }
    const { type, params } = begaran

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Unauthorized' }, 401, origin)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!supabaseUrl || !serviceRoleKey || !openRouterKey) {
      return createCorsResponse({ error: 'Server configuration error' }, 500, origin)
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

    // AI-BRYTAREN (GDPR art. 21). FAIL CLOSED — se motiveringen i aiGate.ts.
    // Funktionen kör `perplexity/sonar` och skickar användarens yrke, ort och
    // fritext vidare till en tredjepart som dessutom söker på webben. Fram
    // till 2026-08-20 gällde `profiles.ai_enabled = false` inte här: den som
    // stängt av AI i Inställningar fick ändå ett fullt AI-svar. Klientsidans
    // `AiConsentGate` är ett gränssnitt, inte en grind — den går att gå förbi
    // genom att anropa funktionen direkt.
    //
    // `supabase` här är service-role-klienten, vilket är vad grinden kräver
    // för att säkert nå profilraden. Skicka aldrig in en anon-klient (A19).
    const aiGate = await checkAiEnabled(supabase, user.id)
    if (!aiGate.allowed) {
      console.warn(`[ai-career-assistant] Nekad av AI-grind (${aiGate.reason}) för ${user.id}`)
      return createGateDenialResponse(aiGate.reason ?? 'lookup_failed', origin)
    }

    // DAGLIGT TOKENTAK. Delar budget med `client/api/ai.js` (samma
    // `ai_usage_logs`) — funktionen åt tidigare den budgeten utan att räknas.
    const tokenCap = await checkDailyTokenCap(supabase, user.id)
    if (!tokenCap.allowed) {
      console.warn(`[ai-career-assistant] Nekad av tokentak (${tokenCap.reason}) för ${user.id}`)
      return createTokenCapResponse(tokenCap, origin)
    }

    // Rate limiting
    const rateCheck = await checkRateLimit(user.id, 'ai-career-assistant')
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.retryAfter!, origin)
    }

    console.log(`[ai-career-assistant] User ${user.id} requesting: ${type}`)

    // Build prompt based on type
    let prompt: string
    switch (type) {
      case 'interview-prep':
        prompt = buildInterviewPrepPrompt(params)
        break
      case 'salary-compass':
        prompt = buildSalaryCompassPrompt(params)
        break
      case 'networking-help':
        prompt = buildNetworkingHelpPrompt(params)
        break
      case 'education-guide':
        prompt = buildEducationGuidePrompt(params)
        break
      default:
        return createCorsResponse({ error: 'Invalid type' }, 400, origin)
    }

    // Modellval (PUB-avvikelse 2, beslut 2026-09-12): Perplexity bara för fria konton.
    const modell = await valjModell(supabase, user.id)

    // Anropa modellen via OpenRouter (sonar för fria konton, basmodell för organisationer)
    const aiResponse = await fetchMedTimeout(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://jobin.se',
        'X-Title': `Jobin Career Assistant - ${type}`,
      },
      body: JSON.stringify({
        model: modell.model,
        messages: [
          { role: 'user', content: modell.webbsokning ? prompt : prompt + UTAN_SOKNING_TILLAGG },
        ],
        max_tokens: 2500,
        temperature: 0.3,
      }),
    }, TIDSGRANS_AI_MS)

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error(`[ai-career-assistant] OpenRouter error:`, aiResponse.status, errorText)
      return createCorsResponse({ error: 'AI-tjänsten är inte tillgänglig just nu' }, 502, origin)
    }

    const aiData = await aiResponse.json()

    // Förbrukningen loggas FÖRE tolkningen: tokens är betalda även om svaret
    // sedan inte går att tolka. Se loggaAiAnvandning i aiGate.ts.
    await loggaAiAnvandning(supabase, {
      userId: user.id,
      funktion: `career-assistant-${type}`,
      model: modell.model,
      tokens: tokensIUsage(aiData),
    })

    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return createCorsResponse({ error: 'Inget svar från AI' }, 502, origin)
    }

    // Parse response
    let result
    switch (type) {
      case 'interview-prep':
        result = parseAIResponse<InterviewPrepResponse>(content)
        break
      case 'salary-compass':
        result = parseAIResponse<SalaryCompassResponse>(content)
        break
      case 'networking-help':
        result = parseAIResponse<NetworkingHelpResponse>(content)
        break
      case 'education-guide':
        result = parseAIResponse<EducationGuideResponse>(content)
        break
    }

    if (!result) {
      // Bara längden: svaret kan återge användarens bakgrund och kontaktens namn.
      console.error(`[ai-career-assistant] Failed to parse AI response (${content.length} tecken)`)
      return createCorsResponse({ error: 'Kunde inte tolka AI-svaret' }, 500, origin)
    }

    console.log(`[ai-career-assistant] Success for ${type}`)

    return createCorsResponse({
      success: true,
      type,
      result,
      citations: aiData.citations || [],
    }, 200, origin)

  } catch (err) {
    console.error('[ai-career-assistant] Error:', err)
    // Timeout mot OpenRouter = 504, inte 500. Se _shared/felstatus.ts.
    const fel = felstatus(err)
    return createCorsResponse({ error: fel.error }, fel.status, origin)
  }
}))
