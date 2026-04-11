const { createClient } = require('@supabase/supabase-js');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

// Supabase client for auth
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function verifyAuth(req) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase not configured');
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;
    return { userId: user.id };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

function stripPII(text) {
  if (!text) return text;
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/(?:\+46|0046|0)\s*(?:\d[\s-]*){8,10}/g, '[TELEFON]')
    .replace(/\b\d{6,8}[-\s]?\d{4}\b/g, '[PERSONNUMMER]');
}

function buildPrompt(fn, data) {
  if (fn === 'personligt-brev') {
    const ton = data?.ton || data?.tone || 'professionell';
    const tonText = ton === 'entusiastisk' ? 'entusiastisk och energisk'
                  : ton === 'formell' ? 'formell och traditionell'
                  : 'professionell och balanserad';

    let cvContext = '';
    if (data?.cvData) {
      const cv = data.cvData;
      cvContext = `
Titel: ${cv.title || 'Ej angiven'}
Sammanfattning: ${cv.summary || 'Ej angiven'}
Erfarenhet: ${cv.workExperience?.map(exp => `${exp.title} på ${exp.company}`).join(', ') || 'Ej angiven'}
Kompetenser: ${cv.skills?.map(s => s.name).join(', ') || 'Ej angivna'}`;
    }

    const jobbAnnons = data?.jobbAnnons || data?.jobDescription || '';

    return {
      systemPrompt: `Du är en expert på att skriva personliga brev för jobbansökningar på svenska.
Skriv med en ${tonText} ton. Brevet ska vara 250-350 ord.
Analysera jobbannonsen och koppla kandidatens erfarenheter till de specifika kraven.`,
      userPrompt: `Skriv ett personligt brev för:

FÖRETAG: ${data?.companyName || 'Ej angivet'}
JOBBTITEL: ${data?.jobTitle || 'Ej angiven'}

JOBBANNONS:
${jobbAnnons.substring(0, 3000)}

KANDIDATENS CV:${cvContext}
${data?.erfarenhet ? `\nTidigare erfarenhet: ${stripPII(data.erfarenhet)}` : ''}
${data?.motivering ? `\nMotivering: ${data.motivering}` : ''}

Skriv det personliga brevet nu:`,
      maxTokens: 1500
    };
  }

  // Default/chatbot
  return {
    systemPrompt: 'Du är en hjälpsam karriärcoach som svarar på svenska.',
    userPrompt: data?.meddelande || 'Hej!',
    maxTokens: 800
  };
}

module.exports = async function handler(req, res) {
  // CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://jobin.se',
    'https://www.jobin.se',
    'https://deltagarportalen.se',
    'https://deltagarportal.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const fn = req.query.function || req.body.function;
    const data = req.body.data || req.body;

    if (!fn) {
      return res.status(400).json({ error: 'Missing function parameter' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error('OPENROUTER_API_KEY not configured');
      return res.status(500).json({ error: 'AI not configured' });
    }

    const { systemPrompt, userPrompt, maxTokens } = buildPrompt(fn, data);

    console.log(`[AI] Calling OpenRouter for ${fn}`);

    const aiResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jobin.se',
        'X-Title': 'Jobin'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenRouter error:', aiResponse.status, errorText);
      return res.status(502).json({ error: 'AI request failed' });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'No response from AI' });
    }

    console.log(`[AI] Success for ${fn}`);

    // Return response based on function type
    const responseKey = fn === 'personligt-brev' ? 'brev'
                      : fn === 'chatbot' ? 'svar'
                      : 'result';

    return res.status(200).json({
      success: true,
      [responseKey]: content,
      function: fn,
      model: aiData.model || DEFAULT_MODEL
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
