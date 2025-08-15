// Pipeline Service types
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

// WebSocket event types
export interface PipelineEvent {
  type: 'stage_start' | 'stage_complete' | 'stage_failed' | 'pipeline_completed' | 'log';
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

// Job types for queue processing
export interface PipelineJob {
  id: string;
  pipelineId: string;
  stage: MLPipelineStage;
  config: MLPipelineConfig;
}

export interface JobResult {
  success: boolean;
  output?: any;
  logs: string[];
  artifacts?: string[];
}