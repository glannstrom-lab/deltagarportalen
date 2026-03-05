/**
 * Deltagarportalen - AI Backend Server
 * 
 * Denna server agerar proxy för OpenRouter API-anrop.
 * Syfte: Skydda API-nyckeln och hantera rate limiting.
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// CORS-konfiguration - tillåt endast specifika origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: function(origin, callback) {
    // Tillåt requests utan origin (t.ex. mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy: Denna origin är inte tillåten.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting - max 20 requests per 15 minuter per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 20, // max 20 requests
  message: {
    error: 'För många förfrågningar. Försök igen senare.'
  }
});

// Tillämpa rate limiting på AI-endpoints
app.use('/api/ai', limiter);

// Hämta konfigurerad modell från miljövariabel
const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

// Helper function for OpenRouter API calls
async function callOpenRouter(messages, options = {}) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.HTTP_REFERER || 'https://deltagarportalen.se',
      'X-Title': process.env.X_TITLE || 'Deltagarportalen'
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      max_tokens: options.max_tokens || 1000,
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

/**
 * POST /api/ai/cv-optimering
 * Optimerar CV-text med hjälp av AI
 */
app.post('/api/ai/cv-optimering', async (req, res) => {
  try {
    const { cvText, yrke } = req.body;
    
    if (!cvText || cvText.length < 50) {
      return res.status(400).json({
        error: 'CV-text måste vara minst 50 tecken'
      });
    }

    const messages = [
      {
        role: 'system',
        content: `Du är en expert på CV-skrivning för arbetssökande som vill tillbaka till arbetsmarknaden. 
Ditt mål är att ge konstruktiv feedback på CV:n och föreslå förbättringar.
Var uppmuntrande och konkret. Fokusera på styrkor, inte svagheter.
Svara på svenska med tydliga rubriker och punkter.`
      },
      {
        role: 'user',
        content: `Ge feedback på detta CV för yrket "${yrke || 'ospecificerat'}".

CV-TEXT:
${cvText}

Ge följande i ditt svar:
1. ÖVERGRIPANDE BEDÖMNING - en positiv sammanfattning av CV:ns styrkor
2. FÖRBÄTTRINGSFÖRSLAG - 3-5 konkreta förslag på förbättringar
3. SAKNAD INFORMATION - vad bör läggas till?
4. FRÅGOR ATT REFLECTERA ÖVER - 2-3 frågor som hjälper användaren tänka vidare`
      }
    ];

    const feedback = await callOpenRouter(messages, { max_tokens: 1500 });

    res.json({
      success: true,
      feedback,
      yrke: yrke || null
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Ett fel uppstod vid kommunikation med AI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/generera-cv-text
 * Genererar CV-text baserat på användarens input
 */
app.post('/api/ai/generera-cv-text', async (req, res) => {
  try {
    const { yrke, erfarenhet, utbildning, styrkor } = req.body;
    
    if (!yrke) {
      return res.status(400).json({
        error: 'Yrke måste anges'
      });
    }

    const messages = [
      {
        role: 'system',
        content: `Du är en expert på CV-skrivning. Din uppgift är att skriva professionella CV-textyer.
Skriv på svenska. Använd ett professionellt men personligt språk.
Fokusera på resultat och prestationer, inte bara arbetsuppgifter.`
      },
      {
        role: 'user',
        content: `Skriv en professionell CV-sammanfattning (3-4 meningar) för:

Yrke: ${yrke}
Tidigare erfarenhet: ${erfarenhet || 'Varierad arbetslivserfarenhet'}
Utbildning: ${utbildning || 'Ej specificerad'}
Styrkor: ${styrkor || 'Pålitlig, arbetsvillig, positiv'}

Texten ska:
- Vara professionell men personlig
- Lyfta fram relevanta erfarenheter
- Nämna 2-3 styrkor
- Vara max 4 meningar`
      }
    ];

    const cvText = await callOpenRouter(messages, { max_tokens: 500 });

    res.json({
      success: true,
      cvText,
      yrke
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera CV-text'
    });
  }
});

/**
 * POST /api/ai/personligt-brev
 * Genererar personligt brev
 */
app.post('/api/ai/personligt-brev', async (req, res) => {
  try {
    const { 
      jobbAnnons, 
      erfarenhet, 
      motivering, 
      namn,
      ton = 'professionell' // professionell, entusiastisk, formell
    } = req.body;
    
    if (!jobbAnnons || jobbAnnons.length < 50) {
      return res.status(400).json({
        error: 'Jobbannons måste vara minst 50 tecken'
      });
    }

    const tonInstructions = {
      professionell: ' professionell och balanserad',
      entusiastisk: ' entusiastisk och energisk',
      formell: ' formell och traditionell'
    };

    const messages = [
      {
        role: 'system',
        content: `Du är en expert på att skriva personliga brev för jobbansökningar.
Skriv på svenska med en${tonInstructions[ton] || tonInstructions.professionell} ton.
Brevet ska vara personligt, engagerande ochvisa varför just denna person passar för jobbet.`
      },
      {
        role: 'user',
        content: `Skriv ett personligt brev baserat på:

JOBBANNONS:
${jobbAnnons}

MIN BAKGRUND:
${erfarenhet || 'Varierad arbelslivserfarenhet'}

VARFÖR JAG VILL HA JOBBET:
${motivering || 'Jag söker nya utmaningar och vill utvecklas'}

${namn ? `Mitt namn: ${namn}` : ''}

Struktur:
1. Inledning - fånga intresset, nämn varför du söker jobbet
2. Kropp - koppla din erfarenhet till jobbets krav (2-3 stycken)
3. Avslutning - call-to-action, uttryck intresse för intervju

Max 300-400 ord. Professionellt men personligt.`
      }
    ];

    const brev = await callOpenRouter(messages, { max_tokens: 1200 });

    res.json({
      success: true,
      brev,
      ton
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera personligt brev'
    });
  }
});

/**
 * POST /api/ai/intervju-forberedelser
 * Genererar intervjuförberedelser
 */
app.post('/api/ai/intervju-forberedelser', async (req, res) => {
  try {
    const { 
      jobbTitel, 
      foretag, 
      erfarenhet,
      egenskaper 
    } = req.body;
    
    if (!jobbTitel) {
      return res.status(400).json({
        error: 'Jobbtitel måste anges'
      });
    }

    const messages = [
      {
        role: 'system',
        content: `Du är en erfaren jobbcoach som hjälper personer förbereda sig för anställningsintervjuer.
Ge konkreta, praktiska råd. Svara på svenska.`
      },
      {
        role: 'user',
        content: `Hjälp mig förbereda mig för en intervju som ${jobbTitel}${foretag ? ` på ${foretag}` : ''}.

MIN BAKGRUND:
${erfarenhet || 'Varierad erfarenhet'}

MINA STYRKOR:
${egenskaper || 'Pålitlig, samarbetsvillig, positiv'}

Ge följande:

1. TROLIGA INTERVJUFRÅGOR (5 frågor)
   Lista 5 vanliga frågor för denna roll

2. FÖRBEREDDA SVAR
   Ge förslag på hur jag kan svara på 3 av frågorna (använd STAR-metoden)

3. FRÅGOR ATT STÄLLA TILL ARBETSGIVAREN (3 frågor)
   Visa engagemang och intresse

4. TIPS FÖR INTERVJUN
   3-4 konkreta tips för att lyckas`
      }
    ];

    const forberedelser = await callOpenRouter(messages, { max_tokens: 2000 });

    res.json({
      success: true,
      forberedelser,
      jobbTitel,
      foretag
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera intervjuförberedelser'
    });
  }
});

/**
 * POST /api/ai/jobbtips
 * Ger personliga jobbsökartips
 */
app.post('/api/ai/jobbtips', async (req, res) => {
  try {
    const { intressen, tidigareErfarenhet, hinder, mal } = req.body;

    const messages = [
      {
        role: 'system',
        content: `Du är en empatisk jobbcoach som hjälper personer att hitta tillbaka till arbetsmarknaden.
Ge konkreta, uppmuntrande råd. Var realistisk men positiv.
Svara på svenska med tydliga rubriker.`
      },
      {
        role: 'user',
        content: `Ge personliga jobbsökartips baserat på:

Intressen: ${intressen || 'Ej angivet'}
Tidigare erfarenhet: ${tidigareErfarenhet || 'Ej angivet'}
Eventuella hinder: ${hinder || 'Ej angivet'}
Mål: ${mal || 'Hitta ett meningsfullt arbete'}

Ge:
1. UPPMUNTRAN - en positiv kommentar om personens bakgrund
2. NÄSTA STEG - 3 konkreta, genomförbara åtgärder
3. YRKEN ATT UTFORSKA - 3-5 förslag på yrken som kan passa
4. BEMÖTA HINDER - praktiska råd för att hantera eventuella hinder`
      }
    ];

    const tips = await callOpenRouter(messages, { max_tokens: 1200 });

    res.json({
      success: true,
      tips
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera tips'
    });
  }
});

/**
 * POST /api/ai/ovningshjalp
 * Hjälp med övningar - ger vägledning och exempel
 */
app.post('/api/ai/ovningshjalp', async (req, res) => {
  try {
    const { 
      ovningId, 
      steg, 
      fraga,
      anvandarSvar 
    } = req.body;

    const messages = [
      {
        role: 'system',
        content: `Du är en stöttande coach som hjälper användare med arbetsrelaterade övningar.
Ge konstruktiv vägledning, inte färdiga svar. Ställ följdfrågor som hjälper användaren tänka själv.
Svara på svenska. Var uppmuntrande och empatisk.`
      },
      {
        role: 'user',
        content: `Hjälp mig med denna övning:

Övning: ${ovningId}
Steg: ${steg}
Fråga: ${fraga}

${anvandarSvar ? `Mitt nuvarande svar: ${anvandarSvar}` : 'Jag har inte börjat än och behöver hjälp att komma igång.'}

Ge:
1. VÄGLEDNING - hur kan jag tänka kring denna fråga?
2. EXEMPEL - ett kort exempel (inte ett färdigt svar att kopiera)
3. FÖLJDFRÅGOR - 2-3 frågor som hjälper mig reflektera djupare`
      }
    ];

    const hjalp = await callOpenRouter(messages, { max_tokens: 1000 });

    res.json({
      success: true,
      hjalp,
      ovningId,
      steg
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera hjälp'
    });
  }
});

/**
 * POST /api/ai/loneforhandling
 * Hjälp med löneförhandling
 */
app.post('/api/ai/loneforhandling', async (req, res) => {
  try {
    const { 
      roll, 
      erfarenhetAr, 
      nuvarandeLon,
      foretagsStorlek,
      ort
    } = req.body;

    if (!roll) {
      return res.status(400).json({
        error: 'Roll måste anges'
      });
    }

    const messages = [
      {
        role: 'system',
        content: `Du är en erfaren löneexperkt och förhandlare. Du hjälper arbetssökande och anställda att förhandla lön.
Ge konkreta råd om lönenivåer och förhandlingsteknik. Svara på svenska.`
      },
      {
        role: 'user',
        content: `Hjälp mig förbereda en löneförhandling:

Roll: ${roll}
Erfarenhet: ${erfarenhetAr || '0'} år
${nuvarandeLon ? `Nuvarande lön: ${nuvarandeLon} kr/mån` : 'Nuvarande lön: Ej anställd'}
Företagsstorlek: ${foretagsStorlek || 'Medelstort'}
Ort: ${ort || 'Stockholm'}

Ge:
1. LÖNESpANN - Vad är rimligt för denna roll? (ange ett spann)
2. FÖRBEREDELSE - Hur ska jag förbereda mig inför samtalet?
3. ARGUMENT - Vilka argument kan jag använda?
4. FÖRMÅNER - Vilka andra förmåner kan jag förhandla om?
5. DIALOG - Ett exempel på hur samtalet kan gå`
      }
    ];

    const radgivning = await callOpenRouter(messages, { max_tokens: 1500 });

    res.json({
      success: true,
      radgivning,
      roll
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Kunde inte generera lönerådgivning'
    });
  }
});

// Lista över rekommenderade modeller
const RECOMMENDED_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Bra balans mellan kvalitet och pris', recommended: true },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Kraftfullaste modellen, dyrare', recommended: false },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'OpenAI:s senaste multimodella modell', recommended: false },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Billigare alternativ från OpenAI', recommended: false },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', description: 'OpenAI OSS-modell', recommended: false },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Snabb och prisvärd', recommended: false },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Open source-alternativ', recommended: false },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Meta:s öppna modell', recommended: false }
];

