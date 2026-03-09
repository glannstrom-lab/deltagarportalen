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

interface SkillGap {
  skill: string;
  importance: 'critical' | 'high' | 'medium' | 'nice-to-have';
  demandLevel: 'very-high' | 'high' | 'medium' | 'low';
  rationale: string;
  estimatedLearningTime: string;
}

function generateFallbackAnalysis(cvData: any, targetRole?: string): SkillGap[] {
  const commonGaps: SkillGap[] = [
    {
      skill: 'Digital kompetens',
      importance: 'high',
      demandLevel: 'very-high',
      rationale: 'De flesta yrken kräver idag grundläggande digital kompetens',
      estimatedLearningTime: '1-2 veckor'
    },
    {
      skill: 'Kommunikation',
      importance: 'critical',
      demandLevel: 'very-high',
      rationale: 'Effektiv kommunikation efterfrågas i nästan alla jobb',
      estimatedLearningTime: '2-4 veckor'
    },
    {
      skill: 'Problemlösning',
      importance: 'high',
      demandLevel: 'high',
      rationale: 'Arbetsgivare värdesätter anställda som kan lösa problem självständigt',
      estimatedLearningTime: '3-6 veckor'
    }
  ];

  const existingSkills = new Set(cvData?.skills?.map((s: string) => s.toLowerCase()) || []);
  return commonGaps.filter(gap => !existingSkills.has(gap.skill.toLowerCase()));
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
    console.log('[microlearning] Request received');
    
    const payload = req.body.data || req.body;
    const { cvData, targetRole, jobRequirements } = payload;

    if (!cvData) {
      return res.status(400).json({ error: 'CV data is required' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error('[microlearning] OPENROUTER_API_KEY missing');
      // Returnera fallback-analys istället för fel
      const fallbackGaps = generateFallbackAnalysis(cvData, targetRole);
      return res.json({
        success: true,
        skillGaps: fallbackGaps,
        fallback: true,
        message: 'Använder fallback-analys'
      });
    }

    // Bygg prompt för analys
    let prompt = `ANALYSERA KOMPETENSGAP FÖR ARBETSMARKNADEN I SVERIGE\n\n`;
    
    if (cvData.skills?.length > 0) {
      prompt += `NUVARANDE KOMPETENSER:\n${cvData.skills.join(', ')}\n\n`;
    }

    if (cvData.workExperience?.length > 0) {
      prompt += `ARBETSLIVSERFARENHET:\n`;
      cvData.workExperience.forEach((exp: any) => {
        prompt += `- ${exp.title}: ${exp.description?.substring(0, 200) || 'Ingen beskrivning'}\n`;
      });
      prompt += `\n`;
    }

    if (cvData.education?.length > 0) {
      prompt += `UTBILDNING:\n`;
      cvData.education.forEach((edu: any) => {
        prompt += `- ${edu.degree}\n`;
      });
      prompt += `\n`;
    }

    if (targetRole) {
      prompt += `MÅLYRKE: ${targetRole}\n\n`;
    }

    if (jobRequirements) {
      prompt += `JOBBKRAV:\n`;
      prompt += `Titel: ${jobRequirements.title}\n`;
      if (jobRequirements.requiredSkills?.length > 0) {
        prompt += `Obligatoriska kompetenser: ${jobRequirements.requiredSkills.join(', ')}\n`;
      }
      if (jobRequirements.preferredSkills?.length > 0) {
        prompt += `Önskade kompetenser: ${jobRequirements.preferredSkills.join(', ')}\n`;
      }
      prompt += `\n`;
    }

    prompt += `INSTRUKTIONER:\n`;
    prompt += `1. Identifiera 5-8 konkreta kompetenser som personen saknar för sitt målyrke\n`;
    prompt += `2. Prioritera baserat på arbetsmarknadens efterfrågan i Sverige\n`;
    prompt += `3. Ge uppmuntrande men realistiska råd\n`;
    prompt += `4. Inkludera uppskattad tid för att lära sig varje kompetens\n\n`;
    prompt += `Returnera resultatet som JSON i exakt detta format:\n`;
    prompt += `{\n`;
    prompt += `  "skillGaps": [\n`;
    prompt += `    {\n`;
    prompt += `      "skill": "kompetensnamn på svenska",\n`;
    prompt += `      "importance": "critical|high|medium|nice-to-have",\n`;
    prompt += `      "demandLevel": "very-high|high|medium|low",\n`;
    prompt += `      "rationale": "förklaring varför detta behövs",\n`;
    prompt += `      "estimatedLearningTime": "t.ex. 2-4 veckor"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}`;

    console.log('[microlearning] Calling OpenRouter...');

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Du är en svensk arbetsmarknadsexpert som hjälper arbetssökande att identifiera kompetensgap. Du är uppmuntrande, konkret och har god kunskap om vilka kompetenser som efterfrågas på den svenska arbetsmarknaden.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[microlearning] OpenRouter error:', error);
      // Fallback vid fel
      const fallbackGaps = generateFallbackAnalysis(cvData, targetRole);
      return res.json({
        success: true,
        skillGaps: fallbackGaps,
        fallback: true,
        message: 'Använder fallback-analys på grund av tekniskt fel'
      });
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const result = JSON.parse(data.choices[0].message.content);
      console.log('[microlearning] Successfully analyzed skill gaps');
      
      return res.json({
        success: true,
        skillGaps: result.skillGaps || [],
        model: DEFAULT_MODEL
      });
    }

    throw new Error('Unexpected response format');

  } catch (error: any) {
    console.error('[microlearning] Error:', error);
    // Fallback vid alla fel
    const payload = req.body.data || req.body;
    const fallbackGaps = generateFallbackAnalysis(payload?.cvData, payload?.targetRole);
    
    return res.json({
      success: true,
      skillGaps: fallbackGaps,
      fallback: true,
      message: 'Använder fallback-analys'
    });
  }
}
