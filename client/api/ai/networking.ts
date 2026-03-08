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
    const type = data?.type || 'strategy'; // strategy, message, or linkedin

    if (type === 'strategy') {
      // Generate networking strategy
      const systemPrompt = `Du är en expert på professionellt nätverkande och karriärutveckling.
Din uppgift är att skapa personliga nätverksstrategier.

Svara i JSON-format med:
{
  "keyContacts": [
    {"role": "Vilken typ av person", "why": "Varför de är viktiga", "howToFind": "Hur hitta dem"}
  ],
  "strategy": [
    {"phase": "Fas 1", "action": "Vad man ska göra", "timeline": "Tidsram"}
  ],
  "events": ["Rekommenderad event 1", "Event 2"],
  "organizations": [" Organisation 1", "Organisation 2"],
  "linkedinStrategy": "Strategi för LinkedIn",
  "elevatorPitch": "30-sekunders presentation",
  "advice": "Övergripande råd"
}`;

      const userPrompt = `Skapa nätverksstrategi för:

NUVARANDE YRKE: ${data?.currentOccupation || 'Ej angivet'}
MÅLYRKE: ${data?.targetOccupation}
${data?.experience ? `ERFARENHET: ${data?.experience} år` : ''}

Ge konkreta råd om:
1. Vilka är de viktigaste personerna att kontakta?
2. Steg-för-steg strategi
3. Relevanta event och organisationer
4. LinkedIn-strategi
5. Elevator pitch

Svara ENDAST med JSON.`;

      const content = await callOpenRouter([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { max_tokens: 2000 });

      const strategyData = JSON.parse(content);
      return res.json({ success: true, strategyData, model: DEFAULT_MODEL });

    } else if (type === 'message') {
      // Generate personalized message
      const systemPrompt = `Du är en expert på professionell kommunikation och nätverkande.
Skriv personliga, professionella meddelanden för olika situationer.`;

      const userPrompt = `Skriv ett ${data?.messageType || 'kontakt'}-meddelande:

AVSÄNDARE: ${data?.senderName || '[Ditt namn]'}
NUVARANDE ROLL: ${data?.senderRole || '[Din roll]'}
MOTTAGARE: ${data?.recipientName || '[Namn]'}
MOTTAGARENS ROLL: ${data?.recipientRole || '[Roll]'}
${data?.context ? `SAMMANHANG: ${data?.context}` : ''}
${data?.goal ? `MÅL: ${data?.goal}` : ''}

Skriv ett personligt, professionellt meddelande på svenska. Håll det kort (max 150 ord).`;

      const content = await callOpenRouter([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { max_tokens: 800 });

      return res.json({ 
        success: true, 
        message: content,
        messageType: data?.messageType,
        model: DEFAULT_MODEL 
      });

    } else if (type === 'linkedin') {
      // Generate LinkedIn optimization tips
      const systemPrompt = `Du är en expert på LinkedIn och personligt varumärke.`;

      const userPrompt = `Ge LinkedIn-optimering för:

NUVARANDE YRKE: ${data?.currentOccupation}
MÅLYRKE: ${data?.targetOccupation}
${data?.experience ? `ERFARENHET: ${data?.experience} år` : ''}

Ge 5-7 konkreta tips för att optimera LinkedIn-profilen för karriärbytet.`;

      const content = await callOpenRouter([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { max_tokens: 1000 });

      return res.json({ 
        success: true, 
        linkedinTips: content,
        model: DEFAULT_MODEL 
      });
    }

    return res.status(400).json({ error: 'Invalid type' });

  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Ett fel uppstod',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
