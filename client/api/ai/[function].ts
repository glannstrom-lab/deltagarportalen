import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Input validation schemas
const baseInputSchema = z.object({}).passthrough();

const functionSchemas: Record<string, z.ZodSchema> = {
  'cv-optimering': z.object({
    cvText: z.string().min(10).max(50000),
    yrke: z.string().max(200).optional()
  }),
  'generera-cv-text': z.object({
    yrke: z.string().min(2).max(200),
    erfarenhet: z.string().max(2000).optional(),
    utbildning: z.string().max(1000).optional(),
    styrkor: z.string().max(1000).optional()
  }),
  'personligt-brev': z.object({
    cvData: z.any().optional(),
    companyName: z.string().max(200).optional(),
    jobTitle: z.string().max(200).optional(),
    jobDescription: z.string().max(50000).optional(),
    tone: z.enum(['professionell', 'entusiastisk', 'formell', 'professional', 'enthusiastic', 'formal']).optional(),
    extraContext: z.string().max(2000).optional(),
    jobbAnnons: z.string().max(50000).optional(),
    extraKeywords: z.string().max(1000).optional(),
    motivering: z.string().max(2000).optional()
  }),
  'intervju-forberedelser': z.object({
    jobbTitel: z.string().max(200).optional(),
    foretag: z.string().max(200).optional(),
    erfarenhet: z.string().max(2000).optional(),
    egenskaper: z.string().max(1000).optional()
  }),
  'jobbtips': z.object({
    intressen: z.string().max(1000).optional(),
    tidigareErfarenhet: z.string().max(2000).optional(),
    hinder: z.string().max(1000).optional(),
    mal: z.string().max(1000).optional()
  }),
  'loneforhandling': z.object({
    roll: z.string().min(2).max(200),
    erfarenhetAr: z.number().min(0).max(50).optional(),
    nuvarandeLon: z.number().min(0).max(1000000).optional(),
    foretagsStorlek: z.string().max(100).optional(),
    ort: z.string().max(100).optional()
  }),
  'karriarplan': z.object({
    currentOccupation: z.string().min(2).max(200),
    targetOccupation: z.string().min(2).max(200),
    experienceYears: z.number().min(0).max(50),
    currentSalary: z.number().min(0).max(1000000).optional(),
    targetSalary: z.number().min(0).max(1000000).optional(),
    demand: z.enum(['high', 'medium', 'low']).optional(),
    jobCount: z.number().min(0).optional()
  }),
  'chatbot': z.object({
    meddelande: z.string().min(1).max(5000),
    historik: z.array(z.object({
      roll: z.string(),
      innehall: z.string().max(5000)
    })).max(20).optional()
  }),
  'networking': z.object({
    occupation: z.string().max(200).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior']).optional(),
    goals: z.array(z.string()).optional(),
    contactName: z.string().max(200).optional(),
    contactRole: z.string().max(200).optional(),
    contactCompany: z.string().max(200).optional(),
    messageType: z.enum(['initial', 'followup', 'thankyou']).optional(),
    userOccupation: z.string().max(200).optional(),
    purpose: z.string().max(1000).optional(),
    relationship: z.string().max(100).optional(),
    generateMessage: z.boolean().optional()
  }),
  'salary': z.object({
    occupation: z.string().min(2).max(200),
    experience: z.number().min(0).max(50).optional()
  }),
  'skills': z.object({
    occupation: z.string().min(2).max(200),
    currentOccupation: z.string().max(200).optional()
  }),
  'career': z.object({
    currentOccupation: z.string().max(200).optional(),
    targetOccupation: z.string().max(200).optional(),
    experienceYears: z.number().min(0).max(50).optional()
  }),
  'linkedin-optimering': z.object({
    typ: z.enum(['headline', 'about', 'post', 'connection']),
    data: z.record(z.string().max(5000))
  }),
  'kompetensgap': z.object({
    cvText: z.string().min(10).max(50000),
    dromjobb: z.string().min(2).max(5000)
  }),
  'intervju-simulator': z.object({
    roll: z.string().min(2).max(200),
    foretag: z.string().max(200).optional(),
    anvandarSvar: z.string().max(5000).optional(),
    tidigareFragor: z.array(z.any()).optional()
  }),
  'cv-writing': z.object({
    content: z.string().max(10000),
    type: z.enum(['summary', 'experience', 'skills']),
    feature: z.enum(['improve', 'quantify', 'translate', 'generate'])
  })
};

