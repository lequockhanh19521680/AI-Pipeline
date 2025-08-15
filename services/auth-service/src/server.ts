import express from 'express';
import cors from 'cors';
import session from 'express-session';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth-service.log' })
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'auth-service-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'Authentication Service',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'User registration' },
      { method: 'POST', path: '/api/auth/login', description: 'User login' },
      { method: 'GET', path: '/api/auth/me', description: 'Get current user profile' },
      { method: 'PUT', path: '/api/auth/profile', description: 'Update user profile' },
      { method: 'POST', path: '/api/auth/change-password', description: 'Change password' },
      { method: 'GET', path: '/api/auth/github', description: 'GitHub OAuth login' },
      { method: 'GET', path: '/api/auth/google', description: 'Google OAuth login' },
      { method: 'GET', path: '/api/auth/verify', description: 'Verify JWT token' },
      { method: 'POST', path: '/api/auth/logout', description: 'Logout user' }
    ]
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    service: 'auth-service'
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    service: 'auth-service'
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
  logger.info(`🔐 Authentication Service running on port ${PORT}`);
});

export default app;