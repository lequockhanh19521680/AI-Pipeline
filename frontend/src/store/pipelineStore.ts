import { create } from 'zustand';
import { MLPipelineConfig, PipelineExecution } from '../types';

export interface PipelineState {
  // Current pipeline execution
  currentExecution: PipelineExecution | null;
  executions: PipelineExecution[];
  
  // Pipeline status
  isRunning: boolean;
  currentStage: string | null;
  progress: number;
  logs: string[];
  
  // ML Pipeline specific
  currentMLPipeline: MLPipelineConfig | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startPipeline: (config: MLPipelineConfig) => void;
  stopPipeline: () => void;
  updateProgress: (progress: number, stage?: string) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  setCurrentMLPipeline: (pipeline: MLPipelineConfig | null) => void;
  setError: (error: string | null) => void;
  addExecution: (execution: PipelineExecution) => void;
  updateExecution: (id: string, updates: Partial<PipelineExecution>) => void;
  setExecutions: (executions: PipelineExecution[]) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  currentExecution: null,
  executions: [],
  isRunning: false,
  currentStage: null,
  progress: 0,
  logs: [],
  currentMLPipeline: null,
  isLoading: false,
  error: null,

  startPipeline: (config: MLPipelineConfig) => {
    const execution: PipelineExecution = {
      id: `execution-${Date.now()}`,
      config,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      results: null
    };

    set({
      currentExecution: execution,
      currentMLPipeline: config,
      isRunning: true,
      progress: 0,
      currentStage: 'Starting...',
      error: null
    });

    // Add to executions list
    get().addExecution(execution);
  },

  stopPipeline: () => {
    const { currentExecution } = get();
    if (currentExecution) {
      const updatedExecution: PipelineExecution = {
        ...currentExecution,
        status: 'completed',
        endTime: new Date(),
        progress: 100
      };
      
      set({
        currentExecution: updatedExecution,
        isRunning: false,
        currentStage: null
      });

      get().updateExecution(updatedExecution.id, updatedExecution);
    }
  },

  updateProgress: (progress: number, stage?: string) => {
    set(state => ({
      progress,
      currentStage: stage || state.currentStage,
      currentExecution: state.currentExecution ? {
        ...state.currentExecution,
        progress,
        currentStage: stage
      } : null
    }));
  },

  addLog: (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    set(state => ({
      logs: [...state.logs, logMessage]
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  setCurrentMLPipeline: (pipeline: MLPipelineConfig | null) => {
    set({ currentMLPipeline: pipeline });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  addExecution: (execution: PipelineExecution) => {
    set(state => ({
      executions: [execution, ...state.executions]
    }));
  },

  updateExecution: (id: string, updates: Partial<PipelineExecution>) => {
    set(state => ({
      executions: state.executions.map(exec => 
        exec.id === id ? { ...exec, ...updates } : exec
      )
    }));
  },

  setExecutions: (executions: PipelineExecution[]) => {
    set({ executions });
  }
}));