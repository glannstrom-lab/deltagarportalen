import express from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json());

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
});

export { prisma };
