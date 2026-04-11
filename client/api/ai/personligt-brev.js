const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get request data
    const data = req.body.data || req.body;

    const ton = data.ton || data.tone || 'professionell';
    const tonText = ton === 'entusiastisk' ? 'entusiastisk och energisk'
                  : ton === 'formell' ? 'formell och traditionell'
                  : 'professionell och balanserad';

    let cvContext = '';
    if (data.cvData) {
      const cv = data.cvData;
      cvContext = `\nTitel: ${cv.title || 'Ej angiven'}`;
      cvContext += `\nSammanfattning: ${cv.summary || 'Ej angiven'}`;
      if (cv.workExperience?.length) {
        cvContext += `\nErfarenhet: ${cv.workExperience.map(e => e.title + ' på ' + e.company).join(', ')}`;
      }
      if (cv.skills?.length) {
        cvContext += `\nKompetenser: ${cv.skills.map(s => s.name).join(', ')}`;
      }
    }

    const jobbAnnons = data.jobbAnnons || data.jobDescription || '';

    const systemPrompt = `Du är en expert på personliga brev för jobbansökningar på svenska. Skriv med en ${tonText} ton. Brevet ska vara 250-350 ord. Analysera jobbannonsen och koppla kandidatens erfarenheter till kraven.`;

    const userPrompt = `Skriv ett personligt brev för:

FÖRETAG: ${data.companyName || 'Ej angivet'}
JOBBTITEL: ${data.jobTitle || 'Ej angiven'}

JOBBANNONS:
${jobbAnnons.substring(0, 3000)}

KANDIDATENS CV:${cvContext}
${data.erfarenhet ? 'Tidigare erfarenhet: ' + data.erfarenhet : ''}
${data.motivering ? 'Motivering: ' + data.motivering : ''}
${data.extraKeywords ? 'Nyckelord: ' + data.extraKeywords : ''}

Skriv det personliga brevet nu:`;

    // Call OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({ error: 'AI not configured' });
    }

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jobin.se',
        'X-Title': 'Jobin'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      console.error('OpenRouter error:', aiResponse.status);
      return res.status(502).json({ error: 'AI request failed' });
    }

    const aiData = await aiResponse.json();
    const brev = aiData.choices?.[0]?.message?.content;

    if (!brev) {
      return res.status(502).json({ error: 'No response from AI' });
    }

    return res.status(200).json({
      success: true,
      brev: brev,
      model: aiData.model
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
