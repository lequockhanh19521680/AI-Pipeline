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