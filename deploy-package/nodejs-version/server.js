/**
 * 🤖 Deltagarportalen med AI
 * Komplett server med både backend och frontend
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Servera frontend-filer

// API-nyckel
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error('❌ OPENROUTER_API_KEY saknas! Skapa .env-fil');
  process.exit(1);
}

/**
 * 🔍 Hjälpfunktion för AI-anrop
 */
async function callAI(systemPrompt, userPrompt, maxTokens = 1000) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://deltagarportalen.se',
      'X-Title': 'Deltagarportalen'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('AI-tjänsten svarade inte');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 📝 CV-optimering
 */
app.post('/api/cv-optimering', async (req, res) => {
  try {
    const { cvText, yrke } = req.body;
    
    if (!cvText || cvText.length < 30) {
      return res.status(400).json({ error: 'För kort CV-text' });
    }

    const system = `Du är en empatisk CV-expert som hjälper personer tillbaka till arbetsmarknaden. 
Var uppmuntrande, konkret och fokusera på styrkor.
Svara på svenska med dessa rubriker:
🌟 Styrkor
💡 Förbättringsförslag  
🎯 Nästa steg`;

    const user = `Ge feedback på detta CV${yrke ? ` för ${yrke}` : ''}:\n\n${cvText}`;
    
    const feedback = await callAI(system, user, 1200);
    
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte bearbeta CV' });
  }
});

/**
 * 💼 Jobbcoach-råd
 */
app.post('/api/coach-rad', async (req, res) => {
  try {
    const { situation, fråga } = req.body;
    
    if (!situation) {
      return res.status(400).json({ error: 'Beskriv situationen' });
    }

    const system = `Du är en erfaren jobbcoach. Ge kort, uppmuntrande och konkret råd.
Svara på svenska (max 300 ord).`;

    const user = `Situation: ${situation}\nFråga: ${fråga || 'Vad bör jag göra?'}`;
    
    const råd = await callAI(system, user, 600);
    
    res.json({ success: true, råd });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte ge råd' });
  }
});

/**
 * 🏥 Arbetsanpassning
 */
app.post('/api/anpassning', async (req, res) => {
  try {
    const { begränsning, arbetsuppgifter } = req.body;
    
    if (!begränsning || !arbetsuppgifter) {
      return res.status(400).json({ error: 'Fyll i alla fält' });
    }

    const system = `Du är arbetsterapeut. Föreslå konkreta arbetsanpassningar.
Kategorisera som: Organisatoriska, Fysiska/tekniska, Stödjande.
Svara på svenska.`;

    const user = `Begränsning: ${begränsning}\nArbetsuppgifter: ${arbetsuppgifter}\n\nFöreslå anpassningar:`;
    
    const anpassningar = await callAI(system, user, 800);
    
    res.json({ success: true, anpassningar });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte ge förslag' });
  }
});

/**
 * ✅ Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// Starta servern
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════╗');
  console.log('║  🤖 Deltagarportalen med AI       ║');
  console.log('╠════════════════════════════════════╣');
  console.log(`║  🌐 http://localhost:${PORT}          ║`);
  console.log('╚════════════════════════════════════╝');
});