/**
 * GET /api/models
 * Lista tillgängliga modeller
 */
app.get('/api/models', (req, res) => {
  res.json({
    currentModel: DEFAULT_MODEL,
    models: RECOMMENDED_MODELS,
    note: 'För att byta modell, uppdatera AI_MODEL i .env-filen och starta om servern'
  });
});

/**
 * GET /api/config
 * Visa nuvarande konfiguration (utan känslig data)
 */
app.get('/api/config', (req, res) => {
  res.json({
    model: DEFAULT_MODEL,
    modelInfo: RECOMMENDED_MODELS.find(m => m.id === DEFAULT_MODEL) || { id: DEFAULT_MODEL, name: DEFAULT_MODEL },
    port: PORT,
    rateLimit: {
      windowMs: '15 minuter',
      max: 20
    },
    endpoints: [
      '/api/ai/cv-optimering',
      '/api/ai/generera-cv-text',
      '/api/ai/personligt-brev',
      '/api/ai/intervju-forberedelser',
      '/api/ai/jobbtips',
      '/api/ai/ovningshjalp',
      '/api/ai/loneforhandling'
    ]
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    model: DEFAULT_MODEL,
    modelConfigured: !!process.env.AI_MODEL,
    endpoints: [
      '/api/ai/cv-optimering',
      '/api/ai/generera-cv-text',
      '/api/ai/personligt-brev',
      '/api/ai/intervju-forberedelser',
      '/api/ai/jobbtips',
      '/api/ai/ovningshjalp',
      '/api/ai/loneforhandling'
    ]
  });
});

