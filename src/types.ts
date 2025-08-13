// Type definitions for AI Pipeline IDE

export interface FileMap {
  [filename: string]: string;
}

export interface PipelineConfig {
  projectType: 'frontend' | 'backend' | 'fullstack';
  projectName: string;
  description: string;
  requirements: string;
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string;
  };
  features: string[];
  designSystem?: {
    colorScheme: string;
    components: string[];
  };
  architecture?: {
    type: string;
    patterns: string[];
  };
}

export interface StageResults {
  [stageName: string]: string;
}

export interface PipelineContext {
  files: FileMap;
  currentFile: string;
  config: PipelineConfig;
  previousResults?: StageResults;
  stageIndex?: number;
  totalStages?: number;
  projectStructure?: string[];
  qaFeedback?: string;
}

// New ML Pipeline Types
export interface MLPipelineStage {
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

export interface MLPipelineConfig {
  id: string;
  name: string;
  description: string;
  stages: MLPipelineStage[];
  dataPath?: string;
  modelConfig?: any;
  outputPath?: string;
}

export interface PipelineExecution {
  id: string;
  config: MLPipelineConfig;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStage?: string;
  progress: number;
  startTime: Date;
  endTime?: Date;
  results: any;
}

// GitHub Integration Types
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface PRDetails {
  number: number;
  url: string;
  title: string;
  description: string;
  branch: string;
}

export interface RepoStructure {
  name: string;
  fullName: string;
  description: string;
  language: string;
  structure: FileNode[];
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface GeneratedCode {
  files: { [path: string]: string };
  structure: FileNode[];
  metadata: {
    projectType: string;
    techStack: string[];
    description: string;
  };
}

// WebSocket Event Types
export interface PipelineEvent {
  type: 'stage-start' | 'stage-complete' | 'stage-error' | 'pipeline-complete' | 'log';
  pipelineId: string;
  stageId?: string;
  data: any;
  timestamp: Date;
}

export interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  stage?: string;
}

export interface GeminiGenerationOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface SafetySettings {
  category: string;
  threshold: string;
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
  safetySettings: SafetySettings[];
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

export interface TerminalCommand {
  command: string;
  output: string;
  timestamp: Date;
}

// Enums for better type safety
export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum PipelineStage {
  TECH_LEAD = 'AI Tech Lead',
  BUSINESS_ANALYST = 'AI Business Analyst', 
  UX_UI_DESIGNER = 'AI UX/UI Designer',
  ARCHITECT = 'AI Architect',
  DEVELOPER = 'AI Developer',
  QA_ENGINEER = 'AI QA Engineer',
  DEVELOPER_REFINEMENT = 'AI Developer (Refinement)'
}

// New ML Pipeline Stages
export enum MLPipelineStageType {
  DATA_INGESTION = 'data_ingestion',
  PREPROCESSING = 'preprocessing',
  MODEL_TRAINING = 'model_training',
  EVALUATION = 'evaluation',
  DEPLOYMENT = 'deployment'
}

// Component prop types
export interface FileTreeProps {
  files: string[];
  currentFile: string;
  onFileSelect: (filename: string) => void;
}

export interface EditorProps {
  content: string;
  filename: string;
  onChange: (content: string) => void;
}

export interface PipelineProps {
  status: PipelineStatus;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  currentStage: string | null;
  stageResults: StageResults;
  mlPipelineStages?: MLPipelineStage[];
  onStageClick?: (stageId: string) => void;
}

export interface PipelineFlowProps {
  stages: MLPipelineStage[];
  currentStage?: string;
  onStageClick: (stageId: string) => void;
  onStageHover?: (stageId: string | null) => void;
}

export interface StageDetailProps {
  stage: MLPipelineStage;
  isOpen: boolean;
  onClose: () => void;
}

export interface TerminalProps {
  output: string[];
  onCommand: (command: string) => void;
  geminiService: GeminiService | null;
  files: FileMap;
  currentFile: string;
  onCodeUpdate: (filename: string, content: string) => void;
}

export interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: (isDarkMode: boolean) => void;
}

export interface AIAssistantProps {
  geminiService: GeminiService | null;
  files: FileMap;
  currentFile: string;
  onCodeUpdate: (filename: string, content: string) => void;
}

export interface ProjectInputProps {
  onProjectSubmit: (config: PipelineConfig) => void;
  isVisible: boolean;
}

export interface PreviewPanelProps {
  files: FileMap;
  projectType: string;
  isVisible: boolean;
}

export interface BackendStatusProps {
  files: FileMap;
  projectType: string;
  isVisible: boolean;
}

export interface GitHubIntegrationProps {
  isVisible: boolean;
  onConfigSave: (config: GitHubConfig) => void;
}

export interface ProjectManagementProps {
  projects: ProjectMetadata[];
  currentProject?: ProjectMetadata;
  onProjectSelect: (project: ProjectMetadata) => void;
  onProjectCreate: (project: ProjectMetadata) => void;
  onProjectDelete: (projectId: string) => void;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  type: 'frontend' | 'backend' | 'fullstack';
  createdAt: Date;
  lastModified: Date;
  status: 'draft' | 'in-progress' | 'completed';
  pipelineConfig?: PipelineConfig;
  mlPipelineId?: string;
}

// Forward declaration for GeminiService
export declare class GeminiService {
  constructor(apiKey: string);
  setApiKey(apiKey: string): void;
  generateContent(prompt: string, options?: GeminiGenerationOptions): Promise<string>;
  analyzeData(dataDescription: string, config: PipelineConfig): Promise<string>;
  generateModel(dataConfig: PipelineConfig, modelRequirements: string): Promise<string>;
  optimizeConfig(currentConfig: PipelineConfig, performanceMetrics: string): Promise<string>;
  debugCode(code: string, errorMessage: string): Promise<string>;
  generateDocumentation(code: string, purpose: string): Promise<string>;
  runPipelineStage(stageName: string, context: PipelineContext): Promise<string>;
}

// Backend API Service Types
export interface BackendAPI {
  // Pipeline operations
  createPipeline(config: Partial<MLPipelineConfig>): Promise<MLPipelineConfig>;
  executePipeline(id: string, config: MLPipelineConfig): Promise<string>;
  getPipelineStatus(id: string): Promise<PipelineExecution | null>;
  stopPipeline(id: string): Promise<void>;
  
  // GitHub operations
  validateToken(token: string): Promise<{ valid: boolean; user?: string }>;
  analyzeRepo(token: string, owner: string, repo: string): Promise<RepoStructure>;
  pushCode(token: string, config: GitHubConfig, code: GeneratedCode, message: string): Promise<string>;
  createPR(token: string, config: GitHubConfig, branchName: string, title: string, description: string, code: GeneratedCode): Promise<PRDetails>;
  autoMerge(token: string, config: GitHubConfig, prNumber: number, method?: 'merge' | 'squash' | 'rebase'): Promise<boolean>;
}

// Error types
export class PipelineError extends Error {
  constructor(
    message: string,
    public stage?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export class BackendError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'BackendError';
  }
}