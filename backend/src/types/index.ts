// Backend types for AI Pipeline IDE
export interface MLPipelineStage {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  logs: string[];
  outputs: any;
  artifacts: string[];
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

// WebSocket event types
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