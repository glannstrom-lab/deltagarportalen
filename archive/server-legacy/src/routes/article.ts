import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// Hämta alla artiklar (publika)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const where: any = { published: true };
    
    if (category) {
      where.category = category as string;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    res.json(articles);
  } catch (error) {
    console.error('Fel vid hämtning av artiklar:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Hämta en specifik artikel
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.article.findUnique({
      where: { id },
    });
    
    if (!article || !article.published) {
      return res.status(404).json({ error: 'Artikel hittades inte' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Fel vid hämtning av artikel:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Hämta kategorier
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.article.groupBy({
      by: ['category'],
      where: { published: true },
      _count: { category: true },
    });
    
    res.json(categories.map(c => ({
      name: c.category,
      count: c._count.category,
    })));
  } catch (error) {
    console.error('Fel vid hämtning av kategorier:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Admin: Skapa artikel
router.post('/', authMiddleware, requireRole('ADMIN', 'CONSULTANT'), async (req: AuthRequest, res) => {
  try {
    const { title, content, summary, category, tags } = req.body;
    
    const article = await prisma.article.create({
      data: {
        title,
        content,
        summary,
        category,
        tags,
        published: true,
      },
    });
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Fel vid skapande av artikel:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Admin: Uppdatera artikel
router.put('/:id', authMiddleware, requireRole('ADMIN', 'CONSULTANT'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, tags, published } = req.body;
    
    const article = await prisma.article.update({
      where: { id },
      data: { title, content, summary, category, tags, published },
    });
    
    res.json(article);
  } catch (error) {
    console.error('Fel vid uppdatering av artikel:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Admin: Ta bort artikel
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'CONSULTANT'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await prisma.article.delete({
      where: { id },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Fel vid borttagning av artikel:', error);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
