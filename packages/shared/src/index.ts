// Main export file for shared package
export * from './types/pipeline.js';
export * from './interfaces/api.js';
export * from './interfaces/common.js';

// Re-export specific types for convenience
export type {
  MLPipelineConfig,
  MLPipelineStage,
  PipelineExecution,
  Pipeline,
  PipelineNode,
  Connection,
  PipelineTemplate,
} from './types/pipeline.js';

export type {
  APIResponse,
  BackendAPI,
  BackendError,
  GitHubConfig,
  PRDetails,
  RepoStructure,
  FileNode,
  GeneratedCode,
  PipelineEvent,
  LogEvent,
} from './interfaces/api.js';

export type {
  FileMap,
  PipelineConfig,
  StageResults,
  PipelineContext,
  AICodeSuggestion,
  CodeAnalysisResult,
  CodeIssue,
  AppState,
} from './interfaces/common.js';

export {
  PipelineStage,
  PipelineStatus,
} from './interfaces/common.js';