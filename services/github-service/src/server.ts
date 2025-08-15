import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import winston from 'winston';
import githubRoutes from './routes/github.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/github-service.log' })
  ]
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
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
app.use('/api/github', githubRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'github-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'GitHub Service',
    version: '1.0.0',
    description: 'GitHub API integration and repository management service',
    endpoints: [
      { method: 'POST', path: '/api/github/validate-token', description: 'Validate GitHub token' },
      { method: 'GET', path: '/api/github/repos', description: 'Get user repositories' },
      { method: 'POST', path: '/api/github/analyze-repo', description: 'Analyze repository structure' },
      { method: 'POST', path: '/api/github/get-file', description: 'Get file content from repository' },
      { method: 'POST', path: '/api/github/push-code', description: 'Push generated code to repository' },
      { method: 'POST', path: '/api/github/create-pr', description: 'Create pull request' },
      { method: 'POST', path: '/api/github/push-and-pr', description: 'Push code and create PR in one operation' }
    ],
    features: [
      'GitHub API proxy with token management',
      'Repository analysis and structure detection',
      'Framework detection (React, Vue, Angular, etc.)',
      'File content retrieval',
      'Code generation and push to repositories',
      'Pull request creation and management',
      'Secure token handling with validation',
      'Rate limiting and error handling'
    ]
  });
});

// API rate limit info endpoint
app.get('/api/github/rate-limit',
  async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'GitHub token required'
        });
      }

      // This would check GitHub API rate limits
      res.json({
        success: true,
        data: {
          message: 'Rate limit check - to be implemented',
          remaining: 5000,
          limit: 5000,
          resetTime: new Date(Date.now() + 3600000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error checking rate limit:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check rate limit'
      });
    }
  }
);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    service: 'github-service'
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    service: 'github-service'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🐙 GitHub Service running on port ${PORT}`);
});

export default app;