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

  try {
    const data = req.body.data || req.body;

    const systemPrompt = `Du är en expert på karriärutveckling och arbetsmarknadsanalys med djup kunskap om svenska löner och jobbmarknaden 2024.

Din uppgift är att skapa realistiska karriärvägar och du ska SJÄLV uppskatta:
- Löner för både nuvarande och målyrke (baserat på svensk lönestatistik 2024)
- Antal lediga jobb nationellt (uppskatta baserat på yrkets storlek)
- Efterfrågan på arbetsmarknaden

Var realistisk och använd faktiska lönespann för Sverige. En sjuksköterska tjänar t.ex. 35-45k, en utvecklare 40-60k, en butikssäljare 25-30k.

Svara i JSON-format med:
{
  "estimatedCurrentSalary": 35000,
  "estimatedTargetSalary": 52000,
  "estimatedJobCount": 850,
  "demandLevel": "high",
  "steps": [...],
  "marketAnalysis": {
    "salaryAnalysis": "Detaljerad analys av lönerna",
    "jobMarket": "Analys av jobbmarknaden",
    "competition": "Konkurrensbedömning",
    "timelineEstimate": "Realistisk tidslinje"
  },
  "analysis": "Övergripande analys",
  "keySkills": ["färdighet 1", "färdighet 2"],
  "challenges": ["utmaning 1"],
  "salaryProgression": [
    {"stage": "År 1", "estimatedSalary": 45000, "notes": "Beskrivning"}
  ]
}`;

    const userPrompt = `Skapa en karriärplan för följande övergång:

NUVARANDE YRKE: ${data?.currentOccupation}
MÅLYRKE: ${data?.targetOccupation}
ERFARENHET: ${data?.experienceYears} år

BASERAT PÅ DIN KUNSKAP OM DEN SVENSKA ARBETSMARKNADEN 2024:

1. Uppskatta MEDIANLÖN för båda yrkena (i kr/mån)
2. Uppskatta hur många LEDIGA JOBB som finns nationellt (siffra)
3. Bedöm efterfrågan: "high", "medium" eller "low"
4. Analysera löneutvecklingen
5. Skapa konkreta steg för övergången

VIKTIGT: Använd realistiska löner för Sverige 2024. Var inte optimistisk - var realistisk.

Svara ENDAST med JSON.`;

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 2500 });

    // Parse JSON response
    let plan;
    try {
      plan = JSON.parse(content);
      // Ensure plan has required fields
      if (!plan.steps || !Array.isArray(plan.steps)) {
        console.error('AI response missing steps, using fallback');
        plan.steps = generateFallbackSteps(data?.currentOccupation, data?.targetOccupation);
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      // Return fallback plan
      plan = {
        steps: generateFallbackSteps(data?.currentOccupation, data?.targetOccupation),
        analysis: 'Kunde inte generera AI-analys',
        keySkills: [],
        challenges: [],
        estimatedCurrentSalary: 35000,
        estimatedTargetSalary: 45000,
        estimatedJobCount: 500,
        demandLevel: 'medium',
        marketAnalysis: {
          salaryAnalysis: 'Löneuppskattning ej tillgänglig',
          jobMarket: 'Jobbmarknadsdata ej tillgänglig',
          competition: 'Konkurrensbedömning ej tillgänglig',
          timelineEstimate: '1-2 år'
        }
      };
    }

    return res.json({
      success: true,
      plan,
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

function generateFallbackSteps(current: string, target: string) {
  return [
    {
      order: 1,
      title: 'Stärk din bas',
      description: `Utveckla djup kompetens inom ${current} för att bli en erkänd expert innan du byter fokus.`,
      timeframe: '6 månader',
      actions: [
        'Ta lead på ett komplext projekt inom ditt nuvarande område',
        'Dokumentera dina resultat med konkreta siffror',
        'Bygg en portfolio som visar din expertis',
        'Nätverka inom branschen på LinkedIn'
      ],
      education: [
        'Avancerad certifiering inom din specialisering',
        'Workshop i personligt varumärke'
      ]
    },
    {
      order: 2,
      title: 'Brobyggande kompetens',
      description: `Börja utveckla färdigheter som är relevanta för ${target}.`,
      timeframe: '6 månader',
      actions: [
        'Identifiera överförbara färdigheter mellan yrkena',
        'Ta ett sidoprojekt eller konsultuppdrag inom målområdet',
        'Hitta en mentor som jobbar med ${target}',
        'Delta i branschträffar och webinarier'
      ],
      education: [
        'Online-kurs inom målområdet',
        'Kurs i projektledning eller ledarskap'
      ]
    },
    {
      order: 3,
      title: 'Praktisk erfarenhet',
      description: 'Skaffa konkret erfarenhet av målyrket genom praktiska projekt.',
      timeframe: '4 månader',
      actions: [
        'Sök volontäruppdrag eller praktik inom målområdet',
        'Erbjud hjälp med ett projekt för att bygga portfolio',
        'Dokumentera allt du lär dig',
        'Be om referenser och rekommendationer'
      ],
      education: [
        'Yrkeshögskoleutbildning eller motsvarande',
        'Branschspecifik certifiering'
      ]
    },
    {
      order: 4,
      title: 'Positionering för bytet',
      description: `Gör dig redo att söka ${target}-roller med en stark pitch.`,
      timeframe: '4 månader',
      actions: [
        'Uppdatera CV och LinkedIn med ny kompetens',
        'Skriv ett personligt brev som berättar din övergångsberättelse',
        'Aktivt nätverka med rekryterare i målbranschen',
        'Sök roller internt eller externt'
      ],
      education: []
    }
  ];
}
