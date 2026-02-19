import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Hämta användarens intresseguide-resultat
router.get('/result', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await prisma.interestResult.findUnique({
      where: { userId: req.user!.id },
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Inget resultat hittades' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Fel vid hämtning av resultat:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Spara intresseguide-resultat
router.post('/result', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      realistic,
      investigative,
      artistic,
      social,
      enterprising,
      conventional,
      hollandCode,
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism,
      physicalRequirements,
      recommendedJobs,
    } = req.body;
    
    const result = await prisma.interestResult.upsert({
      where: { userId: req.user!.id },
      update: {
        realistic,
        investigative,
        artistic,
        social,
        enterprising,
        conventional,
        hollandCode,
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        physicalRequirements,
        recommendedJobs,
      },
      create: {
        userId: req.user!.id,
        realistic,
        investigative,
        artistic,
        social,
        enterprising,
        conventional,
        hollandCode,
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        physicalRequirements,
        recommendedJobs,
      },
    });
    
    res.json(result);
  } catch (error) {
    console.error('Fel vid sparande av resultat:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Hämta frågor för intresseguiden
router.get('/questions', async (req, res) => {
  // RIASEC-frågor
  const riasecQuestions = [
    { id: 'r1', category: 'realistic', text: 'Jag gillar att arbeta praktiskt med händerna', type: 'riasec' },
    { id: 'r2', category: 'realistic', text: 'Jag tycker om att reparera saker', type: 'riasec' },
    { id: 'r3', category: 'realistic', text: 'Jag föredrar att se konkreta resultat av mitt arbete', type: 'riasec' },
    { id: 'i1', category: 'investigative', text: 'Jag gillar att lösa komplexa problem', type: 'riasec' },
    { id: 'i2', category: 'investigative', text: 'Jag är nyfiken på hur saker fungerar', type: 'riasec' },
    { id: 'i3', category: 'investigative', text: 'Jag tycker om att analysera data', type: 'riasec' },
    { id: 'a1', category: 'artistic', text: 'Jag tycker om att vara kreativ', type: 'riasec' },
    { id: 'a2', category: 'artistic', text: 'Jag uppskattar konst och estetik', type: 'riasec' },
    { id: 'a3', category: 'artistic', text: 'Jag gillar att uttrycka mig fritt', type: 'riasec' },
    { id: 's1', category: 'social', text: 'Jag tycker om att hjälpa andra', type: 'riasec' },
    { id: 's2', category: 'social', text: 'Jag är en bra lyssnare', type: 'riasec' },
    { id: 's3', category: 'social', text: 'Jag trivs i sociala sammanhang', type: 'riasec' },
    { id: 'e1', category: 'enterprising', text: 'Jag gillar att leda och påverka', type: 'riasec' },
    { id: 'e2', category: 'enterprising', text: 'Jag är bra på att övertyga andra', type: 'riasec' },
    { id: 'e3', category: 'enterprising', text: 'Jag tycker om att ta risker', type: 'riasec' },
    { id: 'c1', category: 'conventional', text: 'Jag gillar ordning och struktur', type: 'riasec' },
    { id: 'c2', category: 'conventional', text: 'Jag är noggrann med detaljer', type: 'riasec' },
    { id: 'c3', category: 'conventional', text: 'Jag föredrar tydliga instruktioner', type: 'riasec' },
  ];
  
  // Big Five-frågor (förenklade)
  const bigFiveQuestions = [
    { id: 'bf1', category: 'openness', text: 'Jag har en livlig fantasi', type: 'bigfive' },
    { id: 'bf2', category: 'openness', text: 'Jag är intresserad av abstrakta idéer', type: 'bigfive' },
    { id: 'bf3', category: 'conscientiousness', text: 'Jag är alltid förberedd', type: 'bigfive' },
    { id: 'bf4', category: 'conscientiousness', text: 'Jag uppmärksammar detaljer', type: 'bigfive' },
    { id: 'bf5', category: 'extraversion', text: 'Jag är den som startar konversationer', type: 'bigfive' },
    { id: 'bf6', category: 'extraversion', text: 'Jag känner mig energisk i stora grupper', type: 'bigfive' },
    { id: 'bf7', category: 'agreeableness', text: 'Jag bryr mig om andras känslor', type: 'bigfive' },
    { id: 'bf8', category: 'agreeableness', text: 'Jag litar på andra människor', type: 'bigfive' },
    { id: 'bf9', category: 'neuroticism', text: 'Jag blir lätt stressad', type: 'bigfive' },
    { id: 'bf10', category: 'neuroticism', text: 'Jag oroar mig mycket', type: 'bigfive' },
  ];
  
  // Fysiska krav / ICF
  const physicalQuestions = [
    { id: 'ph1', category: 'mobility', text: 'Jag kan utan problem stå och gå under hela arbetsdagen', type: 'physical' },
    { id: 'ph2', category: 'lifting', text: 'Jag kan lytta tyngre föremål (över 10 kg)', type: 'physical' },
    { id: 'ph3', category: 'vision', text: 'Jag har god syn (eventuellt med glasögon)', type: 'physical' },
    { id: 'ph4', category: 'hearing', text: 'Jag har god hörsel', type: 'physical' },
    { id: 'ph5', category: 'communication', text: 'Jag kan kommunicera verbalt utan svårigheter', type: 'physical' },
    { id: 'ph6', category: 'fine_motor', text: 'Jag har bra finmotorik (t.ex. skriva, använda verktyg)', type: 'physical' },
  ];
  
  res.json({
    riasec: riasecQuestions,
    bigFive: bigFiveQuestions,
    physical: physicalQuestions,
  });
});

// Yrkesrekommendationer baserat på Holland-kod
router.post('/recommendations', async (req, res) => {
  const { hollandCode } = req.body;
  
  const jobDatabase: Record<string, string[]> = {
    'RIA': ['Maskiningenjör', 'Tekniker', 'Pilot', 'Mekaniker'],
    'RIS': ['Fysioterapeut', 'Sjuksköterska', 'Brandman', 'Polis'],
    'RAE': ['Arkitekt', 'Produktionschef', 'Byggledare'],
    'IAS': ['Psykolog', 'Lärare', 'Forskare', 'Dataanalytiker'],
    'IAR': ['Läkare', 'Apotekare', 'Biokemist'],
    'ISE': ['HR-specialist', 'Konsult', 'Projektledare'],
    'ASE': ['Journalist', 'PR-specialist', 'Eventkoordinator'],
    'AES': ['Konstnär', 'Skådespelare', 'Musiker', 'Fotograf'],
    'SAE': ['Socialarbetare', 'Lärare', 'Vårdare', 'Kurator'],
    'SIA': ['Psykolog', 'Sociolog', 'Vägledare'],
    'ECR': ['Revisor', 'Controller', 'Banktjänsteman'],
    'ECS': ['Administratör', 'Kundtjänst', 'Receptionist'],
    'ECA': ['Grafisk designer', 'Webbdesigner', 'Inredare'],
  };
  
  const recommendations = jobDatabase[hollandCode] || ['Kundtjänstmedarbetare', 'Administratör', 'Säljare'];
  
  res.json({ recommendations });
});

export default router;
