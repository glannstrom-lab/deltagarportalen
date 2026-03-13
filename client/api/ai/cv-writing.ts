/**
 * Vercel Serverless Function: AI CV Writing
 * Säker server-side implementation för CV-skrivhjälp
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

// Rate limiting (in-memory - vid skalning använd Redis/Vercel KV)
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

// Input sanitization för att förhindra prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .replace(/<\|system\|>/gi, '')
    .replace(/<\|user\|>/gi, '')
    .replace(/<\|assistant\|>/gi, '')
    .slice(0, 4000); // Max 4000 tecken
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
      max_tokens: options.max_tokens || 500,
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
    const { content, type, feature } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!feature || !['improve', 'quantify', 'translate', 'generate'].includes(feature)) {
      return res.status(400).json({ error: 'Valid feature is required (improve, quantify, translate, generate)' });
    }

    const sanitizedContent = sanitizeInput(content);

    // Bygg prompt baserat på feature
    let systemPrompt = 'Du är en professionell CV-skrivare som hjälper jobbsökare.';
    let userPrompt = '';

    switch (feature) {
      case 'improve':
        systemPrompt = 'Du är en expert på CV-skrivning. Din uppgift är att förbättra texten för att göra den mer slagkraftig och professionell. Använd starka action-verb och konkreta formuleringar.';
        userPrompt = `Förbättra följande CV-text för att göra den mer professionell och slagkraftig:

"${sanitizedContent}"

Ge bara den förbättrade texten, inga förklaringar. Max 3-4 meningar.`;
        break;

      case 'quantify':
        systemPrompt = 'Du är en expert på resultatorienterade CV:n. Din uppgift är att lägga till mätbara resultat och konkreta siffror där det är möjligt.';
        userPrompt = `Omskriv följande CV-text för att inkludera mätbara resultat och konkreta siffror:

"${sanitizedContent}"

Ge bara den förbättrade texten, inga förklaringar.`;
        break;

      case 'translate':
        systemPrompt = 'Du är en översättare specialiserad på CV-terminologi. Översätt från svenska till engelska med professionella termer.';
        userPrompt = `Översätt följande CV-text från svenska till engelska:

"${sanitizedContent}"

Ge bara den översatta texten, inga förklaringar.`;
        break;

      case 'generate':
        systemPrompt = 'Du är en karriärcoach som hjälper arbetssökande. Skriv professionell CV-text.';
        let typePrompt = '';
        if (type === 'summary') {
          typePrompt = 'Skriv en professionell sammanfattning (3-4 meningar)';
        } else if (type === 'experience') {
          typePrompt = 'Skriv en professionell arbetsbeskrivning (3-4 meningar)';
        } else if (type === 'skills') {
          typePrompt = 'Formulera om kompetenser till en professionell lista';
        }
        userPrompt = `${typePrompt} baserat på:

"${sanitizedContent}"

Ge bara texten, inga förklaringar.`;
        break;
    }

    console.log(`[cv-writing] Feature: ${feature}, Type: ${type}`);

    const result = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 600 });

    return res.json({
      success: true,
      result: result.trim(),
      feature,
      model: DEFAULT_MODEL
    });

  } catch (error: any) {
    console.error('[cv-writing] Error:', error);
    return res.status(500).json({
      error: 'Ett fel uppstod vid kommunikation med AI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
