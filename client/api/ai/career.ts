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

    const salaryIncrease = data?.targetSalary - data?.currentSalary;
    const salaryIncreasePercent = data?.currentSalary > 0 
      ? Math.round((salaryIncrease / data?.currentSalary) * 100) 
      : 0;

    const systemPrompt = `Du är en expert på karriärutveckling och arbetsmarknadsanalys. 
Din uppgift är att skapa realistiska, skräddarsydda karriärvägar baserat på faktisk marknadsdata.

Du ska:
- Analysera löneutveckling och ge realistiska förväntningar
- Beakta antalet lediga jobb och konkurrensen
- Skapa en realistisk tidslinje baserat på erfarenhet och utbildningsbehov
- Identifiera överförbara färdigheter mellan yrkena
- Ge konkreta, genomförbara steg
- Inkludera både formell utbildning och praktisk erfarenhet

Svara i JSON-format med följande struktur:
{
  "steps": [
    {
      "order": 1,
      "title": "Stegtitel",
      "description": "Beskrivning av steget",
      "timeframe": "Tidsram",
      "actions": ["Åtgärd 1", "Åtgärd 2"],
      "education": ["Utbildning 1", "Utbildning 2"]
    }
  ],
  "marketAnalysis": {
    "salaryIncrease": "Löneökning analys",
    "jobMarket": "Bedömning av arbetsmarknaden baserat på antal lediga jobb",
    "competition": "Hur svårt är det att få jobb?",
    "timelineEstimate": "Uppskattad tidslinje för hela övergången"
  },
  "analysis": "Kort analys av övergången",
  "keySkills": ["Viktig färdighet 1", "Viktig färdighet 2"],
  "challenges": ["Utmaning 1", "Utmaning 2"],
  "salaryProgression": [
    {"stage": "År 1", "estimatedSalary": 45000, "notes": "Entry level i målyrket"},
    {"stage": "År 3", "estimatedSalary": 52000, "notes": "Med erfarenhet"}
  ]
}`;

    const userPrompt = `Skapa en detaljerad karriärplan baserat på följande marknadsdata:

=== PERSONLIG INFORMATION ===
NUVARANDE YRKE: ${data?.currentOccupation}
ERFARENHET: ${data?.experienceYears} år
MÅLYRKE: ${data?.targetOccupation}

=== LÖNEDATA ===
NUVARANDE LÖN: ${data?.currentSalary?.toLocaleString()} kr/mån
MÅLLÖN: ${data?.targetSalary?.toLocaleString()} kr/mån
LÖNEÖKNING: +${salaryIncrease?.toLocaleString()} kr/mån (+${salaryIncreasePercent}%)

=== ARBETSMARKNADSDATA ===
LEDIGA JOBB NATIONELLT: ${data?.jobCount}
EFTERFRÅGAN: ${data?.demand === 'high' ? 'Hög' : data?.demand === 'medium' ? 'Medel' : 'Låg'}

Skapa 4-5 konkreta steg för karriärövergången. Inkludera:
1. En marknadsanalys som kommenterar löneökningen och jobbmarknaden
2. Realistisk tidslinje baserat på erfarenhet och kompetensgap
3. Vilka färdigheter som behövs för målyrket
4. Överförbara färdigheter från nuvarande yrke
5. Konkreta åtgärder för varje steg
6. Rekommenderad utbildning/kompetensutveckling
7. Löneutveckling över tid (estimerad progression)

Svara ENDAST med JSON, inget annat.`;

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 2500 });

    // Parse JSON response
    let plan;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      // Return fallback plan
      plan = {
        steps: generateFallbackSteps(data?.currentOccupation, data?.targetOccupation),
        analysis: 'Kunde inte generera AI-analys',
        keySkills: [],
        challenges: []
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