function validateInput(fn: string, data: unknown): { success: true; data: unknown } | { success: false; error: string } {
  const schema = functionSchemas[fn] || baseInputSchema;
  const result = schema.safeParse(data);

  if (!result.success) {
    // Zod v4 uses 'issues' instead of 'errors'
    const issues = (result.error as any).issues || (result.error as any).errors || [];
    const errorStr = issues.map((e: any) => `${(e.path || []).join('.')}: ${e.message}`).join(', ');
    return { success: false, error: `Validation failed: ${errorStr}` };
  }

  return { success: true, data: result.data };
}
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

// Initialize Supabase client for auth verification
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function verifyAuth(req: VercelRequest): Promise<{ userId: string } | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return { userId: user.id };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

// Rate limiting with Supabase (serverless-compatible)
// Uses the check_rate_limit() PostgreSQL function

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX = 20; // 20 requests per window

// Service role client for rate limiting (bypasses RLS)
let serviceClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn('[Rate Limit] Supabase service role not configured');
    return null;
  }

  serviceClient = createClient(url, serviceKey);
  return serviceClient;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const client = getServiceClient();

  // If service client not configured, fail open in dev, warn in production
  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Rate Limit] WARNING: Supabase service role not configured in production!');
    }
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: 0 };
  }

  try {
    // Call the PostgreSQL rate limit function
    const { data, error } = await client.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: 'ai',
      p_max_requests: RATE_LIMIT_MAX,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });

    if (error) {
      console.error('[Rate Limit] Supabase error:', error);
      // On error, fail open but log the issue
      return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: 0 };
    }

    // The function returns an array with one row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: 0 };
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.reset_at ? Math.floor(new Date(result.reset_at).getTime() / 1000) : 0
    };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // On error, fail open but log the issue
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: 0 };
  }
}

async function callOpenRouter(messages: any[], options: any = {}) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY är inte konfigurerad');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'https://deltagarportalen.se',
      'X-Title': 'Deltagarportalen'
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter error:', error);
    throw new Error('Kunde inte kommunicera med AI-tjänsten');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Bygg prompts baserat på funktion
