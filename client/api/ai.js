const { createClient } = require('@supabase/supabase-js');

// Security: Allowed origins for CORS
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
  // Match Vercel preview URLs: deltagarportalen-<hash>-<username>.vercel.app
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
      maxTokens: 1500,
      responseKey: 'brev'
    };
  },
  'cv-optimering': (data) => ({
    system: 'Du är en expert på CV-skrivning. Ge konstruktiv feedback på svenska.',
    user: `Ge feedback på detta CV för yrket "${data?.yrke || 'ospecificerat'}":\n\n${data?.cvText || ''}\n\nGe: 1. BEDÖMNING 2. FÖRBÄTTRINGSFÖRSLAG 3. SAKNAD INFO 4. REFLEKTIONSFRÅGOR`,
    maxTokens: 1500,
    responseKey: 'result'
  }),
  'generera-cv-text': (data) => ({
    system: 'Du är en CV-expert. Skriv professionella CV-texter på svenska.',
    user: `Skriv en CV-sammanfattning (3-4 meningar) för:\nYrke: ${data?.yrke}\nErfarenhet: ${data?.erfarenhet || 'Varierad'}\nUtbildning: ${data?.utbildning || 'Ej specificerad'}\nStyrkor: ${data?.styrkor || 'Pålitlig, positiv'}`,
    maxTokens: 500,
    responseKey: 'result'
  }),
  'intervju-forberedelser': (data) => ({
    system: 'Du är en erfaren jobbcoach. Ge konkreta råd på svenska.',
    user: `Hjälp mig förbereda för intervju som ${data?.jobbTitel || 'kandidat'}${data?.foretag ? ' på ' + data.foretag : ''}.\nBakgrund: ${data?.erfarenhet || 'Varierad'}\nStyrkor: ${data?.egenskaper || 'Pålitlig'}\n\nGe: 1. 5 INTERVJUFRÅGOR 2. SVAR MED STAR-METODEN 3. FRÅGOR ATT STÄLLA 4. TIPS`,
    maxTokens: 2000,
    responseKey: 'result'
  }),
  'jobbtips': (data) => ({
    system: 'Du är en empatisk jobbcoach. Ge uppmuntrande råd på svenska.',
    user: `Ge jobbsökartips:\nIntressen: ${data?.intressen || 'Ej angivet'}\nErfarenhet: ${data?.tidigareErfarenhet || 'Ej angivet'}\nHinder: ${data?.hinder || 'Ej angivet'}\nMål: ${data?.mal || 'Hitta arbete'}\n\nGe: 1. UPPMUNTRAN 2. NÄSTA STEG 3. YRKEN 4. BEMÖTA HINDER`,
    maxTokens: 1200,
    responseKey: 'result'
  }),
  'loneforhandling': (data) => ({
    system: 'Du är en löneexpert. Ge konkreta råd på svenska.',
    user: `Löneförhandling:\nRoll: ${data?.roll}\nErfarenhet: ${data?.erfarenhetAr || 0} år\nLön: ${data?.nuvarandeLon ? data.nuvarandeLon + ' kr/mån' : 'Ej anställd'}\nOrt: ${data?.ort || 'Stockholm'}\n\nGe: 1. LÖNESPANN 2. FÖRBEREDELSE 3. ARGUMENT 4. FÖRMÅNER 5. DIALOG`,
    maxTokens: 1500,
    responseKey: 'result'
  }),
  'karriarplan': (data) => ({
    system: 'Du är karriärexpert. Svara i JSON: {"steps":[{"order":1,"title":"","description":"","timeframe":"","actions":[]}],"analysis":"","keySkills":[]}',
    user: `Karriärplan:\nNuvarande: ${data?.currentOccupation}\nMål: ${data?.targetOccupation}\nErfarenhet: ${data?.experienceYears} år\n\nSkapa 4-5 steg. Svara ENDAST JSON.`,
    maxTokens: 2500,
    responseKey: 'plan',
    parseJson: true
  }),
  'kompetensgap': (data) => ({
    system: `Du är karriärcoach. Svara ENDAST med JSON i detta format:
{"matchingScore":75,"skills":[{"name":"Kompetens","current":60,"required":80,"category":"teknisk","level":"intermediate","resources":["Resurs 1"]}],"gapSkills":["Saknad kompetens 1"],"recommendations":["Rekommendation 1"],"totalGaps":3,"timelineWeeks":8}
Kategorier: teknisk, ledarskap, dom, annan. Nivåer: beginnare, intermediate, expert.`,
    user: `Analysera kompetensgap:\n\nCV:\n${data?.cvText || ''}\n\nDrömjobb: ${data?.dromjobb || data?.drömjobb || 'Ej angivet'}\n\nSvara ENDAST med JSON.`,
    maxTokens: 1500,
    responseKey: 'analys',
    parseJson: true
  }),
  'linkedin-optimering': (data) => {
    const typ = data?.typ || 'headline';
    const prompts = {
      headline: `Skriv 3 LinkedIn-rubriker för: ${JSON.stringify(data?.data)}`,
      about: `Skriv LinkedIn "Om mig" för: ${JSON.stringify(data?.data)}`,
      post: `Skriv LinkedIn-inlägg om: ${JSON.stringify(data?.data)}`,
      connection: `Skriv kontaktförfrågan för: ${JSON.stringify(data?.data)}`
    };
    return { system: 'Du är LinkedIn-expert. Skriv på svenska.', user: prompts[typ] || prompts.headline, maxTokens: 800, responseKey: 'text' };
  },
  'intervju-simulator': (data) => {
    if (data?.anvandarSvar) {
      // Användaren har svarat - ge feedback och nästa fråga
      return {
        system: `Du är rekryterare. Svara ENDAST med JSON: {"rating":1-5,"feedback":"kort feedback","nastaFraga":"nästa intervjufråga"}`,
        user: `Intervju för ${data?.roll}${data?.foretag ? ' på ' + data.foretag : ''}.\n\nFråga: ${data?.tidigareFragor?.[data.tidigareFragor.length-1]?.fraga || 'Berätta om dig själv'}\nKandidatens svar: ${data.anvandarSvar}\n\nBedöm svaret 1-5, ge kort feedback, och ställ nästa relevanta intervjufråga. Svara ENDAST med JSON.`,
        maxTokens: 500,
        responseKey: 'resultat',
        parseJson: true
      }
    } else {
      // Starta intervju - bara ställ första frågan
      return {
        system: 'Du är rekryterare som intervjuar kandidater på svenska.',
        user: `Starta en intervju för rollen ${data?.roll}${data?.foretag ? ' på ' + data.foretag : ''}. Ställ en bra öppningsfråga. Svara ENDAST med frågan, inget annat.`,
        maxTokens: 200,
        responseKey: 'resultat'
      }
    }
  },
  'mentalt-stod': (data) => ({
    system: 'Du är en empatisk coach. Ge stöd på svenska.',
    user: `Situation: ${data?.situation || 'Jobbsökning'}\nKänsla: ${data?.kansla || 'Osäker'}\n\nGe emotionellt stöd och tips.`,
    maxTokens: 800,
    responseKey: 'result'
  }),
  'natverkande': (data) => {
    const typ = data?.typ || 'kontakt';
    const typText = typ === 'kontakt' ? 'kontaktmeddelande' : typ === 'foljupp' ? 'uppföljning' : typ === 'tack' ? 'tackmeddelande' : 'informational interview';
    return { system: 'Du är nätverksexpert. Skriv på svenska.', user: `Skriv ${typText}:\n${JSON.stringify(data?.data || data)}`, maxTokens: 600, responseKey: 'result' };
  },
  'ansokningscoach': (data) => ({
    system: 'Du är ansökningscoach. Ge feedback på svenska.',
    user: `${data?.typ === 'feedback' ? 'Feedback på' : data?.typ === 'forbattra' ? 'Förbättra' : 'Kontrollera'}:\n${data?.text}\n\nJobbannons: ${data?.jobbannons || 'Ej angiven'}`,
    maxTokens: 1000,
    responseKey: 'result'
  }),
  'ovningshjalp': (data) => ({
    system: 'Du är en stödjande coach som hjälper användare med självreflektion och övningar på svenska.',
    user: `Hjälp användaren med denna övning:\nÖvning: ${data?.ovningId || 'Självreflektion'}\nSteg: ${data?.steg || '1'}\nFråga: ${data?.fraga || ''}\n${data?.anvandarSvar ? 'Användarens svar: ' + data.anvandarSvar + '\n\nGe feedback och vägledning.' : 'Ge vägledning för att besvara frågan.'}`,
    maxTokens: 800,
    responseKey: 'result'
  }),
  'profile-summary': (data) => {
    // Build experience text
    let experienceText = '';
    if (data?.experience?.length) {
      experienceText = data.experience.map(e => `${e.title} på ${e.company}${e.description ? ': ' + e.description : ''}`).join('\n');
    }

    // Build education text
    let educationText = '';
    if (data?.education?.length) {
      educationText = data.education.map(e => `${e.degree} från ${e.school}`).join('\n');
    }

    // Build skills text
    let skillsText = '';
    if (data?.skills?.length) {
      skillsText = data.skills.map(s => s.name + (s.level ? ` (nivå ${s.level}/5)` : '')).join(', ');
    }

    return {
      system: `Du är en expert på att skriva professionella profilsammanfattningar på svenska. Skriv en engagerande och professionell sammanfattning (3-5 meningar) som lyfter fram personens styrkor, erfarenhet och mål. Använd ett varmt men professionellt tonläge som passar en jobbsökande.`,
      user: `Skriv en professionell profilsammanfattning för denna person:

NAMN: ${data?.name || 'Ej angivet'}
TITEL: ${data?.title || 'Ej angiven'}
ORT: ${data?.location || 'Ej angiven'}

ERFARENHET:
${experienceText || 'Ej angiven'}

UTBILDNING:
${educationText || 'Ej angiven'}

KOMPETENSER:
${skillsText || 'Ej angivna'}

ÖNSKADE JOBB: ${data?.desiredJobs?.join(', ') || 'Ej angivet'}
INTRESSEN: ${data?.interests?.join(', ') || 'Ej angivna'}

Skriv en sammanfattning på 3-5 meningar som passar i en jobbsökarprofil:`,
      maxTokens: 500,
      responseKey: 'summary'
    };
  },
  'chatbot': (data) => {
    const historik = data?.historik || [];
    return {
      system: 'Du är Jobins AI-karriärcoach. Var empatisk och konkret. Svara kortfattat på svenska.',
      user: historik.length > 0 ? historik.map(h => h.roll + ': ' + h.innehall).join('\n') + '\n\nAnvändare: ' + (data?.meddelande || 'Hej!') : (data?.meddelande || 'Hej!'),
      maxTokens: 800,
      responseKey: 'svar'
    };
  },
  'ai-team-chat': (data) => {
    const historik = data?.historik || [];
    const agentTyp = data?.agentTyp || 'arbetskonsulent';
    const systemKontext = data?.systemKontext || 'Du är en hjälpsam AI-assistent för jobbsökande.';
    const responsLage = data?.responsLage || 'medium';

    // Build conversation history
    let conversation = '';
    if (historik.length > 0) {
      conversation = historik.map(h => `${h.roll === 'användare' ? 'Användare' : 'Assistent'}: ${h.innehall}`).join('\n\n') + '\n\n';
    }

    // Response length instructions based on mode
    const responsLengthInstructions = {
      short: '- Svara MYCKET KORTFATTAT (max 2-3 meningar)\n- Ge endast det viktigaste\n- Inga långa förklaringar',
      medium: '- Svara KORTFATTAT (max 3-4 meningar för enkla frågor, max 6-8 för komplexa)\n- Balanserad detalj och korthet',
      detailed: '- Ge UTFÖRLIGA svar med förklaringar\n- Inkludera exempel och bakgrund\n- Förklara resonemang steg för steg'
    };

    const lengthInstruction = responsLengthInstructions[responsLage] || responsLengthInstructions.medium;
    const maxTokensForMode = responsLage === 'short' ? 400 : responsLage === 'detailed' ? 1500 : 900;

    return {
      system: `${systemKontext}\n\nVIKTIGT - Svarsformat:\n${lengthInstruction}\n- Använd punktlistor med TYDLIGA RUBRIKER i fetstil\n- Lägg till EN BLANK RAD mellan varje punkt för läsbarhet\n- Formatera så här:\n\n**Rubrik 1**\nKort förklaring här.\n\n**Rubrik 2**\nKort förklaring här.\n\n- Gå rakt på sak - skippa inledande fraser\n- Svara på svenska\n- Var konkret och handlingsinriktad`,
      user: conversation + 'Användare: ' + (data?.meddelande || 'Hej!'),
      maxTokens: maxTokensForMode,
      responseKey: 'svar'
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
    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const fn = req.body.function;
    const data = req.body.data || req.body;
    const stream = req.body.stream === true;

    if (!fn || !PROMPTS[fn]) return res.status(400).json({ error: 'Invalid function: ' + fn });

    const prompt = PROMPTS[fn](data);

    // Streaming mode for ai-team-chat
    if (stream && fn === 'ai-team-chat') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

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
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                continue;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  fullResponse += token;
                  res.write(`data: ${JSON.stringify({ token })}\n\n`);
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
      }

      // Generate follow-up suggestions
      try {
        const suggestionsResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://jobin.se',
            'X-Title': 'Jobin'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3-haiku-20240307',
            messages: [
              { role: 'system', content: 'Du genererar korta, relevanta följdfrågor baserat på en konversation. Svara ENDAST med en JSON-array med exakt 3 korta frågor (max 8 ord var). Exempel: ["Hur skriver jag ett bra CV?", "Vilka jobb passar mig?", "Tips för intervjuer?"]' },
              { role: 'user', content: `Användaren frågade: "${data?.meddelande}"\n\nAssistenten svarade: "${fullResponse.substring(0, 500)}"\n\nGenerera 3 naturliga följdfrågor på svenska:` }
            ],
            max_tokens: 150,
            temperature: 0.8
          })
        });

        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          const suggestionsText = suggestionsData.choices?.[0]?.message?.content || '[]';
          try {
            const suggestions = JSON.parse(suggestionsText);
            if (Array.isArray(suggestions) && suggestions.length > 0) {
              res.write(`data: ${JSON.stringify({ suggestions: suggestions.slice(0, 3) })}\n\n`);
            }
          } catch (e) {
            // Couldn't parse suggestions, skip
          }
        }
      } catch (suggestError) {
        // Suggestions failed, continue without them
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Non-streaming mode (original behavior)
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
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) return res.status(502).json({ error: 'AI request failed' });

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'No response from AI' });

    if (prompt.parseJson) {
      try { content = JSON.parse(content); } catch { content = { raw: content }; }
    }

    return res.status(200).json({ success: true, [prompt.responseKey]: content });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
