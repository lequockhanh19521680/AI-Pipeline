// API and communication interfaces

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BackendAPI {
  // Pipeline operations
  createPipeline(config: Partial<MLPipelineConfig>): Promise<MLPipelineConfig>;
  executePipeline(id: string, config: MLPipelineConfig): Promise<string>;
  getPipelineStatus(id: string): Promise<PipelineExecution | null>;
  stopPipeline(id: string): Promise<void>;
  
  // GitHub operations
  validateToken(token: string): Promise<{ valid: boolean; user?: string }>;
  analyzeRepo(token: string, owner: string, repo: string): Promise<RepoStructure>;
  pushCode(token: string, owner: string, repo: string, branch: string, files: GeneratedCode[], commitMessage: string): Promise<PRDetails>;
}

export interface BackendError extends Error {
  status: number;
  endpoint: string;
}

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
  files: FileNode[];
  languages: Record<string, number>;
  topics: string[];
  description: string;
  framework?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

export interface GeneratedCode {
  filename: string;
  content: string;
  path: string;
}

// WebSocket event types
export interface PipelineEvent {
  type: 'stage_started' | 'stage_completed' | 'stage_failed' | 'pipeline_completed' | 'pipeline_failed' | 'log';
  pipelineId: string;
  stageId?: string;
  data?: any;
  timestamp: Date;
}

export interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  source: string;
}

// Import shared pipeline types
import type { MLPipelineConfig, PipelineExecution } from './pipeline.js';