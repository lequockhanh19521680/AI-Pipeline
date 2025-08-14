import { PipelineConfig, PipelineContext } from '../types';

export interface DataAnalysisPromptData {
  dataDescription: string;
  config: PipelineConfig;
}

export function generateDataAnalysisPrompt(data: DataAnalysisPromptData): string {
  return `
As an AI data scientist, analyze the following data configuration and provide insights:

Data Configuration:
${JSON.stringify(data.config, null, 2)}

Data Description:
${data.dataDescription}

Please provide a structured analysis in JSON format:

{
  "dataQuality": {
    "assessment": "string",
    "score": number,
    "issues": ["string"]
  },
  "preprocessing": {
    "recommendations": ["string"],
    "requiredSteps": ["string"],
    "potentialChallenges": ["string"]
  },
  "concerns": ["string"],
  "improvements": ["string"],
  "nextSteps": ["string"]
}
`;
}

export interface ConfigOptimizationPromptData {
  currentConfig: PipelineConfig;
  context?: string;
}

export function generateConfigOptimizationPrompt(data: ConfigOptimizationPromptData): string {
  return `
As an AI configuration expert, optimize the following pipeline configuration:

Current Configuration:
${JSON.stringify(data.currentConfig, null, 2)}

${data.context ? `Context: ${data.context}` : ''}

Please provide optimization recommendations in JSON format:

{
  "optimizedConfig": {
    "projectName": "string",
    "projectType": "string",
    "description": "string",
    "techStack": {},
    "features": ["string"]
  },
  "improvements": [
    {
      "category": "string",
      "change": "string",
      "reason": "string",
      "impact": "string"
    }
  ],
  "performanceGains": ["string"],
  "warnings": ["string"]
}
`;
}

export interface DebugPromptData {
  code: string;
  filename: string;
  error?: string;
  context?: string;
}

export function generateDebugPrompt(data: DebugPromptData): string {
  return `
As an AI debugging expert, help debug the following code issue:

File: ${data.filename}
\`\`\`
${data.code}
\`\`\`

${data.error ? `Error: ${data.error}` : ''}
${data.context ? `Context: ${data.context}` : ''}

Please provide a comprehensive debugging analysis in JSON format:

{
  "diagnosis": {
    "rootCause": "string",
    "problemArea": "string",
    "severity": "string"
  },
  "solution": {
    "fixedCode": "string",
    "explanation": "string",
    "steps": ["string"]
  },
  "prevention": {
    "bestPractices": ["string"],
    "testCases": ["string"],
    "monitoring": ["string"]
  },
  "additionalIssues": ["string"]
}
`;
}

export interface DocumentationPromptData {
  code: string;
  filename: string;
  projectContext?: PipelineConfig;
}

export function generateDocumentationPrompt(data: DocumentationPromptData): string {
  return `
As an AI documentation expert, generate comprehensive documentation for the following code:

File: ${data.filename}
\`\`\`
${data.code}
\`\`\`

${data.projectContext ? `Project Context: ${JSON.stringify(data.projectContext, null, 2)}` : ''}

Please provide complete documentation in JSON format:

{
  "overview": "string",
  "functions": [
    {
      "name": "string",
      "description": "string",
      "parameters": [{"name": "string", "type": "string", "description": "string"}],
      "returns": {"type": "string", "description": "string"},
      "examples": ["string"]
    }
  ],
  "classes": [
    {
      "name": "string",
      "description": "string",
      "methods": [{"name": "string", "description": "string"}],
      "properties": [{"name": "string", "type": "string", "description": "string"}]
    }
  ],
  "usage": {
    "installation": ["string"],
    "basicUsage": "string",
    "examples": ["string"]
  },
  "apiReference": "string",
  "readme": "string"
}
`;
}