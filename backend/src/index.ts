import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import apiRouter from './routes';
import prisma from './config/prisma';
import { initRedis } from './services/sessionService';
import { performanceLogger, performanceHeaders } from './middleware/performance';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for development with Vite
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

import path from 'path';

app.use(express.json());
app.use(morgan('dev'));
app.use(compression());
app.use(performanceLogger);
app.use(performanceHeaders);

// Serve uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this client, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      system: 'Smart Healthcare History, Risk Prediction & Disease Surveillance System API',
      database: 'PostgreSQL 16 connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'unhealthy', database: 'Disconnected', error: err.message });
  }
});

// Root disclaimer route
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Healthcare API Gateway',
    version: '1.0.0',
    disclaimer: 'This software is an AI-assisted clinical decision-support and public health surveillance platform. It is not a substitute for professional medical diagnosis.',
  });
});

const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`Smart Healthcare API Backend running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log(`API Base:        http://localhost:${PORT}/api`);
  console.log(`=======================================================`);

  // Initialize Redis for session management
  await initRedis();
});

export default server;
