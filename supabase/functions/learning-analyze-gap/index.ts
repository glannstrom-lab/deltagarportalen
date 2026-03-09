// Edge Function: Mikro-Lärande Hub - Kompetensgap-analys
// Använder OpenRouter för AI-analys
// Analyserar användarens CV och identifierar saknade kompetenser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: object, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

interface CVData {
  skills: string[];
  workExperience: Array<{ title: string; description: string }>;
  education: Array<{ degree: string }>;
  personalInfo?: { desiredPosition?: string };
}

interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  title: string;
  description?: string;
}

interface SkillGap {
  skill: string;
  importance: 'critical' | 'high' | 'medium' | 'nice-to-have';
  demandLevel: 'very-high' | 'high' | 'medium' | 'low';
  rationale: string;
  estimatedLearningTime: string;
}

async function analyzeWithAI(cvData: CVData, targetRole?: string, jobRequirements?: JobRequirements): Promise<SkillGap[]> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!openRouterKey) {
    console.error('OPENROUTER_API_KEY missing');
    return generateFallbackAnalysis(cvData, targetRole);
  }

  const prompt = buildAnalysisPrompt(cvData, targetRole, jobRequirements);
  const model = Deno.env.get('AI_MODEL') || 'anthropic/claude-3.5-sonnet';

  console.log(`Analyzing skill gaps using model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `Du är en expert på arbetsmarknad och kompetensanalys för Sverige. 
Din uppgift är att analysera ett CV och identifiera vilka kompetenser som saknas för ett specifikt yrke.

Returnera alltid JSON i följande format:
{
  "skillGaps": [
    {
      "skill": "kompetensnamn på svenska",
      "importance": "critical|high|medium|nice-to-have",
      "demandLevel": "very-high|high|medium|low",
      "rationale": "förklaring på svenska varför detta behövs",
      "estimatedLearningTime": "tidsuppskattning t.ex. '2-4 veckor'"
    }
  ]
}

Viktigt:
- Fokusera på konkreta, mätbara kompetenser
- Prioritera kompetenser som nämns i många jobbannonser
- Anpassa svårighetsgrad efter användarens nuvarande nivå
- Var uppmuntrande men ärlig`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const result = JSON.parse(data.choices[0].message.content);
      return result.skillGaps || [];
    }
    
    throw new Error('Unexpected response format from OpenRouter');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('OpenRouter timeout');
    } else {
      console.error('AI analysis failed:', error);
    }
    return generateFallbackAnalysis(cvData, targetRole);
  }
}

function buildAnalysisPrompt(cvData: CVData, targetRole?: string, jobRequirements?: JobRequirements): string {
  let prompt = `ANALYSERA KOMPETENSGAP

ANVÄNDARENS CV:
`;

  if (cvData.skills?.length > 0) {
    prompt += `Kompetenser: ${cvData.skills.join(', ')}\n`;
  }

  if (cvData.workExperience?.length > 0) {
    prompt += `\nArbetslivserfarenhet:\n`;
    cvData.workExperience.forEach(exp => {
      prompt += `- ${exp.title}: ${exp.description?.substring(0, 200) || 'Ingen beskrivning'}\n`;
    });
  }

  if (cvData.education?.length > 0) {
    prompt += `\nUtbildning:\n`;
    cvData.education.forEach(edu => {
      prompt += `- ${edu.degree}\n`;
    });
  }

  if (targetRole) {
    prompt += `\nMÅLYRKE: ${targetRole}\n`;
  }

  if (jobRequirements) {
    prompt += `\nJOBBKRAV:\n`;
    prompt += `Titel: ${jobRequirements.title}\n`;
    if (jobRequirements.requiredSkills?.length > 0) {
      prompt += `Obligatoriska kompetenser: ${jobRequirements.requiredSkills.join(', ')}\n`;
    }
    if (jobRequirements.preferredSkills?.length > 0) {
      prompt += `Önskade kompetenser: ${jobRequirements.preferredSkills.join(', ')}\n`;
    }
    if (jobRequirements.description) {
      prompt += `Beskrivning: ${jobRequirements.description.substring(0, 500)}\n`;
    }
  }

  prompt += `\nIdentifiera de 5-8 viktigaste kompetenserna som användaren saknar eller behöver förbättra.`;

  return prompt;
}

function generateFallbackAnalysis(cvData: CVData, targetRole?: string): SkillGap[] {
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

  const existingSkills = new Set(cvData.skills?.map(s => s.toLowerCase()) || []);
  return commonGaps.filter(gap => !existingSkills.has(gap.skill.toLowerCase()));
}

async function createLearningPaths(
  supabase: any,
  userId: string,
  skillGaps: SkillGap[],
  source: string
): Promise<string[]> {
  const pathIds: string[] = [];

  for (const gap of skillGaps.slice(0, 5)) {
    const { data: existing } = await supabase
      .from('user_learning_paths')
      .select('id')
      .eq('user_id', userId)
      .eq('target_skill', gap.skill)
      .eq('status', 'ACTIVE')
      .single();

    if (existing) {
      pathIds.push(existing.id);
      continue;
    }

    let priority = 5;
    if (gap.importance === 'critical') priority = 10;
    else if (gap.importance === 'high') priority = 8;
    else if (gap.importance === 'medium') priority = 5;
    else priority = 3;

    const { data, error } = await supabase
      .from('user_learning_paths')
      .insert({
        user_id: userId,
        target_skill: gap.skill,
        skill_gap_source: source,
        priority: priority,
        status: 'ACTIVE'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create learning path:', error);
    } else {
      pathIds.push(data.id);
    }
  }

  return pathIds;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Skill gap analysis request started');

    const { cvData, targetRole, jobRequirements, source = 'CV_ANALYSIS' } = await req.json();

    if (!cvData) {
      return jsonResponse({ error: 'CV data is required' }, 400);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    console.log(`Analyzing gaps for user: ${user.id}, target: ${targetRole || 'general'}`);

    // Analyze skill gaps with AI
    const skillGaps = await analyzeWithAI(cvData, targetRole, jobRequirements);

    // Create learning paths for identified gaps
    const pathIds = await createLearningPaths(supabase, user.id, skillGaps, source);

    console.log(`Created ${pathIds.length} learning paths`);

    return jsonResponse({
      success: true,
      skillGaps,
      learningPathIds: pathIds,
      summary: {
        totalGaps: skillGaps.length,
        critical: skillGaps.filter(g => g.importance === 'critical').length,
        high: skillGaps.filter(g => g.importance === 'high').length
      }
    });

  } catch (error) {
    console.error('Error in learning-analyze-gap:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});
