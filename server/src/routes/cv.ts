import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Hämta användarens CV
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let cv = await prisma.cV.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!cv) {
      // Skapa tomt CV om det inte finns
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
    const {
      profileImage,
      title,
      email,
      phone,
      location,
      summary,
      workExperience,
      education,
      skills,
      languages,
    } = req.body;
    
    const cv = await prisma.cV.update({
      where: { userId: req.user!.id },
      data: {
        profileImage,
        title,
        email,
        phone,
        location,
        summary,
        workExperience,
        education,
        skills,
        languages,
      },
    });
    
    res.json(cv);
  } catch (error) {
    console.error('Fel vid uppdatering av CV:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// ATS-analys
router.get('/ats-analysis', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const cv = await prisma.cV.findUnique({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!cv) {
      // Returnera tomt resultat om CV inte finns ännu
      return res.json({
        score: 0,
        checks: [],
        suggestions: ['Börja med att fylla i ditt CV'],
      });
    }

    // Enkel ATS-analys
    const checks = [
      { name: 'Namn angivet', passed: !!(cv.user?.firstName && cv.user?.lastName) },
      { name: 'E-post angiven', passed: !!cv.email },
      { name: 'Profil sammanfattning', passed: !!(cv.summary && cv.summary.length > 50) },
      { name: 'Arbetslivserfarenhet', passed: !!(cv.workExperience && Array.isArray(cv.workExperience) && cv.workExperience.length > 0) },
      { name: 'Utbildning', passed: !!(cv.education && Array.isArray(cv.education) && cv.education.length > 0) },
      { name: 'Färdigheter', passed: !!(cv.skills && cv.skills.length > 0) },
    ];
    
    const passedChecks = checks.filter(c => c.passed).length;
    const score = Math.round((passedChecks / checks.length) * 100);
    
    const suggestions = [];
    if (!checks[2].passed) suggestions.push('Lägg till en sammanfattning på minst 50 tecken');
    if (!checks[3].passed) suggestions.push('Lägg till minst en arbetslivserfarenhet');
    if (!checks[4].passed) suggestions.push('Lägg till din utbildning');
    if (!checks[5].passed) suggestions.push('Lista dina färdigheter');
    
    res.json({
      score,
      checks,
      suggestions,
    });
  } catch (error) {
    console.error('Fel vid ATS-analys:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