/**
 * POST /api/ai/linkedin-optimering
 * Hjälp med LinkedIn-profil
 */
app.post('/api/ai/linkedin-optimering', async (req, res) => {
  try {
    const { typ, data } = req.body;
    // typ: 'headline', 'about', 'post', 'connection'
    
    let prompt = '';
    switch(typ) {
      case 'headline':
        prompt = `Skriv en catchy LinkedIn-headline (max 220 tecken) för: ${data.yrke}. Erfarenhet: ${data.erfarenhet}.`;
        break;
      case 'about':
        prompt = `Skriv en "About"-sektion för LinkedIn (max 2000 tecken). Bakgrund: ${data.bakgrund}. Styrkor: ${data.styrkor}.`;
        break;
      case 'post':
        prompt = `Skriv ett LinkedIn-inlägg om ${data.amne}. Ton: ${data.ton || 'professionell'}. Max 1300 tecken.`;
        break;
      case 'connection':
        prompt = `Skriv ett meddelande till en ny LinkedIn-kontakt. Person: ${data.namn}. Syfte: ${data.syfte}.`;
        break;
      default:
        return res.status(400).json({ error: 'Ogiltig typ' });
    }

    const messages = [
      { role: 'system', content: 'Du är en expert på LinkedIn och personlig branding. Skriv på svenska.' },
      { role: 'user', content: prompt }
    ];

    const text = await callOpenRouter(messages, { max_tokens: 800 });
    res.json({ success: true, text, typ });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte generera LinkedIn-text' });
  }
});

