import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { generateToken } from '../middleware/auth';
import { loginSchema, registerSchema } from '../models/auth';

const router = Router();

// Registrering
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Kolla om användaren redan finns
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'En användare med denna e-post finns redan' });
    }
    
    // Hasha lösenord
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Skapa användare
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      },
    });
    
    // Skapa tom CV-post
    await prisma.cV.create({
      data: {
        userId: user.id,
      },
    });
    
    const token = generateToken(user.id, user.email, user.role);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registreringsfel:', error);
    res.status(400).json({ error: 'Ogiltig data' });
  }
});

// Inloggning
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Hitta användare
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Felaktig e-post eller lösenord' });
    }
    
    // Verifiera lösenord
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Felaktig e-post eller lösenord' });
    }
    
    const token = generateToken(user.id, user.email, user.role);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Inloggningsfel:', error);
    res.status(400).json({ error: 'Ogiltig data' });
  }
});

export default router;
