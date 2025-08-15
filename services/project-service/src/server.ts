import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import projectRoutes from './routes/projects.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/project-service.log' })
  ]
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-pipeline';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('🗄️  Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for large project files
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'project-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'Project Service',
    version: '1.0.0',
    description: 'Project management and collaboration service',
    endpoints: [
      { method: 'POST', path: '/api/projects', description: 'Create new project' },
      { method: 'GET', path: '/api/projects', description: 'Get projects with filtering and pagination' },
      { method: 'GET', path: '/api/projects/:id', description: 'Get specific project' },
      { method: 'PUT', path: '/api/projects/:id', description: 'Update project' },
      { method: 'DELETE', path: '/api/projects/:id', description: 'Delete project' },
      { method: 'POST', path: '/api/projects/:id/collaborators', description: 'Add collaborator' },
      { method: 'DELETE', path: '/api/projects/:id/collaborators/:userId', description: 'Remove collaborator' }
    ],
    features: [
      'Project CRUD operations',
      'Collaboration management',
      'Role-based access control (Owner, Editor, Viewer)',
      'GitHub repository integration',
      'File management',
      'Search and filtering',
      'Pagination support'
    ]
  });
});

// Statistics endpoint
app.get('/api/projects/stats', (req, res) => {
  // This would be implemented with actual statistics logic
  res.json({
    success: true,
    data: {
      message: 'Statistics endpoint - to be implemented',
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0
    }
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    service: 'project-service'
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    service: 'project-service'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`📁 Project Service running on port ${PORT}`);
});

export default app;