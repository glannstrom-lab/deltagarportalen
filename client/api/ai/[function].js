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
  switch (fn) {
    case 'cv-optimering':
      return {
        systemPrompt: 'Du är en expert på CV-skrivning för arbetssökande. Ge konstruktiv feedback på svenska. Fokusera på styrkor, inte svagheter. Var uppmuntrande och konkret.',
        userPrompt: `Ge feedback på detta CV för yrket "${data?.yrke || 'ospecificerat'}":\n\n${stripPII(data?.cvText || '')}\n\nGe följande:\n1. ÖVERGRIPANDE BEDÖMNING - positiv sammanfattning\n2. FÖRBÄTTRINGSFÖRSLAG - 3-5 konkreta förslag\n3. SAKNAD INFORMATION - vad bör läggas till?\n4. REFLEKTIONSFRÅGOR - 2-3 frågor att tänka på`,
        maxTokens: 1500
      };

    case 'generera-cv-text':
      return {
        systemPrompt: 'Du är en CV-expert. Skriv professionella CV-texter på svenska. Fokusera på resultat och prestationer.',
        userPrompt: `Skriv en professionell CV-sammanfattning (3-4 meningar) för:\n\nYrke: ${data?.yrke}\nTidigare erfarenhet: ${data?.erfarenhet || 'Varierad arbetslivserfarenhet'}\nUtbildning: ${data?.utbildning || 'Ej specificerad'}\nStyrkor: ${data?.styrkor || 'Pålitlig, arbetsvillig, positiv'}\n\nTexten ska vara professionell men personlig, lyfta fram erfarenheter och nämna 2-3 styrkor.`,
        maxTokens: 500
      };

    case 'personligt-brev': {
      const ton = data?.ton || data?.tone || 'professionell';
      const tonText = ton === 'entusiastisk' ? 'entusiastisk och energisk' : ton === 'formell' ? 'formell och traditionell' : 'professionell och balanserad';
      let cvContext = '';
      if (data?.cvData) {
        const cv = data.cvData;
        cvContext = `\nTitel: ${cv.title || 'Ej angiven'}\nSammanfattning: ${cv.summary || 'Ej angiven'}\nErfarenhet: ${cv.workExperience?.map(exp => exp.title + ' på ' + exp.company).join(', ') || 'Ej angiven'}\nKompetenser: ${cv.skills?.map(s => s.name).join(', ') || 'Ej angivna'}`;
      }
      const jobbAnnons = data?.jobbAnnons || data?.jobDescription || '';
      return {
        systemPrompt: `Du är en expert på personliga brev för jobbansökningar på svenska. Skriv med en ${tonText} ton. Brevet ska vara 250-350 ord. Analysera jobbannonsen och koppla kandidatens erfarenheter till kraven.`,
        userPrompt: `Skriv ett personligt brev för:\n\nFÖRETAG: ${data?.companyName || 'Ej angivet'}\nJOBBTITEL: ${data?.jobTitle || 'Ej angiven'}\n\nJOBBANNONS:\n${jobbAnnons.substring(0, 3000)}\n\nKANDIDATENS CV:${cvContext}${data?.erfarenhet ? '\nTidigare erfarenhet: ' + stripPII(data.erfarenhet) : ''}${data?.motivering ? '\nMotivering: ' + data.motivering : ''}${data?.extraKeywords ? '\nNyckelord: ' + data.extraKeywords : ''}\n\nSkriv det personliga brevet nu:`,
        maxTokens: 1500
      };
    }

    case 'intervju-forberedelser':
      return {
        systemPrompt: 'Du är en erfaren jobbcoach som hjälper personer förbereda sig för anställningsintervjuer. Ge konkreta, praktiska råd på svenska.',
        userPrompt: `Hjälp mig förbereda mig för en intervju som ${data?.jobbTitel || 'kandidat'}${data?.foretag ? ' på ' + data.foretag : ''}.\n\nMin bakgrund: ${data?.erfarenhet || 'Varierad erfarenhet'}\nMina styrkor: ${data?.egenskaper || 'Pålitlig, samarbetsvillig, positiv'}\n\nGe följande:\n1. TROLIGA INTERVJUFRÅGOR - 5 vanliga frågor\n2. FÖRBEREDDA SVAR - förslag på svar med STAR-metoden\n3. FRÅGOR ATT STÄLLA - 3 frågor till arbetsgivaren\n4. TIPS FÖR INTERVJUN - 3-4 konkreta tips`,
        maxTokens: 2000
      };

    case 'jobbtips':
      return {
        systemPrompt: 'Du är en empatisk jobbcoach som hjälper personer hitta tillbaka till arbetsmarknaden. Ge konkreta, uppmuntrande råd på svenska.',
        userPrompt: `Ge personliga jobbsökartips baserat på:\n\nIntressen: ${data?.intressen || 'Ej angivet'}\nTidigare erfarenhet: ${data?.tidigareErfarenhet || 'Ej angivet'}\nEventuella hinder: ${data?.hinder || 'Ej angivet'}\nMål: ${data?.mal || 'Hitta ett meningsfullt arbete'}\n\nGe:\n1. UPPMUNTRAN - positiv kommentar om bakgrunden\n2. NÄSTA STEG - 3 konkreta, genomförbara åtgärder\n3. YRKEN ATT UTFORSKA - 3-5 förslag\n4. BEMÖTA HINDER - praktiska råd`,
        maxTokens: 1200
      };

    case 'loneforhandling':
      return {
        systemPrompt: 'Du är en erfaren löneexpert och förhandlare. Ge konkreta råd om lönenivåer och förhandlingsteknik på svenska.',
        userPrompt: `Hjälp mig förbereda en löneförhandling:\n\nRoll: ${data?.roll}\nErfarenhet: ${data?.erfarenhetAr || 0} år\n${data?.nuvarandeLon ? 'Nuvarande lön: ' + data.nuvarandeLon + ' kr/mån' : 'Nuvarande lön: Ej anställd'}\nFöretagsstorlek: ${data?.foretagsStorlek || 'Medelstort'}\nOrt: ${data?.ort || 'Stockholm'}\n\nGe:\n1. LÖNESPANN - vad är rimligt?\n2. FÖRBEREDELSE - hur förbereder jag mig?\n3. ARGUMENT - vilka argument kan jag använda?\n4. FÖRMÅNER - andra saker att förhandla om\n5. DIALOG - exempel på hur samtalet kan gå`,
        maxTokens: 1500
      };

    case 'karriarplan':
      return {
        systemPrompt: 'Du är karriärutvecklingsexpert. Skapa realistiska karriärplaner. Svara i JSON-format: {"steps":[{"order":1,"title":"","description":"","timeframe":"","actions":[],"education":[]}],"analysis":"","keySkills":[],"challenges":[]}',
        userPrompt: `Skapa en karriärplan för:\n\nNuvarande yrke: ${data?.currentOccupation}\nErfarenhet: ${data?.experienceYears} år\nMålyrke: ${data?.targetOccupation}\nNuvarande lön: ${data?.currentSalary} kr/mån\nMållön: ${data?.targetSalary} kr/mån\nEfterfrågan: ${data?.demand === 'high' ? 'Hög' : data?.demand === 'medium' ? 'Medel' : 'Låg'}\n\nSkapa 4-5 konkreta steg. Svara ENDAST med JSON.`,
        maxTokens: 2500
      };

    case 'kompetensgap':
      return {
        systemPrompt: 'Du är karriärcoach specialiserad på kompetensanalys. Analysera gap mellan nuvarande och önskade kompetenser på svenska.',
        userPrompt: `Analysera kompetensgap:\n\nNuvarande CV:\n${stripPII(data?.cvText || '')}\n\nDrömjobb: ${data?.dromjobb || data?.drömjobb || 'Ej angivet'}\n\nGe:\n1. MATCHANDE KOMPETENSER - vad passar redan?\n2. KOMPETENSGAP - vad saknas?\n3. UTBILDNINGSFÖRSLAG - rekommenderade kurser/utbildningar\n4. PRAKTISKA STEG - hur kan gapet stängas?`,
        maxTokens: 1500
      };

    case 'linkedin-optimering': {
      const typ = data?.typ || 'headline';
      const prompts = {
        headline: `Skriv 3 professionella LinkedIn-rubriker för: ${JSON.stringify(data?.data)}`,
        about: `Skriv en engagerande LinkedIn "Om mig"-sektion för: ${JSON.stringify(data?.data)}`,
        post: `Skriv ett professionellt LinkedIn-inlägg om: ${JSON.stringify(data?.data)}`,
        connection: `Skriv ett personligt kontaktförfrågan-meddelande för: ${JSON.stringify(data?.data)}`
      };
      return {
        systemPrompt: 'Du är LinkedIn-expert. Skriv professionellt och engagerande på svenska.',
        userPrompt: prompts[typ] || prompts.headline,
        maxTokens: 800
      };
    }

    case 'intervju-simulator':
      return {
        systemPrompt: 'Du är en erfaren rekryterare som genomför intervjuer. Ställ realistiska frågor och ge konstruktiv feedback på svenska.',
        userPrompt: `Intervju för rollen ${data?.roll}${data?.foretag ? ' på ' + data.foretag : ''}.\n${data?.anvandarSvar ? 'Kandidatens svar: ' + data.anvandarSvar + '\n\nGe kort feedback och ställ nästa fråga.' : 'Börja intervjun med en klassisk öppningsfråga.'}${data?.tidigareFragor?.length ? '\nTidigare frågor: ' + JSON.stringify(data.tidigareFragor) : ''}`,
        maxTokens: 1000
      };

    case 'mentalt-stod':
      return {
        systemPrompt: 'Du är en stödjande och empatisk coach. Ge uppmuntran och praktiska tips för att hantera jobbsökning på svenska. Var varm och förstående.',
        userPrompt: `Situation: ${data?.situation || 'Jobbsökning'}\nKänsla: ${data?.kansla || 'Osäker'}\n\nGe emotionellt stöd och konkreta tips för att hantera situationen.`,
        maxTokens: 800
      };

    case 'natverkande': {
      const typ = data?.typ || 'kontakt';
      const typText = typ === 'kontakt' ? 'första kontaktmeddelande' : typ === 'foljupp' ? 'uppföljningsmeddelande' : typ === 'tack' ? 'tackmeddelande' : 'informational interview-förfrågan';
      return {
        systemPrompt: 'Du är expert på professionellt nätverkande. Skriv personliga, professionella meddelanden på svenska.',
        userPrompt: `Skriv ett ${typText}:\n\n${JSON.stringify(data?.data || data)}`,
        maxTokens: 600
      };
    }

    case 'ansokningscoach':
      return {
        systemPrompt: 'Du är ansökningscoach. Ge konkret, konstruktiv feedback på ansökningstexter på svenska.',
        userPrompt: `${data?.typ === 'feedback' ? 'Ge feedback på' : data?.typ === 'forbattra' ? 'Förbättra' : 'Kontrollera'} denna text:\n\n${data?.text}\n\nJobbannons: ${data?.jobbannons || 'Ej angiven'}`,
        maxTokens: 1000
      };

    case 'chatbot': {
      const historik = data?.historik || [];
      return {
        systemPrompt: 'Du är Jobins AI-karriärcoach. Hjälp arbetssökande med CV, ansökningar, intervjuer, motivation och strategi. Var empatisk, konkret och uppmuntrande. Svara kortfattat på svenska (max 3-4 meningar om inte mer detaljer efterfrågas).',
        userPrompt: historik.length > 0 ? historik.map(h => h.roll + ': ' + h.innehall).join('\n') + '\n\nAnvändare: ' + (data?.meddelande || 'Hej!') : (data?.meddelande || 'Hej!'),
        maxTokens: 800
      };
    }

    default:
      return {
        systemPrompt: 'Du är en hjälpsam karriärcoach som svarar på svenska.',
        userPrompt: JSON.stringify(data) || 'Hej!',
        maxTokens: 800
      };
  }
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
    // Extract function name from Vercel dynamic route [function].js
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
    let content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: 'No response from AI' });
    }

    console.log(`[AI] Success for ${fn}`);

    // Parse JSON for karriarplan
    if (fn === 'karriarplan') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse karriarplan JSON:', e);
        content = { raw: content, steps: [] };
      }
    }

    // Return response based on function type
    const responseKey = fn === 'personligt-brev' ? 'brev'
                      : fn === 'chatbot' ? 'svar'
                      : fn === 'karriarplan' ? 'plan'
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
