import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

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
      max_tokens: options.max_tokens || 2000,
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

  try {
    const data = req.body.data || req.body;

    const systemPrompt = `Du är en expert på svenska löner och arbetsmarknad 2024. 
Din uppgift är att ge realistiska löneuppskattningar baserat på yrke, erfarenhet och region.

Svara i JSON-format med:
{
  "medianSalary": 45000,
  "percentile25": 38000,
  "percentile75": 52000,
  "byRegion": [
    {"region": "Stockholms län", "median": 48000, "jobCount": 1200},
    {"region": "Västra Götalands län", "median": 42000, "jobCount": 800}
  ],
  "byExperience": [
    {"years": "0-2", "median": 35000},
    {"years": "3-5", "median": 42000},
    {"years": "6-10", "median": 50000},
    {"years": "10+", "median": 58000}
  ],
  "trends": {
    "growth": 5.2,
    "jobCount": 2500,
    "competition": "Medel"
  },
  "analysis": "Detaljerad analys av löneläget",
  "tips": ["Tips 1 för löneökning", "Tips 2"]
}`;

    const userPrompt = `Ge löneanalys för följande yrke:

YRKET: ${data?.occupation}
${data?.region ? `REGION: ${data?.region}` : 'NATIONELLT: Sverige'}
${data?.experience ? `ERFARENHET: ${data?.experience} år` : ''}

Baserat på din kunskap om svenska löner 2024, ge:
1. Medianlön och percentiler (25%, 75%)
2. Lön per region (minst 5 regioner)
3. Lön per erfarenhetsnivå
4. Trender och jobbmarknad
5. Analys och tips för löneökning

Svara ENDAST med JSON.`;

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 2000 });

    let salaryData;
    try {
      salaryData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Kunde inte tolka AI-svar' });
    }

    return res.json({
      success: true,
      salaryData,
      model: DEFAULT_MODEL
    });

  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Ett fel uppstod',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
