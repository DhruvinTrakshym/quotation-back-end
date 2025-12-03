import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './middlewares/logger';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import quoteRoutes from './routes/quoteRoutes';
import fileRoutes from './routes/fileRoutes';
import featureRoutes from './routes/FeatureRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(logger);

app.get('/', (req, res) => res.status(200).json({ message: 'Welcome to the API' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy 🚀',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Serve uploaded files statically (for dev)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/features', featureRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/files', fileRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
