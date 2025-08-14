import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PipelineService } from './services/PipelineService';
import { GitHubService } from './services/GitHubService';
import pipelineRoutes from './routes/pipeline';
import githubRoutes from './routes/github';
import projectsRoutes from './routes/projects';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-pipeline';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🗄️  Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Services
const pipelineService = new PipelineService(io);
const githubService = new GitHubService();

// Make services available to routes
app.locals.pipelineService = pipelineService;
app.locals.githubService = githubService;

// Routes
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/projects', projectsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server status endpoint
app.get('/api/server/status', (req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'running',
    uptime: Math.floor(uptime),
    version: process.version,
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'Health check endpoint', status: 'active' },
      { method: 'GET', path: '/api/server/status', description: 'Server status endpoint', status: 'active' },
      { method: 'POST', path: '/api/pipeline/create', description: 'Create new pipeline', status: 'active' },
      { method: 'POST', path: '/api/pipeline/execute', description: 'Execute pipeline', status: 'active' },
      { method: 'GET', path: '/api/pipeline/status/:id', description: 'Get pipeline status', status: 'active' },
      { method: 'POST', path: '/api/github/validate-token', description: 'Validate GitHub token', status: 'active' }
    ],
    logs: [
      `[INFO] Server started at ${new Date().toISOString()}`,
      `[INFO] Node.js version: ${process.version}`,
      `[INFO] Server listening on port ${PORT}`,
      '[INFO] All endpoints registered',
      '[SUCCESS] Server is running and ready to accept requests'
    ]
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-pipeline', (pipelineId: string) => {
    socket.join(`pipeline-${pipelineId}`);
    console.log(`Client ${socket.id} joined pipeline ${pipelineId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 AI Pipeline Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
});

export default app;