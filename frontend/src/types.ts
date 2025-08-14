// Re-export shared types for convenience
export * from '@shared/types/pipeline';
export * from '@shared/interfaces/api';
export * from '@shared/interfaces/common';

// BackendError class for compatibility (was interface in shared)
export class BackendError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

// Legacy types still used in components that need to be maintained
export interface ProjectMetadata {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'fullstack';
  projectType: 'frontend' | 'backend' | 'fullstack';
  techStack: string[];
  description: string;
  pipelineConfig?: PipelineConfig;
  status?: string;
  lastModified?: string;
  createdAt?: string;
  mlPipelineId?: string;
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
  progress?: number;
}

export class PipelineError extends Error {
  constructor(
    message: string,
    public stage: string,
    public context?: any
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

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
  geminiService: any;
  files: FileMap;
  currentFile: string;
  onCodeUpdate: (filename: string, content: string) => void;
  projectConfig: PipelineConfig | null;
  className?: string;
}

export interface BackendStatusProps {
  files: FileMap;
  projectType: string;
  isVisible: boolean;
  className?: string;
}

export interface EditorProps {
  value: string;
  filename?: string;
  content?: string;
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
  isVisible: boolean;
  onConfigSave: (config: import('@shared/interfaces/api').GitHubConfig) => void;
  className?: string;
}

export interface PreviewPanelProps {
  files: FileMap;
  isVisible: boolean;
  projectType?: string;
  className?: string;
}

export interface ProjectInputProps {
  onProjectSubmit: (config: PipelineConfig) => void;
  isVisible: boolean;
  onProjectCreate: (project: ProjectMetadata) => void;
  className?: string;
}

export interface ProjectManagementProps {
  projects: ProjectMetadata[];
  currentProject: ProjectMetadata | null;
  onProjectSelect: (project: ProjectMetadata) => void;
  onProjectCreate: (project: ProjectMetadata) => void;
  onProjectLoad: (project: ProjectMetadata) => void;
  onProjectDelete: (projectId: string) => void;
  className?: string;
}

export interface StageDetailModalProps {
  stage: any;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface StageDetailProps {
  stage: any;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface TerminalProps {
  messages: string[];
  output: string[];
  isVisible: boolean;
  onCommand?: (command: string) => void;
  geminiService: any;
  files: FileMap;
  currentFile: string;
  onCodeUpdate: (filename: string, content: string) => void;
  projectConfig: PipelineConfig | null;
  className?: string;
}

// Type aliases for compatibility with duplicated types that might still exist
export type MLPipelineStage = MLPipelineStageType;

export interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export interface PipelineProps {
  status: PipelineStatus;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  currentStage: string | null;
  stageResults: StageResults;
  stages: any[];
  className?: string;
}

export interface PipelineFlowProps {
  stages: MLPipelineStageType[];
  currentStage: string | undefined;
  onStageClick: (stageId: string) => void;
  onStageHover: (stageId: string | null) => void;
  nodes: any[];
  edges: any[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (params: any) => void;
  onNodeClick: (event: any, node: any) => void;
  className?: string;
}

export interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export interface PipelineProps {
  status: PipelineStatus;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  currentStage: string | null;
  stageResults: StageResults;
  stages: any[];
  className?: string;
}

export interface PipelineFlowProps {
  stages: MLPipelineStageType[];
  currentStage: string | undefined;
  onStageClick: (stageId: string) => void;
  onStageHover: (stageId: string | null) => void;
  nodes: any[];
  edges: any[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (params: any) => void;
  onNodeClick: (event: any, node: any) => void;
  className?: string;
}

// Legacy types still used in components
export interface ProjectMetadata {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'fullstack';
  projectType: 'frontend' | 'backend' | 'fullstack';
  techStack: string[];
  description: string;
  pipelineConfig?: PipelineConfig;
  status?: string;
  lastModified?: string;
  createdAt?: string;
  mlPipelineId?: string;
}

export interface FileMap {
  [filename: string]: string;
}

export interface PipelineConfig {
  projectName: string;
  projectType: 'frontend' | 'backend' | 'fullstack';
  description: string;
  requirements: string;
  features: string[];
  techStack?: {
    frontend?: string[];
    backend?: string[];
    database?: string;
  };
  designSystem?: {
    colorScheme: string;
    components: string[];
  };
  architecture?: {
    type: string;
    patterns: string[];
  };
}

export interface PipelineContext {
  config: PipelineConfig;
  files?: FileMap;
  previousResults?: any;
  qaFeedback?: string;
  currentFile?: string;
  stageIndex?: number;
  totalStages?: number;
}

export interface StageResults {
  [stageName: string]: string;
}

export enum PipelineStage {
  ARCHITECT = 'AI Architect',
  DEVELOPER = 'AI Developer',
  QA = 'AI QA Engineer',
  REFINEMENT = 'AI Developer (Refinement)'
}

export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface GeminiGenerationOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
  safetySettings: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
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

export class GeminiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}