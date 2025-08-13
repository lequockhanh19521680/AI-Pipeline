import { io, Socket } from 'socket.io-client';
import { PipelineEvent, LogEvent } from '../types';

export type WebSocketEventHandler = (event: PipelineEvent) => void;
export type LogEventHandler = (log: LogEvent) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private logHandlers: LogEventHandler[] = [];

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
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;