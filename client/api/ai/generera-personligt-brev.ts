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
      'HTTP-Referer': process.env.SITE_URL || 'https://deltagarportalen.se',
      'X-Title': 'Deltagarportalen'
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
    const data = req.body;
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
${cv.workExperience?.map((exp: any) => `- ${exp.title} på ${exp.company}${exp.description ? `: ${exp.description}` : ''}`).join('\n') || 'Ingen erfarenhet angiven'}

KOMPETENSER:
${cv.skills?.map((s: any) => s.name).join(', ') || 'Inga kompetenser angivna'}
`;
    }

    const systemPrompt = `Du är en expert på att skriva personliga brev för jobbansökningar.
Skriv på svenska med en${tonInstructions[ton] || tonInstructions.professionell} ton.
Brevet ska vara personligt, engagerande och visa varför just denna person passar för jobbet.
Använd CV-informationen för att koppla personens erfarenheter till jobbets krav.`;

    const userPrompt = `Skriv ett personligt brev för följande jobb:

FÖRETAG: ${data?.companyName || 'Ej angivet'}
JOBBTITEL: ${data?.jobTitle || 'Ej angiven'}

JOBBANNONS:
${data?.jobbAnnons || data?.jobDescription || ''}
${cvContext}

${data?.motivering ? `VARFÖR JAG VILL HA JOBBET:\n${data.motivering}\n` : ''}
${data?.extraContext ? `EXTRA KONTEXT:\n${data.extraContext}\n` : ''}

VIKTIGT:
- Brevet ska vara 250-350 ord
- Koppla specifikt min erfarenhet till jobbets krav
- Nämn företagsnamnet i inledningen
- Använd mina faktiska erfarenheter från CV:t
- Avsluta med att be om intervju

Skriv brevet:`;

    console.log('AI call: generera-personligt-brev');

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 1500 });

    return res.json({
      success: true,
      brev: content,
      function: 'generera-personligt-brev',
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
