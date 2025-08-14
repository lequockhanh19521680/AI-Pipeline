// Re-export shared types for convenience
export * from '@shared/types/pipeline';
export * from '@shared/interfaces/api';
export * from '@shared/interfaces/common';

// Frontend-specific types that don't exist in shared
export interface EditorState {
  fontSize: number;
  wordWrap: boolean;
  theme: 'vs-dark' | 'vs-light';
  language: string;
}

export interface UIState {
  sidebarCollapsed: boolean;
  terminalVisible: boolean;
  rightPanelSize: number;
  leftPanelSize: number;
}

// Component Props interfaces
export interface AIAssistantProps {
  className?: string;
}

export interface BackendStatusProps {
  className?: string;
}

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'vs-light';
  className?: string;
}

export interface FileTreeProps {
  files: string[];
  currentFile: string;
  onFileSelect: (file: string) => void;
  className?: string;
}

export interface GitHubIntegrationProps {
  className?: string;
}

// Legacy types still used in components
export interface ProjectMetadata {
  projectType: 'frontend' | 'backend' | 'fullstack';
  techStack: string[];
  description: string;
}

export interface MLPipelineStageType {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  logs: string[];
  outputs: any;
  artifacts: string[];
}

export class PipelineError extends Error {
  constructor(
    message: string,
    public stage: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}