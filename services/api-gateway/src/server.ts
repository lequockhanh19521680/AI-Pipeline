import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
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

// JWT Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Optional authentication middleware
const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
    } catch (error) {
      // Continue without authentication
    }
  }
  next();
};

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  project: process.env.PROJECT_SERVICE_URL || 'http://localhost:3002',
  github: process.env.GITHUB_SERVICE_URL || 'http://localhost:3003',
  pipeline: process.env.PIPELINE_SERVICE_URL || 'http://localhost:3004'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: Object.keys(services),
    version: '1.0.0'
  });
});

// Authentication routes (public)
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error:', err);
    res.status(503).json({ 
      success: false, 
      error: 'Authentication service unavailable' 
    });
  }
}));

// Project routes (protected)
app.use('/api/projects', authenticateToken, createProxyMiddleware({
  target: services.project,
  changeOrigin: true,
  pathRewrite: {
    '^/api/projects': '/api/projects'
  },
  onProxyReq: (proxyReq, req: any, res) => {
    // Forward user info to microservice
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Email', req.user.email || '');
    }
  },
  onError: (err, req, res) => {
    logger.error('Project service proxy error:', err);
    res.status(503).json({ 
      success: false, 
      error: 'Project service unavailable' 
    });
  }
}));

// GitHub routes (protected)
app.use('/api/github', authenticateToken, createProxyMiddleware({
  target: services.github,
  changeOrigin: true,
  pathRewrite: {
    '^/api/github': '/api/github'
  },
  onProxyReq: (proxyReq, req: any, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
    }
  },
  onError: (err, req, res) => {
    logger.error('GitHub service proxy error:', err);
    res.status(503).json({ 
      success: false, 
      error: 'GitHub service unavailable' 
    });
  }
}));

// Pipeline routes (protected)
app.use('/api/pipeline', authenticateToken, createProxyMiddleware({
  target: services.pipeline,
  changeOrigin: true,
  pathRewrite: {
    '^/api/pipeline': '/api/pipeline'
  },
  onProxyReq: (proxyReq, req: any, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
    }
  },
  onError: (err, req, res) => {
    logger.error('Pipeline service proxy error:', err);
    res.status(503).json({ 
      success: false, 
      error: 'Pipeline service unavailable' 
    });
  }
}));

// WebSocket proxy for real-time features
app.use('/socket.io', createProxyMiddleware({
  target: services.pipeline,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  onError: (err, req, res) => {
    logger.error('WebSocket proxy error:', err);
  }
}));

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info('Service URLs:', services);
});

export default app;