import { PipelineContext } from '../types';

export interface CodeReviewPromptData {
  filename: string;
  content: string;
  language: string;
}

export function generateCodeReviewPrompt(data: CodeReviewPromptData): string {
  return `
Perform a comprehensive code review on the following ${data.language} file:

File: ${data.filename}
\`\`\`${data.language}
${data.content}
\`\`\`

Please provide a detailed analysis including:

1. **Code Issues** (format as JSON array):
   - Line numbers with specific issues
   - Issue types: error, warning, suggestion, security
   - Severity levels: low, medium, high, critical
   - Specific messages and fix suggestions

2. **Code Metrics** (format as JSON object):
   - Complexity score (1-10)
   - Maintainability score (1-10)
   - Technical debt score (1-10)
   - Code smells count
   - Potential duplications

3. **Optimization Suggestions** (format as JSON array):
   - Performance improvements
   - Code refactoring opportunities
   - Best practice recommendations
   - Security enhancements

Respond with valid JSON in this format:
{
  "issues": [{"line": number, "type": "string", "severity": "string", "message": "string", "rule": "string", "fixSuggestion": "string"}],
  "metrics": {"complexity": number, "maintainability": number, "technicalDebt": number, "codeSmells": number, "duplications": number},
  "suggestions": [{"type": "string", "title": "string", "description": "string", "before": "string", "after": "string", "impact": "string"}]
}
`;
}

export function generateCodeFixPrompt(data: CodeReviewPromptData & { issues: any[] }): string {
  return `
Based on the code review issues found, please provide specific code fixes for the following ${data.language} file:

File: ${data.filename}
\`\`\`${data.language}
${data.content}
\`\`\`

Issues to fix:
${JSON.stringify(data.issues, null, 2)}

Please provide:
1. Fixed code with issues resolved
2. Explanation of changes made
3. Additional improvements applied

Respond with valid JSON in this format:
{
  "fixedCode": "string",
  "changes": [{"line": number, "type": "string", "description": "string", "oldCode": "string", "newCode": "string"}],
  "improvements": ["string"],
  "testSuggestions": ["string"]
}
`;
}