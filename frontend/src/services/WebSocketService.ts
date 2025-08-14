import { io, Socket } from 'socket.io-client';
import { PipelineEvent, LogEvent } from '@shared/interfaces/api.js';

export type WebSocketEventHandler = (event: PipelineEvent) => void;
export type LogEventHandler = (log: LogEvent) => void;

interface RealTimeCollaborationEvent {
  type: 'cursor_move' | 'code_change' | 'user_join' | 'user_leave';
  userId: string;
  data: any;
  timestamp: Date;
}

export type CollaborationEventHandler = (event: RealTimeCollaborationEvent) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private logHandlers: LogEventHandler[] = [];
  private collaborationHandlers: CollaborationEventHandler[] = [];
  private currentRoom: string | null = null;

  constructor(private url = 'http://localhost:3001') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      this.socket = io(this.url, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('🔗 Connected to WebSocket server');
        this.connected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.socket.on('pipeline-event', (event: PipelineEvent) => {
        this.handlePipelineEvent(event);
      });

      // Collaboration event handlers
      this.socket.on('user-joined', (data: any) => {
        this.handleCollaborationEvent({
          type: 'user_join',
          userId: data.userId,
          data: data,
          timestamp: new Date(data.timestamp)
        });
      });

      this.socket.on('user-left', (data: any) => {
        this.handleCollaborationEvent({
          type: 'user_leave', 
          userId: data.userId,
          data: data,
          timestamp: new Date(data.timestamp)
        });
      });

      this.socket.on('code-change', (data: any) => {
        this.handleCollaborationEvent({
          type: 'code_change',
          userId: data.userId,
          data: data,
          timestamp: new Date(data.timestamp)
        });
      });

      this.socket.on('cursor-move', (data: any) => {
        this.handleCollaborationEvent({
          type: 'cursor_move',
          userId: data.userId,
          data: data,
          timestamp: new Date(data.timestamp)
        });
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinPipeline(pipelineId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('join-pipeline', pipelineId);
      console.log(`📡 Joined pipeline room: ${pipelineId}`);
    }
  }

  onPipelineEvent(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  onLog(handler: LogEventHandler): void {
    this.logHandlers.push(handler);
  }

  removeEventHandler(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  removeLogHandler(handler: LogEventHandler): void {
    const index = this.logHandlers.indexOf(handler);
    if (index > -1) {
      this.logHandlers.splice(index, 1);
    }
  }

  private handlePipelineEvent(event: PipelineEvent): void {
    console.log('📨 Pipeline event received:', event);

    // Handle log events specifically
    if (event.type === 'log') {
      const logEvent: LogEvent = {
        level: event.data.level,
        message: event.data.message,
        timestamp: new Date(event.timestamp),
        source: event.stageId || 'system',
        stage: event.stageId,
      };
      this.logHandlers.forEach(handler => handler(logEvent));
    }

    // Handle general pipeline events
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Handle wildcard listeners
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler(event));
    }
  }

  private handleCollaborationEvent(event: RealTimeCollaborationEvent): void {
    console.log('🤝 Collaboration event received:', event);
    
    // Notify all collaboration handlers
    this.collaborationHandlers.forEach(handler => handler(event));
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Convenience methods for common event types
  onStageStart(handler: WebSocketEventHandler): void {
    this.onPipelineEvent('stage-start', handler);
  }

  onStageComplete(handler: WebSocketEventHandler): void {
    this.onPipelineEvent('stage-complete', handler);
  }

  onStageError(handler: WebSocketEventHandler): void {
    this.onPipelineEvent('stage-error', handler);
  }

  onPipelineComplete(handler: WebSocketEventHandler): void {
    this.onPipelineEvent('pipeline-complete', handler);
  }

  onAnyEvent(handler: WebSocketEventHandler): void {
    this.onPipelineEvent('*', handler);
  }

  // Real-time collaboration features
  joinRoom(roomId: string): void {
    if (this.socket && this.connected) {
      if (this.currentRoom) {
        this.socket.emit('leave-room', this.currentRoom);
      }
      this.socket.emit('join-room', roomId);
      this.currentRoom = roomId;
      console.log(`🏠 Joined room: ${roomId}`);
    }
  }

  leaveRoom(): void {
    if (this.socket && this.currentRoom) {
      this.socket.emit('leave-room', this.currentRoom);
      this.currentRoom = null;
      console.log('🚪 Left room');
    }
  }

  sendCodeChange(data: { file: string; changes: any; cursor: any }): void {
    if (this.socket && this.connected && this.currentRoom) {
      this.socket.emit('code-change', {
        room: this.currentRoom,
        ...data,
        timestamp: new Date(),
      });
    }
  }

  sendCursorMove(data: { file: string; line: number; column: number }): void {
    if (this.socket && this.connected && this.currentRoom) {
      this.socket.emit('cursor-move', {
        room: this.currentRoom,
        ...data,
        timestamp: new Date(),
      });
    }
  }

  onCollaboration(handler: CollaborationEventHandler): void {
    this.collaborationHandlers.push(handler);
  }

  removeCollaborationHandler(handler: CollaborationEventHandler): void {
    const index = this.collaborationHandlers.indexOf(handler);
    if (index > -1) {
      this.collaborationHandlers.splice(index, 1);
    }
  }

  // Pipeline-specific methods
  sendPipelineCommand(pipelineId: string, command: string, data?: any): void {
    if (this.socket && this.connected) {
      this.socket.emit('pipeline-command', {
        pipelineId,
        command,
        data,
        timestamp: new Date(),
      });
    }
  }

  requestPipelineStatus(pipelineId: string): void {
    this.sendPipelineCommand(pipelineId, 'status');
  }

  startPipeline(pipelineId: string, config?: any): void {
    this.sendPipelineCommand(pipelineId, 'start', config);
  }

  stopPipeline(pipelineId: string): void {
    this.sendPipelineCommand(pipelineId, 'stop');
  }

  pausePipeline(pipelineId: string): void {
    this.sendPipelineCommand(pipelineId, 'pause');
  }

  resumePipeline(pipelineId: string): void {
    this.sendPipelineCommand(pipelineId, 'resume');
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;