/**
 * POST /api/ai/karriarplan
 * Skapa karriärplan med AI
 */
app.post('/api/ai/karriarplan', async (req, res) => {
  try {
    const { nuvarande, mal, tidsram, hinder } = req.body;
    
    const messages = [
      { role: 'system', content: `Du är en karriärcoach som hjälper till att skapa strukturerade karriärplaner.
Svara på svenska med tydliga steg och tidslinjer.` },
      { role: 'user', content: `Skapa en karriärplan:

NUVARANDE SITUATION:
${nuvarande}

MÅL:
${mal}

TIDSPLAN: ${tidsram || '6-12 månader'}
HINDER: ${hinder || 'Inga specifika'}

Ge:
1. ÖVERBLICK - Sammanfattning av vägen från A till B
2. DELMÅL - 3-5 konkreta delmål med tidsram
3. HANDLINGAR - Vad behöver göras för varje delmål
4. RESURSER - Vilka verktyg/utbildningar kan hjälpa
5. BEMÖTA HINDER - Strategier för eventuella hinder` }
    ];

    const plan = await callOpenRouter(messages, { max_tokens: 2000 });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte skapa karriärplan' });
  }
});

/**
 * POST /api/ai/kompetensgap
 * Analysera kompetensgap
 */
app.post('/api/ai/kompetensgap', async (req, res) => {
  try {
    const { cvText, drömjobb } = req.body;
    
    const messages = [
      { role: 'system', content: `Du är en rekryteringsexpert som analyserar kompetensgap.
Svara på svenska med konstruktiv feedback.` },
      { role: 'user', content: `Analysera kompetensgap:

DRÖMJOBB:
${drömjobb}

NUVARANDE CV:
${cvText}

Ge:
1. MATCHNING - Procentuell match (0-100%)
2. SAKNADE KOMPETENSER - Vad saknas för rollen?
3. STYRKOR - Vad har användaren redan?
4. UTVECKLINGSOMRÅDEN - Prioriterad lista på vad som behöver utvecklas
5. REKOMMENDATIONER - Konkreta nästa steg för att täcka gapen` }
    ];

    const analys = await callOpenRouter(messages, { max_tokens: 1500 });
    res.json({ success: true, analys });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte analysera kompetensgap' });
  }
});

