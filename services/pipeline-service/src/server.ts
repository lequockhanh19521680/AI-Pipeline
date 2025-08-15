import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from 'dotenv';
import winston from 'winston';
import { PipelineService } from './services/PipelineService.js';
import createPipelineRoutes from './routes/pipeline.js';

// Load environment variables
config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const server = createServer(app);

// Configure Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pipeline-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Initialize Pipeline Service
const pipelineService = new PipelineService(io);

// Routes
app.use('/api/pipeline', createPipelineRoutes(pipelineService));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join pipeline room for real-time updates
  socket.on('join-pipeline', (pipelineId: string) => {
    socket.join(`pipeline-${pipelineId}`);
    logger.info(`Client ${socket.id} joined pipeline room: ${pipelineId}`);
  });

  // Leave pipeline room
  socket.on('leave-pipeline', (pipelineId: string) => {
    socket.leave(`pipeline-${pipelineId}`);
    logger.info(`Client ${socket.id} left pipeline room: ${pipelineId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3004;

server.listen(PORT, () => {
  logger.info(`🚀 Pipeline Service running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔄 WebSocket server ready for real-time updates`);
});