import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import cvRoutes from './routes/cv';
import interestRoutes from './routes/interest';
import coverLetterRoutes from './routes/coverLetter';
import articleRoutes from './routes/article';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// CORS-konfiguration - striktare i produktion
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL || 'https://glannstrom-lab.github.io')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate limiting för autentisering (striktere)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 10, // max 10 försök per fönster
  message: { 
    error: 'För många försök. Vänligen försök igen om 15 minuter.',
    retryAfter: 15 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting för API generellt
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 100, // max 100 requests per minut
  message: { 
    error: 'För många förfrågningar. Vänligen försök igen senare.' 
  },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { prisma };