/**
 * POST /api/ai/ansokningscoach
 * Hjälp med ansökning i realtid
 */
app.post('/api/ai/ansokningscoach', async (req, res) => {
  try {
    const { text, jobbannons, typ } = req.body;
    // typ: 'feedback', 'forbattra', 'kontrollera'
    
    let prompt = '';
    switch(typ) {
      case 'feedback':
        prompt = `Ge feedback på denna ansökningstext för jobbet:\n\nJOBB:\n${jobbannons}\n\nTEXT:\n${text}\n\nVad är bra? Vad kan förbättras?`;
        break;
      case 'forbattra':
        prompt = `Förbättra denna ansökningstext:\n\n${text}\n\nGör den mer övertygande och personlig.`;
        break;
      case 'kontrollera':
        prompt = `Kontrollera denna ansökning:\n\n${text}\n\nLista stavfel, grammatikfel och förbättringsförslag.`;
        break;
    }

    const messages = [
      { role: 'system', content: 'Du är en erfaren rekryterare som hjälper till med ansökningar. Svara på svenska.' },
      { role: 'user', content: prompt }
    ];

    const resultat = await callOpenRouter(messages, { max_tokens: 1000 });
    res.json({ success: true, resultat, typ });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte ge coachning' });
  }
});

/**
 * POST /api/ai/intervju-simulator
 * Simulerad intervju med AI
 */
app.post('/api/ai/intervju-simulator', async (req, res) => {
  try {
    const { roll, foretag, anvandarSvar, tidigareFragor = [] } = req.body;
    
    const messages = [
      { role: 'system', content: `Du är en intervjuare för ${roll} på ${foretag}.
Du ska ställa realistiska intervjufrågor och ge feedback på svaren.
Svara på svenska.` },
      { role: 'user', content: tidigareFragor.length === 0 
        ? `Starta intervjun för ${roll}. Ställ din första fråga.`
        : `Tidigare frågor och svar:\n${tidigareFragor.map(f => `F: ${f.frag}\nS: ${f.svar}`).join('\n\n')}\n\nAnvändaren svarade: "${anvandarSvar}"\n\nGe kort feedback på svaret och ställ nästa fråga.` 
      }
    ];

    const resultat = await callOpenRouter(messages, { max_tokens: 800 });
    res.json({ success: true, resultat });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte simulera intervju' });
  }
});

