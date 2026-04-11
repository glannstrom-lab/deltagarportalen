const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const data = req.body.data || req.body;

    const systemPrompt = 'Du är en erfaren löneexpert och förhandlare. Ge konkreta råd om lönenivåer och förhandlingsteknik på svenska.';
    const userPrompt = `Hjälp mig förbereda en löneförhandling:\n\nRoll: ${data?.roll}\nErfarenhet: ${data?.erfarenhetAr || 0} år\n${data?.nuvarandeLon ? 'Nuvarande lön: ' + data.nuvarandeLon + ' kr/mån' : 'Nuvarande lön: Ej anställd'}\nFöretagsstorlek: ${data?.foretagsStorlek || 'Medelstort'}\nOrt: ${data?.ort || 'Stockholm'}\n\nGe:\n1. LÖNESPANN - vad är rimligt?\n2. FÖRBEREDELSE - hur förbereder jag mig?\n3. ARGUMENT - vilka argument kan jag använda?\n4. FÖRMÅNER - andra saker att förhandla om\n5. DIALOG - exempel på hur samtalet kan gå`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    if (!aiResponse.ok) return res.status(502).json({ error: 'AI request failed' });

    const aiData = await aiResponse.json();
    const result = aiData.choices?.[0]?.message?.content;
    if (!result) return res.status(502).json({ error: 'No response from AI' });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
