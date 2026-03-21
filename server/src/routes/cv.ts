import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeObject } from '../utils/sanitize';

const router = Router();

// Validering för CV-uppdatering (partiellt schema - alla fält valfria)
const cvUpdateSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  title: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  linkedIn: z.string().url().max(500).optional().or(z.literal('')),
  website: z.string().url().max(500).optional().or(z.literal('')),
  profileImage: z.string().max(1000).optional(),
  template: z.enum(['modern', 'classic', 'minimal', 'creative']).optional(),
  colorScheme: z.string().max(50).optional(),
  workExperience: z.array(z.object({
    id: z.string().optional(),
    title: z.string().max(200),
    company: z.string().max(200),
    location: z.string().max(200).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().max(2000).optional(),
  })).max(20).optional(),
  education: z.array(z.object({
    id: z.string().optional(),
    degree: z.string().max(200),
    field: z.string().max(200).optional(),
    school: z.string().max(200),
    location: z.string().max(200).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().max(1000).optional(),
  })).max(10).optional(),
  skills: z.array(z.object({
    id: z.string().optional(),
    name: z.string().max(100),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    category: z.string().max(100).optional(),
  })).max(30).optional(),
  languages: z.array(z.object({
    id: z.string().optional(),
    name: z.string().max(50),
    level: z.string().max(50).optional(),
  })).max(10).optional(),
  certifications: z.array(z.object({
    id: z.string().optional(),
    name: z.string().max(200),
    issuer: z.string().max(200).optional(),
    date: z.string().optional(),
    url: z.string().url().max(500).optional().or(z.literal('')),
  })).max(10).optional(),
}).strict(); // Tillåt endast definierade fält

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
    // Validera indata mot schema
    const parseResult = cvUpdateSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Ogiltig data',
        details: parseResult.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }))
      });
    }

    // Sanera all strängdata från potentiell XSS
    const sanitizedData = sanitizeObject(parseResult.data);

    const cv = await prisma.cV.update({
      where: { userId: req.user!.id },
      data: sanitizedData,
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

// Validering för CV-version
const cvVersionSchema = z.object({
  name: z.string().min(1).max(100),
  data: z.record(z.unknown()), // Accepterar objekt, valideras vid laddning
});

router.post('/versions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parseResult = cvVersionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Ogiltig data' });
    }

    const sanitizedName = sanitizeObject(parseResult.data.name);

    const version = await prisma.cVVersion.create({
      data: {
        userId: req.user!.id,
        name: sanitizedName,
        data: JSON.stringify(parseResult.data.data),
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