/**
 * POST /api/ai/mentalt-stod
 * Motivationsboost och stöd
 */
app.post('/api/ai/mentalt-stod', async (req, res) => {
  try {
    const { situation, kansla } = req.body;
    
    const messages = [
      { role: 'system', content: `Du är en empatisk jobbcoach som ger mentalt stöd.
Var vänlig, uppmuntrande och konkret. Svara på svenska.` },
      { role: 'user', content: `Ge mentalt stöd:

SITUATION: ${situation}
KÄNSLA: ${kansla}

Ge:
1. VALIDERING - Bekräfta känslan
2. PERSPEKTIV - Hjälp att se situationen annorlunda
3. HANDLING - Ett konkret nästa steg
4. PPMUNTRAN - Avsluta med något positivt` }
    ];

    const stod = await callOpenRouter(messages, { max_tokens: 800 });
    res.json({ success: true, stod });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte generera stöd' });
  }
});

/**
 * POST /api/ai/natverkande
 * Hjälp med nätverkande
 */
app.post('/api/ai/natverkande', async (req, res) => {
  try {
    const { typ, data } = req.body;
    // typ: 'kontakt', 'foljupp', 'informational', 'tack'
    
    let prompt = '';
    switch(typ) {
      case 'kontakt':
        prompt = `Skriv ett LinkedIn-meddelande till ${data.namn} (${data.roll}). Syfte: ${data.syfte}.`;
        break;
      case 'foljupp':
        prompt = `Skriv ett uppföljningsmail efter ansökan till ${data.foretag}. Det har gått ${data.tid}.`;
        break;
      case 'informational':
        prompt = `Be om ett informational interview med ${data.namn}. Jag är intresserad av deras roll som ${data.roll}.`;
        break;
      case 'tack':
        prompt = `Skriv ett tackmail efter intervju på ${data.foretag} för rollen ${data.roll}.`;
        break;
    }

    const messages = [
      { role: 'system', content: 'Du är expert på professionellt nätverkande. Skriv kortfattat på svenska.' },
      { role: 'user', content: prompt }
    ];

    const text = await callOpenRouter(messages, { max_tokens: 600 });
    res.json({ success: true, text, typ });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte generera nätverkstext' });
  }
});

/**
 * POST /api/ai/chatbot
 * Allmän karriär-chatbot
 */
app.post('/api/ai/chatbot', async (req, res) => {
  try {
    const { meddelande, historik = [] } = req.body;
    
    const messages = [
      { 
        role: 'system', 
        content: `Du är Deltagarportalens AI-karriärcoach.
Du hjälper arbetssökande med allt från CV och ansökningar till motivation och strategi.
Var empatisk, konkret och uppmuntrande. Svara på svenska.

Du kan hjälpa med:
- CV-skrivning och optimering
- Personliga brev
- Intervjuförberedelser
- Löneförhandling
- LinkedIn-profiler
- Jobbsökningsstrategi
- Motivation och mentalt stöd

Håll svaren korta (max 3-4 meningar) om inte användaren ber om mer detaljer.` 
      },
      ...historik.map(h => ({ role: h.roll, content: h.innehall })),
      { role: 'user', content: meddelande }
    ];

    const svar = await callOpenRouter(messages, { max_tokens: 800 });
    res.json({ success: true, svar });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Kunde inte generera svar' });
  }
});

// Starta servern
app.listen(PORT, () => {
  console.log(`🚀 AI-servern kör på port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Modell: ${DEFAULT_MODEL}`);
  console.log(`🔑 OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'Konfigurerad ✓' : 'SAKNAS ✗'}`);
  console.log('');
  console.log('Tillgängliga endpoints:');
  console.log('  GET  /api/health     - Health check');
  console.log('  GET  /api/models     - Lista modeller');
  console.log('  GET  /api/config     - Visa konfiguration');
  console.log('  POST /api/ai/*       - AI-funktioner');
});
