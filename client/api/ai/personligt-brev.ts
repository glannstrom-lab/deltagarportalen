import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
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
      'HTTP-Referer': process.env.SITE_URL || 'https://jobin.se',
      'X-Title': 'Jobin'
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      max_tokens: options.max_tokens || 1500,
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
    // Data kommer antingen i body.data (från aiService) eller direkt i body
    const payload = req.body.data || req.body;
    
    console.log('[personligt-brev] Request received');
    console.log('[personligt-brev] Payload keys:', Object.keys(payload));
    console.log('[personligt-brev] jobbAnnons length:', payload?.jobbAnnons?.length || 0);

    const ton = payload?.ton || 'professionell';
    const tonInstructions: Record<string, string> = {
      professionell: ' professionell och balanserad',
      entusiastisk: ' entusiastisk och energisk',
      formell: ' formell och traditionell'
    };

    // Extrahera all data
    const companyName = payload?.companyName || payload?.company || 'Företaget';
    const jobTitle = payload?.jobTitle || payload?.title || 'den aktuella tjänsten';
    const jobbAnnons = payload?.jobbAnnons || payload?.jobDescription || '';
    const motivering = payload?.motivering || '';
    const extraKeywords = payload?.extraKeywords || '';
    const extraContext = payload?.extraContext || '';
    
    // CV-data
    const cvData = payload?.cvData || {};
    const firstName = cvData?.firstName || '';
    const lastName = cvData?.lastName || '';
    const title = cvData?.title || '';
    const summary = cvData?.summary || '';
    const workExperience = cvData?.workExperience || [];
    const skills = cvData?.skills || [];

    // Bygg CV-kontext
    let cvContext = '';
    if (firstName || lastName || title || workExperience.length > 0 || skills.length > 0) {
      cvContext = `
MIN PROFIL:
Namn: ${firstName} ${lastName}
Titel: ${title || 'Ej angiven'}
${summary ? `Sammanfattning: ${summary}\n` : ''}

ARBETSLIVSERFARENHET:
${workExperience.length > 0 
  ? workExperience.map((exp: any) => 
      `- ${exp.title || exp.role || 'Anställning'} på ${exp.company || exp.employer || 'Företag'}${exp.duration ? ` (${exp.duration})` : ''}${exp.description ? `: ${exp.description.substring(0, 200)}` : ''}`
    ).join('\n')
  : 'Ingen specifik erfarenhet angiven'}

KOMPETENSER:
${skills.length > 0 
  ? skills.map((s: any) => s.name || s).join(', ')
  : 'Inga specifika kompetenser angivna'}
`;
    }

    // Bygg prompt
    const hasJobAd = jobbAnnons.length > 50;
    
    const systemPrompt = `Du är en expert på att skriva personliga brev för jobbansökningar på svenska.
Du skriver med en${tonInstructions[ton] || tonInstructions.professionell} ton.

VIKTIGA REGLER:
1. Analysera ALLTID jobbannonsen noggrant innan du skriver
2. Koppla specifika krav från annonsen till personens erfarenheter
3. Var konkret - visa HUR personen matchar jobbet
4. Nämn företagsnamn och jobbtitel i inledningen
5. Brevet ska vara 250-350 ord
6. Avsluta med att be om intervju`;

    const userPrompt = `Skriv ett personligt brev för denna ansökan:

${hasJobAd ? `JOBBANNONS (detta är det viktigaste - läs noggrant!):
${jobbAnnons.substring(0, 3000)}
` : 'OBS: Ingen detaljerad jobbannons tillgänglig.'}

FÖRETAG: ${companyName}
JOBBTITEL: ${jobTitle}

${cvContext}

${extraKeywords ? `EXTRA NYCKELORD ATT LYFTA:\n${extraKeywords}\n\n` : ''}
${motivering ? `MIN MOTIVERING:\n${motivering}\n\n` : ''}
${extraContext ? `EXTRA INSTRUKTIONER:\n${extraContext}\n\n` : ''}
INSTRUKTIONER FÖR BREVET:
${hasJobAd ? `1. Läs jobbannonsen ovan och identifiera 2-3 viktiga krav/önskemål
2. Koppla dessa krav till specifika erfarenheter från min bakgrund
3. Använd formuleringar som "Eftersom ni söker någon med [krav], kan jag bidra med..."
4. Var konkret och specifik - undvik generiska påståenden` : '1. Skriv ett professionellt brev baserat på min bakgrund'}
5. Nämn "${companyName}" och "${jobTitle}" tidigt i brevet
6. Brevet ska vara 250-350 ord
7. Avsluta med "Med vänliga hälsningar${firstName && lastName ? `, ${firstName} ${lastName}` : ''}"

Skriv det personliga brevet nu:`;

    console.log('[personligt-brev] Calling OpenRouter...');

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 1500 });

    console.log('[personligt-brev] Successfully generated letter');

    return res.json({
      success: true,
      brev: content,
      result: content,
      function: 'personligt-brev',
      model: DEFAULT_MODEL
    });

  } catch (error: any) {
    console.error('[personligt-brev] Error:', error);
    return res.status(500).json({
      error: 'Ett fel uppstod vid kommunikation med AI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
