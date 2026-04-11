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

    const systemPrompt = 'Du är en erfaren jobbcoach som hjälper personer förbereda sig för anställningsintervjuer. Ge konkreta, praktiska råd på svenska.';
    const userPrompt = `Hjälp mig förbereda mig för en intervju som ${data?.jobbTitel || 'kandidat'}${data?.foretag ? ' på ' + data.foretag : ''}.\n\nMin bakgrund: ${data?.erfarenhet || 'Varierad erfarenhet'}\nMina styrkor: ${data?.egenskaper || 'Pålitlig, samarbetsvillig, positiv'}\n\nGe följande:\n1. TROLIGA INTERVJUFRÅGOR - 5 vanliga frågor\n2. FÖRBEREDDA SVAR - förslag på svar med STAR-metoden\n3. FRÅGOR ATT STÄLLA - 3 frågor till arbetsgivaren\n4. TIPS FÖR INTERVJUN - 3-4 konkreta tips`;

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
        max_tokens: 2000,
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
