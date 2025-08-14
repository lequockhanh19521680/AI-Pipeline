import { PipelineConfig, PipelineContext } from '../types';

export interface PipelineStagePromptData {
  stage: string;
  context: PipelineContext;
}

export function generatePipelineStagePrompt(data: PipelineStagePromptData): string {
  const stagePrompts = {
    'AI Architect': `
You are an expert AI Software Architect. Design the complete system architecture.

Project Context:
${JSON.stringify(data.context.config, null, 2)}

Previous Results:
${data.context.previousResults ? JSON.stringify(data.context.previousResults, null, 2) : 'None'}

Your tasks:
1. Design complete system architecture
2. Define component structure and relationships
3. Establish data flow and API contracts
4. Create technical specifications
5. Identify technology choices and justifications

Please provide a comprehensive architectural design in JSON format:

{
  "architecture": {
    "overview": "string",
    "components": [
      {
        "name": "string",
        "type": "string",
        "responsibilities": ["string"],
        "dependencies": ["string"],
        "interfaces": ["string"]
      }
    ],
    "dataFlow": ["string"],
    "integrations": ["string"]
  },
  "specifications": {
    "technical": ["string"],
    "performance": ["string"],
    "security": ["string"],
    "scalability": ["string"]
  },
  "implementation": {
    "phaseBreakdown": ["string"],
    "priorities": ["string"],
    "dependencies": ["string"]
  }
}
`,
    
    'AI Developer': `
You are an expert AI Full-Stack Developer. Implement the complete project according to specifications.

Project Context:
${JSON.stringify(data.context.config, null, 2)}

Previous Results:
${data.context.previousResults ? JSON.stringify(data.context.previousResults, null, 2) : 'None'}

Your tasks:
1. Implement the complete project according to specifications
2. Create all necessary files and code structure
3. Implement core functionality and features
4. Add proper error handling and validation
5. Include comprehensive documentation

Please provide complete implementation. For each file, use this format:

File: filename.ext
\`\`\`language
// file content here
\`\`\`

Include all necessary files:
- Source code files with full implementation
- Configuration files (package.json, etc.)
- Documentation and README
- Setup and deployment instructions
`,

    'AI QA Engineer': `
You are a meticulous AI QA Engineer. Review the code and identify issues.

Project Context:
${JSON.stringify(data.context.config, null, 2)}

Code to Review:
${data.context.files ? Object.entries(data.context.files).map(([name, content]) => `
File: ${name}
\`\`\`
${content}
\`\`\`
`).join('\n') : 'No code files available'}

Previous Results:
${data.context.previousResults ? JSON.stringify(data.context.previousResults, null, 2) : 'None'}

Please provide a comprehensive QA analysis in JSON format:

{
  "codeQuality": {
    "overallScore": number,
    "maintainability": number,
    "readability": number,
    "testability": number
  },
  "issues": [
    {
      "file": "string",
      "line": number,
      "type": "string",
      "severity": "string",
      "message": "string",
      "suggestion": "string"
    }
  ],
  "securityAnalysis": {
    "vulnerabilities": ["string"],
    "recommendations": ["string"],
    "score": number
  },
  "performance": {
    "issues": ["string"],
    "optimizations": ["string"],
    "score": number
  },
  "testRecommendations": {
    "unitTests": ["string"],
    "integrationTests": ["string"],
    "coverage": ["string"]
  },
  "overallAssessment": "string"
}
`,

    'AI Developer (Refinement)': `
You are an expert AI Developer focusing on refinement and optimization.

Project Context:
${JSON.stringify(data.context.config, null, 2)}

QA Feedback:
${data.context.qaFeedback || 'No QA feedback available'}

Code to Refine:
${data.context.files ? Object.entries(data.context.files).map(([name, content]) => `
File: ${name}
\`\`\`
${content}
\`\`\`
`).join('\n') : 'No code files available'}

Previous Results:
${data.context.previousResults ? JSON.stringify(data.context.previousResults, null, 2) : 'None'}

Your tasks:
1. Address all QA feedback and identified issues
2. Implement performance optimizations
3. Enhance code quality and maintainability
4. Add missing features or improvements
5. Ensure production readiness

For each file that needs changes, use this format:

File: filename.ext
\`\`\`language
// improved file content here
\`\`\`

Only include files that have been modified or improved.
`
  };

  const prompt = stagePrompts[data.stage as keyof typeof stagePrompts];
  if (!prompt) {
    throw new Error(`Unknown pipeline stage: ${data.stage}`);
  }

  return prompt;
}

export function generateRetryPrompt(originalPrompt: string, error: string): string {
  return `
${originalPrompt}

IMPORTANT: The previous response had the following issue:
${error}

Please ensure your response is properly formatted JSON and follows the exact schema requested. Double-check the JSON syntax and structure before responding.
`;
}