function buildPrompt(fn: string, data: any): { systemPrompt: string; userPrompt: string; maxTokens: number } {
  switch (fn) {
    case 'cv-optimering':
      return {
        systemPrompt: `Du är en expert på CV-skrivning för arbetssökande som vill tillbaka till arbetsmarknaden. 
Ditt mål är att ge konstruktiv feedback på CV:n och föreslå förbättringar.
Var uppmuntrande och konkret. Fokusera på styrkor, inte svagheter.
Svara på svenska med tydliga rubriker och punkter.`,
        userPrompt: `Ge feedback på detta CV för yrket "${data?.yrke || 'ospecificerat'}".

CV-TEXT:
${data?.cvText || ''}

Ge följande i ditt svar:
1. ÖVERGRIPANDE BEDÖMNING - en positiv sammanfattning av CV:ns styrkor
2. FÖRBÄTTRINGSFÖRSLAG - 3-5 konkreta förslag på förbättringar
3. SAKNAD INFORMATION - vad bör läggas till?
4. FRÅGOR ATT REFLECTERA ÖVER - 2-3 frågor som hjälper användaren tänka vidare`,
        maxTokens: 1500
      };

    case 'generera-cv-text':
      return {
        systemPrompt: `Du är en expert på CV-skrivning. Din uppgift är att skriva professionella CV-texter.
Skriv på svenska. Använd ett professionellt men personligt språk.
Fokusera på resultat och prestationer, inte bara arbetsuppgifter.`,
        userPrompt: `Skriv en professionell CV-sammanfattning (3-4 meningar) för:

Yrke: ${data?.yrke}
Tidigare erfarenhet: ${data?.erfarenhet || 'Varierad arbetslivserfarenhet'}
Utbildning: ${data?.utbildning || 'Ej specificerad'}
Styrkor: ${data?.styrkor || 'Pålitlig, arbetsvillig, positiv'}

Texten ska:
- Vara professionell men personlig
- Lyfta fram relevanta erfarenheter
- Nämna 2-3 styrkor
- Vara max 4 meningar`,
        maxTokens: 500
      };

    case 'personligt-brev':
      const ton = data?.ton || 'professionell';
      const tonInstructions: Record<string, string> = {
        professionell: ' professionell och balanserad',
        entusiastisk: ' entusiastisk och energisk',
        formell: ' formell och traditionell'
      };
      
      // Build CV context if available
      let cvContext = '';
      if (data?.cvData) {
        const cv = data.cvData;
        cvContext = `

MIN CV-INFORMATION:
Namn: ${cv.firstName || ''} ${cv.lastName || ''}
Titel: ${cv.title || 'Ej angiven'}
Sammanfattning: ${cv.summary || 'Ej angiven'}

ERFARENHET:
${cv.workExperience?.map((exp: any) => `- ${exp.title} på ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}${exp.description ? `: ${exp.description.substring(0, 150)}` : ''}`).join('\n') || 'Ingen erfarenhet angiven'}

KOMPETENSER:
${cv.skills?.map((s: any) => s.name).join(', ') || 'Inga kompetenser angivna'}
`;
      }
      
      const jobbAnnonsText = data?.jobbAnnons || data?.jobDescription || '';
      
      // Beräkna faktisk längd på jobbannons för debugging
      const annonsLength = jobbAnnonsText.length;
      
      return {
        systemPrompt: `Du är en expert på att skriva personliga brev för jobbansökningar.
Skriv på svenska med en${tonInstructions[ton] || tonInstructions.professionell} ton.

ABSOLUT VIKTIGT - FÖLJ DESSA REGLER:
1. Du MÅSTE läsa och analysera jobbannonsen som finns i användarens meddelande
2. Du MÅSTE identifiera specifika krav från jobbannonsen
3. Du MÅSTE koppla dessa krav till personens faktiska erfarenheter från CV:t
4. Du FÅR INTE ignorera jobbannonsen och bara skriva generellt om personens CV
5. Brevet ska visa VARFÖR personen passar för DETTA specifika jobb, inte bara varför de är en bra kandidat generellt`,
        userPrompt: `Skriv ett personligt brev för följande jobb:

FÖRETAG: ${data?.companyName || 'Ej angivet'}
JOBBTITEL: ${data?.jobTitle || 'Ej angiven'}

${annonsLength > 0 ? `JOBBANNONS (${annonsLength} tecken - LÄS HELA!):
${jobbAnnonsText.substring(0, 3000)}` : 'OBS: Ingen jobbannons tillgänglig - be om mer information'}

MIN CV-INFORMATION:${cvContext || '\n(Ingen CV-data tillgänglig)'}
${data?.extraKeywords ? `\nEXTRA NYCKELORD/INTRESSEN:\n${data.extraKeywords}\n` : ''}
${data?.motivering ? `\nMIN MOTIVERING:\n${data.motivering}\n` : ''}

EXAKTA INSTRUKTIONER:
${annonsLength > 100 ? `1. Analysera jobbannonsen ovan och identifiera 2-3 specifika krav eller önskemål
2. Hitta motsvarande erfarenheter i mitt CV som matchar dessa krav
3. Skriv brevet så att det tydligt kopplar mina erfarenheter till jobbets specifika krav
4. Använd formuleringar som "Eftersom ni söker någon med [krav från annons], kan jag bidra med..."` : '1. OBS: Ingen jobbannons finns - skriv ett generellt brev baserat på CV:t'}
5. Brevet ska vara 250-350 ord
6. Nämn företagsnamnet och jobbtiteln tidigt i brevet
7. Avsluta med att be om intervju

Skriv det personliga brevet nu:`
        ,
        maxTokens: 1500
      };

    case 'intervju-forberedelser':
      return {
        systemPrompt: `Du är en erfaren jobbcoach som hjälper personer förbereda sig för anställningsintervjuer.
Ge konkreta, praktiska råd. Svara på svenska.`,
        userPrompt: `Hjälp mig förbereda mig för en intervju som ${data?.jobbTitel || 'kandidat'}${data?.foretag ? ` på ${data?.foretag}` : ''}.

MIN BAKGRUND:
${data?.erfarenhet || 'Varierad erfarenhet'}

MINA STYRKOR:
${data?.egenskaper || 'Pålitlig, samarbetsvillig, positiv'}

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
      };

    case 'jobbtips':
      return {
        systemPrompt: `Du är en empatisk jobbcoach som hjälper personer att hitta tillbaka till arbetsmarknaden.
Ge konkreta, uppmuntrande råd. Var realistisk men positiv.
Svara på svenska med tydliga rubriker.`,
        userPrompt: `Ge personliga jobbsökartips baserat på:

Intressen: ${data?.intressen || 'Ej angivet'}
Tidigare erfarenhet: ${data?.tidigareErfarenhet || 'Ej angivet'}
Eventuella hinder: ${data?.hinder || 'Ej angivet'}
Mål: ${data?.mal || 'Hitta ett meningsfullt arbete'}

Ge:
1. UPPMUNTRAN - en positiv kommentar om personens bakgrund
2. NÄSTA STEG - 3 konkreta, genomförbara åtgärder
3. YRKEN ATT UTFORSKA - 3-5 förslag på yrken som kan passa
4. BEMÖTA HINDER - praktiska råd för att hantera eventuella hinder`,
        maxTokens: 1200
      };

    case 'loneforhandling':
      return {
        systemPrompt: `Du är en erfaren löneexpert och förhandlare. Du hjälper arbetssökande och anställda att förhandla lön.
Ge konkreta råd om lönenivåer och förhandlingsteknik. Svara på svenska.`,
        userPrompt: `Hjälp mig förbereda en löneförhandling:

Roll: ${data?.roll}
Erfarenhet: ${data?.erfarenhetAr || '0'} år
${data?.nuvarandeLon ? `Nuvarande lön: ${data?.nuvarandeLon} kr/mån` : 'Nuvarande lön: Ej anställd'}
Företagsstorlek: ${data?.foretagsStorlek || 'Medelstort'}
Ort: ${data?.ort || 'Stockholm'}

Ge:
1. LÖNESpANN - Vad är rimligt för denna roll? (ange ett spann)
2. FÖRBEREDELSE - Hur ska jag förbereda mig inför samtalet?
3. ARGUMENT - Vilka argument kan jag använda?
4. FÖRMÅNER - Vilka andra förmåner kan jag förhandla om?
5. DIALOG - Ett exempel på hur samtalet kan gå`,
        maxTokens: 1500
      };

    case 'karriarplan':
      return {
        systemPrompt: `Du är en expert på karriärutveckling och kompetensöverföring. 
Din uppgift är att skapa realistiska, skräddarsydda karriärvägar för personer som vill byta eller utveckla sin karriär.

Du ska:
- Analysera vad personen har idag (nuvarande yrke, erfarenhet)
- Identifiera vad som krävs för att nå målyrket
- Skapa konkreta, genomförbara steg
- Fokusera på överförbara färdigheter
- Vara realistisk om tidslinjer
- Inkludera både formell utbildning och praktisk erfarenhet

Svara i JSON-format med följande struktur:
{
  "steps": [
    {
      "order": 1,
      "title": "Stegtitel",
      "description": "Beskrivning av steget",
      "timeframe": "Tidsram",
      "actions": ["Åtgärd 1", "Åtgärd 2"],
      "education": ["Utbildning 1", "Utbildning 2"]
    }
  ],
  "analysis": "Kort analys av övergången",
  "keySkills": ["Viktig färdighet 1", "Viktig färdighet 2"],
  "challenges": ["Utmaning 1", "Utmaning 2"]
}`,
        userPrompt: `Skapa en detaljerad karriärplan för följande övergång:

NUVARANDE YRKE: ${data?.currentOccupation}
ERFARENHET: ${data?.experienceYears} år
MÅLYRKE: ${data?.targetOccupation}
NUVARANDE LÖN: ${data?.currentSalary} kr/mån
MÅLLÖN: ${data?.targetSalary} kr/mån
EFTERFRÅGAN: ${data?.demand === 'high' ? 'Hög' : data?.demand === 'medium' ? 'Medel' : 'Låg'} (${data?.jobCount} lediga jobb)

Skapa 4-5 konkreta steg för karriärövergången. Var specifik om:
1. Vilka färdigheter som behövs för målyrket
2. Vilka av nuvarande färdigheter som är överförbara
3. Konkreta åtgärder för varje steg
4. Rekommenderad utbildning/kompetensutveckling
5. Realistisk tidsram

Svara ENDAST med JSON, inget annat.`,
        maxTokens: 2500
      };

    case 'chatbot':
      const historik = data?.historik || [];
      return {
        systemPrompt: `Du är Deltagarportalens AI-karriärcoach.
Du hjälper arbetssökande med allt från CV och ansökningar till motivation och strategi.
Var empatisk, konkret och uppmuntrande. Svara på svenska.

Du kan hjälpa med:
- CV-skrivning och optimering
- Personliga brev
- Intervjuförberedelser
- Löneförhandling
- LinkedIn-profiler
- Jobbsökningsstrategi
- Motivation och mentalt stöd

Håll svaren korta (max 3-4 meningar) om inte användaren ber om mer detaljer.`,
        userPrompt: historik.length > 0 
          ? `${historik.map((h: any) => `${h.roll}: ${h.innehall}`).join('\n')}\n\nanvändare: ${data?.meddelande}`
          : data?.meddelande || 'Hej!',
        maxTokens: 800
      };

    default:
      throw new Error(`Okänd funktion: ${fn}`);
  }
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportal.vercel.app',
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ] : [])
];

function getCorsOrigin(requestOrigin: string | undefined): string | null {
  if (!requestOrigin) return null;
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers - restrict to allowed origins only
  const origin = req.headers.origin;
  const allowedOrigin = getCorsOrigin(origin as string);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (!allowedOrigin) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting (Redis-based, serverless-compatible)
  const ip = (Array.isArray(req.headers['x-forwarded-for'])
    ? req.headers['x-forwarded-for'][0]
    : req.headers['x-forwarded-for']?.split(',')[0]) || req.socket.remoteAddress || 'unknown';

  const rateLimit = await checkRateLimit(ip.trim());

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  if (rateLimit.resetAt > 0) {
    res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toString());
  }

  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, rateLimit.resetAt - Math.floor(Date.now() / 1000));
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      error: 'För många förfrågningar. Försök igen om några minuter.',
      retryAfter
    });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to use AI features.' });
  }

  try {
    // Get function name from URL path (Vercel dynamic routing) or body
    const fn = req.query.function as string || req.body.function;
    const rawData = req.body.data || req.body;

    if (!fn) {
      return res.status(400).json({ error: 'Missing function parameter' });
    }

    // Validate input data
    const validation = validateInput(fn, rawData);
    if (!validation.success) {
      return res.status(400).json({ error: (validation as { success: false; error: string }).error });
    }
    const data = (validation as { success: true; data: unknown }).data;

    // Only log function name in production, no PII
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI] Function: ${fn}`);
    }

    const { systemPrompt, userPrompt, maxTokens } = buildPrompt(fn, data);

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: maxTokens });

    // Parse JSON response for karriarplan
    let responseData: any = content;
    if (fn === 'karriarplan') {
      try {
        responseData = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse karriarplan JSON:', e);
        // Return raw content if parsing fails
        responseData = { raw: content, steps: [] };
      }
    }

    return res.json({
      success: true,
      [fn === 'chatbot' ? 'svar' : fn === 'personligt-brev' ? 'brev' : fn === 'karriarplan' ? 'plan' : 'result']: responseData,
      function: fn,
      model: DEFAULT_MODEL
    });

  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Ett fel uppstod vid kommunikation med AI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
