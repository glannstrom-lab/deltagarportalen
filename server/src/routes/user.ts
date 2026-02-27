import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// Hämta användarens profil
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Användare hittades inte' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Fel vid hämtning av profil:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Uppdatera profil
router.put('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName },
    });
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    console.error('Fel vid uppdatering av profil:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Konsulent: Hämta alla deltagare
router.get('/', authMiddleware, requireRole('CONSULTANT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        cv: {
          select: {
            updatedAt: true,
          },
        },
        interestResult: {
          select: {
            completedAt: true,
            hollandCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(users);
  } catch (error) {
    console.error('Fel vid hämtning av användare:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Konsulent: Hämta specifik deltagare med detaljer
router.get('/:id', authMiddleware, requireRole('CONSULTANT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        cv: true,
        interestResult: true,
        coverLetters: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        // notes: {  // TODO: Lägg till i Prisma-schema
        //   orderBy: { createdAt: 'desc' },
        // },
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Användare hittades inte' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Fel vid hämtning av användare:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Konsulent: Lägg till anteckning
router.post('/:id/notes', authMiddleware, requireRole('CONSULTANT', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // TODO: Lägg till Note-modell i Prisma-schema
    // const note = await prisma.note.create({
    //   data: {
    //     userId: id,
    //     content,
    //     createdBy: req.user!.id,
    //   },
    // });
    const note = { id: 'temp', userId: id, content, createdBy: req.user!.id, createdAt: new Date() };
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Fel vid skapande av anteckning:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
