/**
 * AI Streaming Endpoint
 * Uses Server-Sent Events (SSE) for real-time streaming responses
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================
// SECURITY: Input Sanitization (paritet med ai.js + edge functions)
// ============================================

function sanitizeInput(input, maxLength = 5000) {
  if (input == null) return '';
  return String(input)
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim();
}

function sanitizeAll(obj, depth = 0) {
  if (depth > 10) return obj;
  if (obj == null) return obj;
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map((v) => sanitizeAll(v, depth + 1));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeAll(v, depth + 1);
    }
    return out;
  }
  return obj;
}

// ============================================
// Rate Limiting Configuration
// ============================================

const RATE_LIMITS = {
  'personligt-brev': { limit: 10, windowMinutes: 15 },
  'cv-optimering': { limit: 15, windowMinutes: 15 },
  'karriarplan': { limit: 5, windowMinutes: 15 },
  'kompetensgap': { limit: 10, windowMinutes: 15 },
  'default': { limit: 20, windowMinutes: 15 }
};

async function checkRateLimit(supabase, userId, functionName) {
  const config = RATE_LIMITS[functionName] || RATE_LIMITS.default;

  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: `ai-stream-${functionName}`,
      p_max_requests: config.limit,
      p_window_minutes: config.windowMinutes
    });

    if (error) {
      console.error('[RateLimit] Supabase error:', error.message);
      return { allowed: true, remaining: config.limit, resetIn: 0 };
    }

    if (data && data.length > 0) {
      const result = data[0];
      const resetIn = result.reset_at
        ? Math.max(0, new Date(result.reset_at).getTime() - Date.now())
        : config.windowMinutes * 60 * 1000;

      return {
        allowed: result.allowed,
        remaining: result.remaining || 0,
        resetIn
      };
    }

    return { allowed: true, remaining: config.limit, resetIn: 0 };
  } catch (err) {
    console.error('[RateLimit] Error:', err.message);
    return { allowed: true, remaining: config.limit, resetIn: 0 };
  }
}

// ============================================
// Security: Allowed origins for CORS
// ============================================
const ALLOWED_ORIGINS = [
  // Production domains
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportalen.vercel.app',
  'https://deltagarportal.vercel.app',
  // Legacy domains
  'https://jobin.se',
  'https://www.jobin.se',
  // Environment-specific frontend URL
  process.env.FRONTEND_URL,
  // Allow localhost in development only
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ] : []),
].filter(Boolean);

/**
 * Check if origin matches Vercel preview URL pattern
 */
function isVercelPreviewUrl(origin) {
  if (!origin) return false;
  return /^https:\/\/deltagarportal(en)?-[a-z0-9]+-[\w-]+\.vercel\.app$/.test(origin);
}

/**
 * Get CORS headers with origin validation
 */
