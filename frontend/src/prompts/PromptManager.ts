import {
  generateCodeReviewPrompt,
  generateCodeFixPrompt,
  CodeReviewPromptData
} from './codeReview.prompt';

import {
  generateDataAnalysisPrompt,
  generateConfigOptimizationPrompt,
  generateDebugPrompt,
  generateDocumentationPrompt,
  DataAnalysisPromptData,
  ConfigOptimizationPromptData,
  DebugPromptData,
  DocumentationPromptData
} from './debug.prompt';

import {
  generatePipelineStagePrompt,
  generateRetryPrompt,
  PipelineStagePromptData
} from './pipeline.prompt';

import { PipelineConfig, PipelineContext } from '../types';

export class PromptManager {
  // Code Review Prompts
  static generateCodeReview(data: CodeReviewPromptData): string {
    return generateCodeReviewPrompt(data);
  }

  static generateCodeFix(data: CodeReviewPromptData & { issues: any[] }): string {
    return generateCodeFixPrompt(data);
  }

  // Data Analysis Prompts
  static generateDataAnalysis(data: DataAnalysisPromptData): string {
    return generateDataAnalysisPrompt(data);
  }

  // Configuration Optimization Prompts
  static generateConfigOptimization(data: ConfigOptimizationPromptData): string {
    return generateConfigOptimizationPrompt(data);
  }

  // Debug Prompts
  static generateDebug(data: DebugPromptData): string {
    return generateDebugPrompt(data);
  }

  // Documentation Prompts
  static generateDocumentation(data: DocumentationPromptData): string {
    return generateDocumentationPrompt(data);
  }

  // Pipeline Stage Prompts
  static generatePipelineStage(data: PipelineStagePromptData): string {
    return generatePipelineStagePrompt(data);
  }

  // Retry Prompts
  static generateRetry(originalPrompt: string, error: string): string {
    return generateRetryPrompt(originalPrompt, error);
  }

  // Legacy compatibility methods (for existing code)
  static analyzeData(dataDescription: string, config: PipelineConfig): string {
    return this.generateDataAnalysis({ dataDescription, config });
  }

  static optimizeConfig(config: PipelineConfig, context?: string): string {
    return this.generateConfigOptimization({ currentConfig: config, context });
  }

  static debugCode(code: string, filename: string, error?: string, context?: string): string {
    return this.generateDebug({ code, filename, error, context });
  }

  static generateDocs(code: string, filename: string, projectContext?: PipelineConfig): string {
    return this.generateDocumentation({ code, filename, projectContext });
  }

  static runPipelineStage(stage: string, context: PipelineContext): string {
    return this.generatePipelineStage({ stage, context });
  }

  // Helper method to get file language from filename
  static getFileLanguage(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'zsh',
      'fish': 'fish'
    };
    return languageMap[extension] || 'text';
  }

  // Helper method to determine if a file should be analyzed
  static shouldAnalyzeFile(filename: string): boolean {
    const codeExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 
      'go', 'rs', 'swift', 'kt', 'scala', 'html', 'css', 'scss', 'sass', 'less'
    ];
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return codeExtensions.includes(extension) && !filename.includes('node_modules');
  }
}

export default PromptManager;