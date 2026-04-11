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

    const systemPrompt = 'Du är karriärutvecklingsexpert. Skapa realistiska karriärplaner. Svara i JSON-format: {"steps":[{"order":1,"title":"","description":"","timeframe":"","actions":[],"education":[]}],"analysis":"","keySkills":[],"challenges":[]}';
    const userPrompt = `Skapa en karriärplan för:\n\nNuvarande yrke: ${data?.currentOccupation}\nErfarenhet: ${data?.experienceYears} år\nMålyrke: ${data?.targetOccupation}\nNuvarande lön: ${data?.currentSalary} kr/mån\nMållön: ${data?.targetSalary} kr/mån\nEfterfrågan: ${data?.demand === 'high' ? 'Hög' : data?.demand === 'medium' ? 'Medel' : 'Låg'}\n\nSkapa 4-5 konkreta steg. Svara ENDAST med JSON.`;

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
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) return res.status(502).json({ error: 'AI request failed' });

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'No response from AI' });

    // Parse JSON
    try {
      content = JSON.parse(content);
    } catch (e) {
      content = { raw: content, steps: [] };
    }

    return res.status(200).json({ success: true, plan: content });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