function getCorsHeaders(requestOrigin) {
  const isAllowed = ALLOWED_ORIGINS.includes(requestOrigin) || isVercelPreviewUrl(requestOrigin);
  const origin = isAllowed ? requestOrigin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const PROMPTS = {
  'personligt-brev': (data) => {
    const ton = data.ton || data.tone || 'professionell';
    const tonText = ton === 'entusiastisk' ? 'entusiastisk och energisk'
                  : ton === 'formell' ? 'formell och traditionell'
                  : 'professionell och balanserad';
    let cvContext = '';
    if (data.cvData) {
      const cv = data.cvData;
      cvContext = `\nTitel: ${cv.title || 'Ej angiven'}`;
      cvContext += `\nSammanfattning: ${cv.summary || 'Ej angiven'}`;
      if (cv.workExperience?.length) cvContext += `\nErfarenhet: ${cv.workExperience.map(e => e.title + ' på ' + e.company).join(', ')}`;
      if (cv.skills?.length) cvContext += `\nKompetenser: ${cv.skills.map(s => s.name).join(', ')}`;
    }
    const jobbAnnons = data.jobbAnnons || data.jobDescription || '';
    return {
      system: `Du är en expert på personliga brev för jobbansökningar på svenska. Skriv med en ${tonText} ton. Brevet ska vara 250-350 ord.`,
      user: `Skriv ett personligt brev för:\n\nFÖRETAG: ${data.companyName || 'Ej angivet'}\nJOBBTITEL: ${data.jobTitle || 'Ej angiven'}\n\nJOBBANNONS:\n${jobbAnnons.substring(0, 3000)}\n\nKANDIDATENS CV:${cvContext}\n${data.erfarenhet ? 'Erfarenhet: ' + data.erfarenhet : ''}\n${data.motivering ? 'Motivering: ' + data.motivering : ''}\n${data.extraKeywords ? 'Nyckelord: ' + data.extraKeywords : ''}\n\nSkriv brevet:`,
      maxTokens: 1500
    };
  },
  'cv-optimering': (data) => ({
    system: 'Du är en expert på CV-skrivning. Ge konstruktiv feedback på svenska.',
    user: `Ge feedback på detta CV för yrket "${data?.yrke || 'ospecificerat'}":\n\n${data?.cvText || ''}\n\nGe: 1. BEDÖMNING 2. FÖRBÄTTRINGSFÖRSLAG 3. SAKNAD INFO 4. REFLEKTIONSFRÅGOR`,
    maxTokens: 1500
  }),
  'generera-cv-text': (data) => ({
    system: 'Du är en CV-expert. Skriv professionella CV-texter på svenska.',
    user: `Skriv en CV-sammanfattning (3-4 meningar) för:\nYrke: ${data?.yrke}\nErfarenhet: ${data?.erfarenhet || 'Varierad'}\nUtbildning: ${data?.utbildning || 'Ej specificerad'}\nStyrkor: ${data?.styrkor || 'Pålitlig, positiv'}`,
    maxTokens: 500
  }),
  'intervju-forberedelser': (data) => ({
    system: 'Du är en erfaren jobbcoach. Ge konkreta råd på svenska.',
    user: `Hjälp mig förbereda för intervju som ${data?.jobbTitel || 'kandidat'}${data?.foretag ? ' på ' + data.foretag : ''}.\nBakgrund: ${data?.erfarenhet || 'Varierad'}\nStyrkor: ${data?.egenskaper || 'Pålitlig'}\n\nGe: 1. 5 INTERVJUFRÅGOR 2. SVAR MED STAR-METODEN 3. FRÅGOR ATT STÄLLA 4. TIPS`,
    maxTokens: 2000
  }),
  'jobbtips': (data) => ({
    system: 'Du är en empatisk jobbcoach. Ge uppmuntrande råd på svenska.',
    user: `Ge jobbsökartips:\nIntressen: ${data?.intressen || 'Ej angivet'}\nErfarenhet: ${data?.tidigareErfarenhet || 'Ej angivet'}\nHinder: ${data?.hinder || 'Ej angivet'}\nMål: ${data?.mal || 'Hitta arbete'}\n\nGe: 1. UPPMUNTRAN 2. NÄSTA STEG 3. YRKEN 4. BEMÖTA HINDER`,
    maxTokens: 1200
  }),
  'loneforhandling': (data) => ({
    system: 'Du är en löneexpert. Ge konkreta råd på svenska.',
    user: `Löneförhandling:\nRoll: ${data?.roll}\nErfarenhet: ${data?.erfarenhetAr || 0} år\nLön: ${data?.nuvarandeLon ? data.nuvarandeLon + ' kr/mån' : 'Ej anställd'}\nOrt: ${data?.ort || 'Stockholm'}\n\nGe: 1. LÖNESPANN 2. FÖRBEREDELSE 3. ARGUMENT 4. FÖRMÅNER 5. DIALOG`,
    maxTokens: 1500
  }),
  'karriarplan': (data) => ({
    system: 'Du är karriärexpert. Skapa en detaljerad karriärplan.',
    user: `Karriärplan:\nNuvarande: ${data?.currentOccupation || data?.nuvarande}\nMål: ${data?.targetOccupation || data?.mal}\nErfarenhet: ${data?.experienceYears || 'Varierad'} år\nTidsram: ${data?.tidsram || 'Flexibel'}\nHinder: ${data?.hinder || 'Inga specifika'}\n\nSkapa 4-5 konkreta steg med handlingsplan.`,
    maxTokens: 2500
  }),
  'kompetensgap': (data) => ({
    system: 'Du är karriärcoach som analyserar kompetensgap.',
    user: `Analysera kompetensgap:\n\nCV:\n${data?.cvText || ''}\n\nDrömjobb: ${data?.dromjobb || data?.drömjobb || 'Ej angivet'}\n\nAnalysera:\n1. Matchande kompetenser\n2. Saknade kompetenser\n3. Rekommendationer för utveckling\n4. Tidsuppskattning`,
    maxTokens: 1500
  }),
  'linkedin-optimering': (data) => {
    const typ = data?.typ || 'headline';
    const prompts = {
      headline: `Skriv 3 LinkedIn-rubriker för: ${JSON.stringify(data?.data)}`,
      about: `Skriv LinkedIn "Om mig" för: ${JSON.stringify(data?.data)}`,
      post: `Skriv LinkedIn-inlägg om: ${JSON.stringify(data?.data)}`,
      connection: `Skriv kontaktförfrågan för: ${JSON.stringify(data?.data)}`
    };
    return { system: 'Du är LinkedIn-expert. Skriv på svenska.', user: prompts[typ] || prompts.headline, maxTokens: 800 };
  },
  'mentalt-stod': (data) => ({
    system: 'Du är en empatisk coach. Ge stöd på svenska.',
    user: `Situation: ${data?.situation || 'Jobbsökning'}\nKänsla: ${data?.kansla || 'Osäker'}\n\nGe emotionellt stöd och tips.`,
    maxTokens: 800
  }),
  'natverkande': (data) => {
    const typ = data?.typ || 'kontakt';
    const typText = typ === 'kontakt' ? 'kontaktmeddelande' : typ === 'foljupp' ? 'uppföljning' : typ === 'tack' ? 'tackmeddelande' : 'informational interview';
    return { system: 'Du är nätverksexpert. Skriv på svenska.', user: `Skriv ${typText}:\n${JSON.stringify(data?.data || data)}`, maxTokens: 600 };
  },
  'ansokningscoach': (data) => ({
    system: 'Du är ansökningscoach. Ge feedback på svenska.',
    user: `${data?.typ === 'feedback' ? 'Feedback på' : data?.typ === 'forbattra' ? 'Förbättra' : 'Kontrollera'}:\n${data?.text}\n\nJobbannons: ${data?.jobbannons || 'Ej angiven'}`,
    maxTokens: 1000
  }),
  'chatbot': (data) => {
    const historik = data?.historik || [];
    return {
      system: 'Du är Jobins AI-karriärcoach. Var empatisk och konkret. Svara kortfattat på svenska.',
      user: historik.length > 0 ? historik.map(h => h.roll + ': ' + h.innehall).join('\n') + '\n\nAnvändare: ' + (data?.meddelande || 'Hej!') : (data?.meddelande || 'Hej!'),
      maxTokens: 800
    };
  }
};

module.exports = async (req, res) => {
  const requestOrigin = req.headers.origin;
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify auth token
    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const fn = req.body.function;
    // SECURITY: sanera all användardata innan den når PROMPTS-templates
    const data = sanitizeAll(req.body.data || req.body);

    // Check rate limit before processing
    const rateLimit = await checkRateLimit(supabase, user.id, fn);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil(rateLimit.resetIn / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'För många förfrågningar. Vänta en stund och försök igen.',
        retryAfter
      });
    }

    if (!fn || !PROMPTS[fn]) return res.status(400).json({ error: 'Invalid function: ' + fn });

    const prompt = PROMPTS[fn](data);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Make streaming request to OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jobin.se',
        'X-Title': 'Jobin'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        max_tokens: prompt.maxTokens,
        temperature: 0.7,
        stream: true
      })
    });

    if (!aiResponse.ok) {
      res.write(`data: ${JSON.stringify({ error: 'AI request failed' })}\n\n`);
      return res.end();
    }

    // Stream the response
    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
    res.end();
  }
};
