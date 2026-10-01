import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import prisma from './config/prisma';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

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

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Smart Healthcare API Backend running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log(`API Base:        http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

export default server;
