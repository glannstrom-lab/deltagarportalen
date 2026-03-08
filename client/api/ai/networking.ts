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
    
    // Check if this is a custom message generation request
    if (data?.generateMessage) {
      // Generate personalized outreach message
      const systemPrompt = `Du är en expert på professionell kommunikation och nätverkande.
Skriv personliga, professionella meddelanden som känns äkta och engagerande.
Meddelandena ska vara på svenska, vänliga men professionella, och anpassade efter relationen.`;

      const userPrompt = `Skriv ett personligt ${data.messageType === 'initial' ? 'första' : data.messageType === 'followup' ? 'uppföljnings' : 'tack'}-meddelande:

AVSÄNDARE: Jobbsökande inom ${data.userOccupation}
MOTTAGARE: ${data.contactName}${data.contactRole ? ` (${data.contactRole})` : ''}${data.contactCompany ? ` på ${data.contactCompany}` : ''}
RELATION: ${data.relationship === 'colleague' ? 'Tidigare kollega' : data.relationship === 'friend' ? 'Vän' : data.relationship === 'mentor' ? 'Mentor' : data.relationship === 'recruiter' ? 'Rekryterare' : 'Kontakt'}
SYFTE: ${data.purpose}

Skriv ett meddelande på 100-150 ord som:
1. Är personligt och visar respekt för deras tid
2. Förklarar tydligt syftet med kontakten
3. Inkluderar en tydlig call-to-action
4. Avslutas på ett vänligt sätt

Svara endast med själva meddelandet, inga extra kommentarer.`;

      const content = await callOpenRouter([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { max_tokens: 800, temperature: 0.8 });

      return res.json({ 
        success: true, 
        message: content.trim(),
        customMessage: content.trim(),
        model: DEFAULT_MODEL 
      });
    }

    // Generate networking strategy
    const systemPrompt = `Du är en expert på professionellt nätverkande och karriärutveckling.
Din uppgift är att skapa konkreta, personliga nätverksstrategier som är realistiska och genomförbara.

Svara ALLTID i JSON-format med följande struktur:
{
  "strategies": [
    {
      "title": "Strategi-titel",
      "description": "Beskrivning av strategin",
      "actions": ["Konkret åtgärd 1", "Åtgärd 2", "Åtgärd 3"],
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "targetContacts": [
    {
      "type": "Typ av kontakt (t.ex. 'Rekryterare')",
      "description": "Beskrivning av varför denna kontakt är värdefull",
      "whereToFind": ["Plats 1", "Plats 2"]
    }
  ],
  "linkedinTips": ["Tips 1", "Tips 2", "Tips 3"],
  "conversationStarters": ["Fråga 1", "Fråga 2", "Fråga 3"],
  "followUpSchedule": [
    {"timing": "Direkt efter mötet", "action": "Vad man ska göra"}
  ]
}`;

    const goalsMap: Record<string, string> = {
      'job': 'hitta nytt jobb',
      'learn': 'lära mig mer om branschen',
      'collaborate': 'hitta samarbetspartners'
    };

    const experienceMap: Record<string, string> = {
      'entry': 'Junior (0-2 års erfarenhet)',
      'mid': 'Medel (3-7 års erfarenhet)', 
      'senior': 'Senior (8+ års erfarenhet)'
    };

    const userPrompt = `Skapa en personlig nätverksstrategi för:

YRKE/MÅL: ${data?.occupation}
ERFARENHETSNIVÅ: ${experienceMap[data?.experienceLevel] || 'Medel'}
MÅL MED NÄTVERKANDE: ${data?.goals?.map((g: string) => goalsMap[g] || g).join(', ') || 'hitta nytt jobb'}

Skapa 3-4 strategier med olika svårighetsgrader (lätt, medel, avancerad).
Inkludera konkreta platser att hitta kontakter i Sverige (LinkedIn, föreningar, event).
Ge specifika konversationsöppnare som fungerar i svensk kontext.`;

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { max_tokens: 2500, temperature: 0.7 });

    // Parse JSON response
    let strategyData;
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        strategyData = JSON.parse(jsonMatch[1].trim());
      } else {
        strategyData = JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      // Return fallback structure
      strategyData = {
        strategies: [
          {
            title: 'Börja med ditt befintliga nätverk',
            description: 'Kontakta gamla kollegor, klasskamrater och vänner. De känner dig redan och vill hjälpa.',
            actions: ['Gör en lista på 10 personer du känner', 'Skicka ett personligt meddelande', 'Be om 15 minuters rådgivningssamtal'],
            difficulty: 'easy'
          },
          {
            title: 'Optimera din LinkedIn-profil',
            description: 'Se till att din profil är professionell och synlig för rekryterare.',
            actions: ['Uppdatera rubriken med ditt mål', 'Skriv en sammanfattning som visar passion', 'Aktivera "Open to Work" om lämpligt'],
            difficulty: 'easy'
          },
          {
            title: 'Delta i branschevenemang',
            description: 'Nätverka på konferenser, meetups och seminarier i din bransch.',
            actions: ['Sök efter kommande evenemang', 'Förbered en 30-sekunders pitch', 'Följ upp med nya kontakter inom 24 timmar'],
            difficulty: 'medium'
          }
        ],
        targetContacts: [
          {
            type: 'Rekryterare',
            description: 'Specialister som hjälper företag att hitta rätt talanger',
            whereToFind: ['LinkedIn', 'Rekryteringsbyråer', 'Branschevenemang']
          },
          {
            type: 'Branschkollegor',
            description: 'Personer som arbetar i samma bransch och kan dela insikter',
            whereToFind: ['LinkedIn-grupper', 'Branschföreningar', 'Meetups']
          }
        ],
        linkedinTips: [
          'Skicka alltid ett personligt meddelande med connection requests',
          'Engagera dig i andras inlägg innan du ber om hjälp',
          'Dela med dig av din kunskap genom egna inlägg'
        ],
        conversationStarters: [
          'Vad är det mest spännande du arbetar med just nu?',
          'Hur kom du in i den här branschen?',
          'Vilka trender ser du inom vårt område just nu?'
        ],
        followUpSchedule: [
          { timing: 'Direkt efter mötet', action: 'Skicka ett tack-meddelande' },
          { timing: '1 vecka senare', action: 'Dela en intressant artikel relaterat till ert samtal' },
          { timing: '1 månad senare', action: 'Ge en kort uppdatering om dina framsteg' }
        ]
      };
    }

    return res.json({ 
      success: true, 
      ...strategyData,
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
