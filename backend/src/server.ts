import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passport from './middleware/passport.js';
import { PipelineService } from './services/PipelineService';
import { DynamicPipelineService } from './services/DynamicPipelineService';
import { GitHubService } from './services/GitHubService';
import pipelineRoutes from './routes/pipeline';
import githubRoutes from './routes/github';
import projectsRoutes from './routes/projects';
import authRoutes from './routes/auth';

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

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'ai-pipeline-session-secret',
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

// Services
const pipelineService = new PipelineService(io);
const dynamicPipelineService = new DynamicPipelineService(io);
const githubService = new GitHubService();

// Make services available to routes
app.locals.pipelineService = pipelineService;
app.locals.dynamicPipelineService = dynamicPipelineService;
app.locals.githubService = githubService;

// Routes
app.use('/auth', authRoutes); // OAuth routes without /api prefix
app.use('/api/auth', authRoutes);
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

  // Real-time collaboration events
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      roomId,
      timestamp: new Date()
    });
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-left', {
      userId: socket.id,
      roomId,
      timestamp: new Date()
    });
  });

  socket.on('code-change', (data: any) => {
    console.log(`Code change from ${socket.id} in room ${data.room}`);
    
    // Broadcast to all other clients in the room
    socket.to(data.room).emit('code-change', {
      ...data,
      userId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('cursor-move', (data: any) => {
    // Broadcast cursor movement to all other clients in the room
    socket.to(data.room).emit('cursor-move', {
      ...data,
      userId: socket.id,
      timestamp: new Date()
    });
  });

  // Pipeline commands
  socket.on('pipeline-command', (data: any) => {
    console.log(`Pipeline command from ${socket.id}:`, data);
    
    // Broadcast pipeline events to all clients watching this pipeline
    io.to(`pipeline-${data.pipelineId}`).emit('pipeline-event', {
      type: 'command',
      pipelineId: data.pipelineId,
      command: data.command,
      data: data.data,
      userId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Could broadcast disconnect to all rooms the user was in
    // For now, socket.io handles room cleanup automatically
  });
});

server.listen(PORT, () => {
  console.log(`🚀 AI Pipeline Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
});

export default app;