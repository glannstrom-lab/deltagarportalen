/**
 * 🤖 Deltagarportalen - AI Backend Server
 * 
 * Denna server hanterar AI-funktioner via OpenRouter API.
 * Hostas på Render, Railway eller liknande.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS - tillåt frontend att kommunicera
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Konfiguration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY saknas! Se .env.example');
  process.exit(1);
}

/**
 * 📝 CV-optimering
 * POST /api/cv-optimering
 */
app.post('/api/cv-optimering', async (req, res) => {
  try {
    const { cvText, yrke } = req.body;

    // Validering
    if (!cvText || cvText.length < 30) {
      return res.status(400).json({
        error: 'CV-text måste vara minst 30 tecken'
      });
    }

    console.log('📝 Bearbetar CV för:', yrke || 'ospecificerat yrke');

    // Anropa OpenRouter
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `Du är en erfaren CV-expert och jobbcoach som specialiserar sig på att hjälpa människor tillbaka till arbetsmarknaden.

Dina principer:
- Var uppmuntrande och positiv
- Fokusera på styrkor och möjligheter
- Ge konkreta, handlingsbara råd
- Var respektfull och icke-dömande
- Svara alltid på svenska

Strukturera ditt svar med:
1. 🌟 Övergripande styrkor (vad som redan är bra)
2. 💡 3 konkreta förbättringsförslag
3. 🎯 Nästa steg (vad personen kan göra idag)`
          },
          {
            role: 'user',
            content: `Ge feedback på detta CV${yrke ? ` för yrket "${yrke}"` : ''}:

${cvText}`
          }
        ],
        max_tokens: 1200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      throw new Error('Kunde inte kommunicera med AI-tjänsten');
    }

    const data = await response.json();
    
    res.json({
      success: true,
      feedback: data.choices[0].message.content,
      model: data.model
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Ett fel uppstod vid bearbetning',
      message: error.message
    });
  }
});

/**
 * 💼 Jobbcoach-råd
 * POST /api/coach-rad
 */
app.post('/api/coach-rad', async (req, res) => {
  try {
    const { situation, fråga } = req.body;

    if (!situation || situation.length < 10) {
      return res.status(400).json({
        error: 'Beskriv din situation (minst 10 tecken)'
      });
    }

    console.log('💼 Ger coach-råd för situation');

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `Du är en empatisk och erfaren jobbcoach som hjälper personer att navigera arbetsmarknaden.

Din roll:
- Lyssna och förstå personens situation
- Ge uppmuntran och hopp
- Erbjuda konkreta, realistiska råd
- Hjälpa personen se sina styrkor
- Svara på svenska

Håll svaret kort (max 300 ord) och fokuserat.`
          },
          {
            role: 'user',
            content: `Min situation: ${situation}

${fråga ? `Min fråga: ${fråga}` : 'Vad bör jag göra härnäst?'}`
          }
        ],
        max_tokens: 600,
        temperature: 0.8
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      råd: data.choices[0].message.content
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera råd'
    });
  }
});

/**
 * 🏥 Arbetsanpassnings-stöd
 * POST /api/anpassning
 */
app.post('/api/anpassning', async (req, res) => {
  try {
    const { begränsning, arbetsuppgifter } = req.body;

    if (!begränsning || !arbetsuppgifter) {
      return res.status(400).json({
        error: 'Ange både begränsning och arbetsuppgifter'
      });
    }

    console.log('🏥 Föreslår arbetsanpassning');

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deltagarportalen.se',
        'X-Title': 'Deltagarportalen'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `Du är arbetsterapeut med expertis på arbetsanpassning.

Ge förslag på:
1. Organisatoriska anpassningar (arbetstider, pauser, uppgiftsfördelning)
2. Fysiska/tekniska anpassningar (utrustning, arbetsmiljö)
3. Stödja insatser (stödperson, arbetsledning)

Var konkret och realistisk. Svara på svenska.`
          },
          {
            role: 'user',
            content: `Begränsning/funktionsnedsättning: ${begränsning}

Arbetsuppgifter: ${arbetsuppgifter}

Föreslå konkreta anpassningar:`
          }
        ],
        max_tokens: 800,
        temperature: 0.6
      })
    });

    const data = await response.json();

    res.json({
      success: true,
      anpassningar: data.choices[0].message.content
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera förslag'
    });
  }
});

/**
 * ✅ Health check
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: '✅ OK',
    service: 'Deltagarportalen AI',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * 🏠 Root
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    message: '🤖 Deltagarportalen AI Backend',
    endpoints: {
      'CV-optimering': 'POST /api/cv-optimering',
      'Coach-råd': 'POST /api/coach-rad',
      'Arbetsanpassning': 'POST /api/anpassning',
      'Health': 'GET /api/health'
    },
    docs: 'Se README.md för mer information'
  });
});

// Starta servern
app.listen(PORT, () => {
  console.log('🚀 AI-servern är igång!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Tillgängliga endpoints:');
  console.log('  POST /api/cv-optimering');
  console.log('  POST /api/coach-rad');
  console.log('  POST /api/anpassning');
  console.log('');
});
