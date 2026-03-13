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

// Handler för karriärplan
async function handleCareerPlan(data: any) {
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

  try {
    return JSON.parse(content);
  } catch (e) {
    return generateFallbackPlan(data?.currentOccupation, data?.targetOccupation);
  }
}

// Handler för kompetensanalys
async function handleSkills(data: any) {
  const systemPrompt = `Du är en expert på kompetensutveckling och arbetsmarknad 2024.
Din uppgift är att analysera vilka kompetenser som behövs för olika yrken.

Svara i JSON-format med:
{
  "technicalSkills": [
    {"name": "Kompetensnamn", "importance": "Hög", "howToLearn": "Hur man lär sig", "timeToAcquire": "3-6 månader"}
  ],
  "softSkills": [
    {"name": "Kompetensnamn", "importance": "Medel", "howToLearn": "Tips för utveckling"}
  ],
  "certifications": [
    {"name": "Certifiering", "value": "Högt värde", "provider": "Vem som ger certifieringen"}
  ],
  "priority": [
    {"rank": 1, "skill": "Viktigaste kompetensen", "reason": "Varför den är viktig"}
  ],
  "gapAnalysis": "Analys av kompetensgap om man kommer från annat yrke",
  "learningPath": [
    {"step": 1, "action": "Vad man ska göra först", "timeframe": "Tidsram"}
  ]
}`;

  const userPrompt = `Analysera kompetensbehov för följande yrke:

MÅLYRKET: ${data?.occupation}
${data?.currentOccupation ? `NUVARANDE YRKE: ${data?.currentOccupation}` : ''}
${data?.experience ? `ERFARENHET: ${data?.experience} år` : ''}

Baserat på din kunskap om arbetsmarknaden 2024, ge:
1. Tekniska/hårda kompetenser som behövs
2. Mjuka kompetenser som efterfrågas
3. Värdefulla certifieringar
4. Prioriterad lista (vad är viktigast att lära sig först)
5. Kompetensgap-analys (om man kommer från annat yrke)
6. Rekommenderad inlärningsväg

Svara ENDAST med JSON.`;

  const content = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { max_tokens: 2500 });

  try {
    return { skillsData: JSON.parse(content) };
  } catch (e) {
    throw new Error('Kunde inte tolka AI-svar');
  }
}

// Handler för utbildningsråd
async function handleEducation(data: any) {
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

  try {
    return { educationData: JSON.parse(content) };
  } catch (e) {
    throw new Error('Kunde inte tolka AI-svar');
  }
}

// Handler för löneanalys
async function handleSalary(data: any) {
  const systemPrompt = `Du är en expert på svenska löner och arbetsmarknad 2024. 
Din uppgift är att ge realistiska löneuppskattningar baserat på yrke, erfarenhet och region.

Svara i JSON-format med:
{
  "medianSalary": 45000,
  "percentile25": 38000,
  "percentile75": 52000,
  "byRegion": [
    {"region": "Stockholms län", "median": 48000, "jobCount": 1200}
  ],
  "byExperience": [
    {"years": "0-2", "median": 35000}
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

  try {
    return { salaryData: JSON.parse(content) };
  } catch (e) {
    throw new Error('Kunde inte tolka AI-svar');
  }
}

// Fallback för karriärplan
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

function generateFallbackPlan(current: string, target: string) {
  return {
    steps: generateFallbackSteps(current, target),
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
    const type = req.query.type || data.type || 'plan';

    let result;
    switch (type) {
      case 'skills':
        result = await handleSkills(data);
        break;
      case 'education':
        result = await handleEducation(data);
        break;
      case 'salary':
        result = await handleSalary(data);
        break;
      case 'plan':
      default:
        result = await handleCareerPlan(data);
        break;
    }

    return res.json({
      success: true,
      ...result,
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
