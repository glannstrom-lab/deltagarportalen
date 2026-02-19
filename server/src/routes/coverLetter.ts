import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Hämta alla personliga brev
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const letters = await prisma.coverLetter.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(letters);
  } catch (error) {
    console.error('Fel vid hämtning av brev:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Skapa nytt personligt brev
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, jobAd, content } = req.body;
    
    const letter = await prisma.coverLetter.create({
      data: {
        userId: req.user!.id,
        title,
        jobAd,
        content,
      },
    });
    
    res.status(201).json(letter);
  } catch (error) {
    console.error('Fel vid skapande av brev:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Uppdatera brev
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, jobAd, content } = req.body;
    
    const letter = await prisma.coverLetter.updateMany({
      where: { id, userId: req.user!.id },
      data: { title, jobAd, content },
    });
    
    if (letter.count === 0) {
      return res.status(404).json({ error: 'Brev hittades inte' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Fel vid uppdatering av brev:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Ta bort brev
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await prisma.coverLetter.deleteMany({
      where: { id, userId: req.user!.id },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Fel vid borttagning av brev:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// AI-generering (mock för nu)
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { jobAd, styleReference } = req.body;
    
    // Mock-generering - i produktion skulle detta anropa en AI-tjänst
    const generatedContent = genereraPersonligtBrev(jobAd, styleReference);
    
    res.json({ content: generatedContent });
  } catch (error) {
    console.error('Fel vid generering:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

function genereraPersonligtBrev(jobAd: string, styleReference?: string): string {
  // Enkel mock-generering
  return `Hej!

Jag skriver med stort intresse angående den utannonserade tjänsten. Efter att ha läst er beskrivning känner jag att mina erfarenheter och kompetenser stämmer väl överens med vad ni söker.

[Jobbannonsen nämner: ${jobAd.substring(0, 100)}...]

Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ert team.

Med vänliga hälsningar,
[Ditt namn]`;
}

export default router;
