import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

// Rate limiting (enkel in-memory implementation)
// OBS: Vid skalning bör du använda Redis eller liknande
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minuter
  const maxRequests = 20;

  const current = rateLimits.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip as string)) {
    return res.status(429).json({ error: 'För många förfrågningar. Försök igen om 15 minuter.' });
  }

  try {
    // Get function name from URL path (Vercel dynamic routing) or body
    const fn = req.query.function as string || req.body.function;
    const data = req.body.data || req.body;

    if (!fn) {
      return res.status(400).json({ error: 'Missing function parameter' });
    }

    console.log(`[AI] Function: ${fn}, URL: ${req.url}`);
    console.log(`[AI] Body keys:`, Object.keys(req.body));
    console.log(`[AI] Full body (first 500):`, JSON.stringify(req.body).substring(0, 500));
    
    // Extra debug för personligt-brev
    if (fn === 'personligt-brev') {
      console.log('[AI] === PERSONLIGT BREV DATA ===');
      console.log('[AI] jobbAnnons length:', data?.jobbAnnons?.length || 0);
      console.log('[AI] jobbAnnons preview:', data?.jobbAnnons?.substring(0, 150) || 'SAKNAS');
      console.log('[AI] companyName:', data?.companyName || 'SAKNAS');
      console.log('[AI] jobTitle:', data?.jobTitle || 'SAKNAS');
      console.log('[AI] cvData exists:', !!data?.cvData);
      if (data?.cvData) {
        console.log('[AI] cvData.firstName:', data.cvData.firstName);
        console.log('[AI] cvData.skills count:', data.cvData.skills?.length || 0);
      }
      console.log('[AI] ============================');
    }

    const { systemPrompt, userPrompt, maxTokens } = buildPrompt(fn, data);

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: maxTokens });

    return res.json({
      success: true,
      [fn === 'chatbot' ? 'svar' : fn === 'personligt-brev' ? 'brev' : 'result']: content,
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
