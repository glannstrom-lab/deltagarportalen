import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Hämta alla brev
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const letters = await prisma.coverLetter.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(letters);
  } catch (error) {
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Skapa brev
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const letter = await prisma.coverLetter.create({
      data: {
        userId: req.user!.id,
        title: req.body.title,
        jobAd: req.body.jobAd,
        content: req.body.content,
        company: req.body.company,
        jobTitle: req.body.jobTitle,
      },
    });
    res.json(letter);
  } catch (error) {
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Ta bort brev
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.coverLetter.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
