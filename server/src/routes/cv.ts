import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Hämta CV
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let cv = await prisma.cV.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!cv) {
      cv = await prisma.cV.create({
        data: { userId: req.user!.id },
        include: { user: true },
      });
    }

    res.json(cv);
  } catch (error) {
    console.error('Fel vid hämtning av CV:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Uppdatera CV
router.put('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const cv = await prisma.cV.update({
      where: { userId: req.user!.id },
      data: req.body,
    });
    
    res.json(cv);
  } catch (error) {
    console.error('Fel vid uppdatering av CV:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// CV Versions
router.get('/versions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const versions = await prisma.cVVersion.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Serverfel' });
  }
});

router.post('/versions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const version = await prisma.cVVersion.create({
      data: {
        userId: req.user!.id,
        name: req.body.name,
        data: JSON.stringify(req.body.data),
      },
    });
    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Serverfel' });
  }
});

// ATS Analysis
router.get('/ats-analysis', authMiddleware, async (req: AuthRequest, res) => {
  res.json({
    score: 75,
    checks: [],
    suggestions: ['Fyll i ditt CV för att få en analys'],
  });
});

// Share
router.post('/share', authMiddleware, async (req: AuthRequest, res) => {
  res.json({ shareUrl: 'http://localhost/share/test', expiresAt: new Date() });
});

// Job matches
router.get('/job-matches', authMiddleware, async (req: AuthRequest, res) => {
  res.json([]);
});

// Analyze job
router.post('/analyze-job', authMiddleware, async (req: AuthRequest, res) => {
  res.json({
    matchPercentage: 75,
    matchingSkills: ['Kommunikation'],
    missingSkills: ['Python'],
    suggestions: ['Lyft fram dina styrkor'],
  });
});

export default router;
