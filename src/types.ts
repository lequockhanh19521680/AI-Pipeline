// Type definitions for AI Pipeline IDE

export interface FileMap {
  [filename: string]: string;
}

export interface PipelineConfig {
  data: {
    source: string;
    target_column: string;
  };
  model: {
    type: string;
    n_estimators: number;
    random_state: number;
  };
  preprocessing: {
    test_size: number;
    normalize: boolean;
    feature_selection?: boolean;
  };
  training?: {
    validation_split: number;
    epochs: number;
    batch_size: number;
  };
  output?: {
    model_path: string;
    metrics_path: string;
    logs_path: string;
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
  DATA_INGESTION = 'Data Ingestion',
  PROCESSING = 'Processing',
  MODEL_TRAINING = 'Model Training',
  DEPLOYMENT = 'Deployment'
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