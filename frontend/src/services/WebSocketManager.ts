import { io, Socket } from 'socket.io-client';

interface StageEvent {
  stageId?: string;
  data: {
    stage: string;
    outputs?: any;
    error?: string;
  };
}

interface LogEvent {
  stage?: string;
  message: string;
  timestamp: Date;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private baseURL: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_WS_URL || 'http://localhost:3001';
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.baseURL, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false;
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          this.isConnected = true;
          console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        });

        this.socket.on('reconnect_failed', () => {
          this.isConnected = false;
          console.error('WebSocket reconnection failed');
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Event listeners for pipeline events
  onStageStart(callback: (event: StageEvent) => void): void {
    this.socket?.on('stage:start', callback);
  }

  onStageComplete(callback: (event: StageEvent) => void): void {
    this.socket?.on('stage:complete', callback);
  }

  onStageError(callback: (event: StageEvent) => void): void {
    this.socket?.on('stage:error', callback);
  }

  onPipelineComplete(callback: (event: any) => void): void {
    this.socket?.on('pipeline:complete', callback);
  }

  onPipelineError(callback: (event: any) => void): void {
    this.socket?.on('pipeline:error', callback);
  }

  onLog(callback: (log: LogEvent) => void): void {
    this.socket?.on('log', callback);
  }

  // Emit events to backend
  startPipeline(config: any): void {
    if (this.isSocketConnected()) {
      this.socket?.emit('pipeline:start', config);
    }
  }

  stopPipeline(pipelineId: string): void {
    if (this.isSocketConnected()) {
      this.socket?.emit('pipeline:stop', { pipelineId });
    }
  }

  // Generic event handling
  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  emit(event: string, data?: any): void {
    if (this.isSocketConnected()) {
      this.socket?.emit(event, data);
    }
  }

  // Remove event listeners
  off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

// Create singleton instance
export const webSocketManager = new WebSocketManager();
export default webSocketManager;