import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import cvRoutes from './routes/cv';
import interestRoutes from './routes/interest';
import coverLetterRoutes from './routes/coverLetter';
import articleRoutes from './routes/article';
import userRoutes from './routes/user';
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Säkerhetsheaders med Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - whitelist baserad på miljövariabler
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Tillåt requests utan origin (t.ex. curl, Postman) i utveckling
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Ej tillåten av CORS-policy'));
  },
  credentials: true
}));

// Global rate limiting - 100 requests per 15 minuter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'För många förfrågningar, försök igen senare' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Striktare rate limiting för auth-endpoints - 5 försök per 15 minuter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'För många inloggningsförsök, försök igen om 15 minuter' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '2mb' }));

// Routes - auth med striktare rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
});

export { prisma };
