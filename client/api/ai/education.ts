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
      max_tokens: options.max_tokens || 2500,
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

    const systemPrompt = `Du är en expert på svensk utbildningsväsende och arbetsmarknad 2024.
Din uppgift är att rekommendera utbildningar för karriärutveckling.

Svara i JSON-format med:
{
  "recommendations": [
    {
      "type": "Yrkeshögskola|Universitet|Komvux|Folkhögskola|Online",
      "title": "Utbildningens namn",
      "description": "Beskrivning av utbildningen",
      "duration": "2 år",
      "durationMonths": 24,
      "cost": "CSN-berättigad, avgiftsfri",
      "value": "Högt|Medel|Lågt",
      "valueReason": "Varför den har detta värde",
      "provider": "Typ av skola/anordnare",
      "pros": ["Fördel 1", "Fördel 2"],
      "cons": ["Nackdel 1", "Nackdel 2"]
    }
  ],
  "alternativePaths": [
    {"path": "Alternativ väg", "description": "Beskrivning", "bestFor": "Vem det passar"}
  ],
  "csnInfo": "Information om studiemedel",
  "comparison": "Jämförelse av alternativen",
  "advice": "Övergripande råd för utbildningsval"
}`;

    const userPrompt = `Ge utbildningsråd för följande yrke:

MÅLYRKET: ${data?.occupation}
${data?.currentOccupation ? `NUVARANDE YRKE: ${data?.currentOccupation}` : ''}
${data?.experience ? `ERFARENHET: ${data?.experience} år` : ''}
${data?.preferredType ? `FÖREDARAD UTBLIDNINGSTYP: ${data?.preferredType}` : ''}
${data?.maxDuration ? `MAX LÄNGD: ${data?.maxDuration}` : ''}

Baserat på din kunskap om svenskt utbildningsväsende 2024, ge:
1. 3-5 konkreta utbildningsrekommendationer med för- och nackdelar
2. Alternativa vägar (t.ex. praktik, lärlingsplats)
3. CSN-information
4. Jämförelse av alternativen
5. Övergripande råd

Svara ENDAST med JSON.`;

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 2500 });

    let educationData;
    try {
      educationData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Kunde inte tolka AI-svar' });
    }

    return res.json({
      success: true,
      educationData,
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
