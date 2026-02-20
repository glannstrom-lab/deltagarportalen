import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeHtml, validateLength, MAX_LENGTHS } from '../utils/sanitize';

const router = Router();

// Hjälpfunktion för att sanera CV-fält
function sanitizeCvData(data: any) {
  return {
    profileImage: data.profileImage || null, // URL, saneras separat om nödvändigt
    title: validateLength(sanitizeHtml(data.title), MAX_LENGTHS.title, 'Titel'),
    email: validateLength(sanitizeHtml(data.email), MAX_LENGTHS.email, 'E-post'),
    phone: validateLength(sanitizeHtml(data.phone), MAX_LENGTHS.phone, 'Telefon'),
    location: validateLength(sanitizeHtml(data.location), MAX_LENGTHS.location, 'Plats'),
    summary: validateLength(sanitizeHtml(data.summary), MAX_LENGTHS.summary, 'Sammanfattning'),
    workExperience: Array.isArray(data.workExperience) 
      ? data.workExperience.map((exp: any) => ({
          company: validateLength(sanitizeHtml(exp.company), MAX_LENGTHS.company, 'Företag'),
          position: validateLength(sanitizeHtml(exp.position), MAX_LENGTHS.position, 'Position'),
          startDate: exp.startDate || null,
          endDate: exp.endDate || null,
          current: !!exp.current,
          description: validateLength(sanitizeHtml(exp.description), MAX_LENGTHS.description, 'Beskrivning'),
        }))
      : [],
    education: Array.isArray(data.education)
      ? data.education.map((edu: any) => ({
          school: validateLength(sanitizeHtml(edu.school), MAX_LENGTHS.school, 'Skola'),
          degree: validateLength(sanitizeHtml(edu.degree), MAX_LENGTHS.degree, 'Examen'),
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          current: !!edu.current,
          description: validateLength(sanitizeHtml(edu.description), MAX_LENGTHS.description, 'Beskrivning'),
        }))
      : [],
    skills: Array.isArray(data.skills)
      ? data.skills.map((skill: any) => validateLength(sanitizeHtml(skill), MAX_LENGTHS.skill, 'Färdighet')).filter(Boolean)
      : [],
    languages: Array.isArray(data.languages)
      ? data.languages.map((lang: any) => ({
          name: validateLength(sanitizeHtml(lang.name), MAX_LENGTHS.language, 'Språk'),
          level: ['grundläggande', 'god', 'mycket god', 'flytande'].includes(lang.level) ? lang.level : 'god',
        }))
      : [],
  };
}

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
    const sanitizedData = sanitizeCvData(req.body);
    
    const cv = await prisma.cV.update({
      where: { userId: req.user!.id },
      data: sanitizedData,
    });
    
    res.json(cv);
  } catch (error: any) {
    console.error('Fel vid uppdatering av CV:', error);
    if (error.message && error.message.includes('får inte vara längre än')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Serverfel vid uppdatering av CV' });
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
