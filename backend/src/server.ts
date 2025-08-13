import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PipelineService } from './services/PipelineService';
import { GitHubService } from './services/GitHubService';
import pipelineRoutes from './routes/pipeline';
import githubRoutes from './routes/github';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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