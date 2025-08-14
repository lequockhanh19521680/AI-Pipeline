// Gemini API service for client-side AI pipeline processing
import { GEMINI_CONFIG } from '../data';
import { 
  GeminiGenerationOptions, 
  GeminiRequestBody, 
  GeminiResponse, 
  PipelineConfig, 
  PipelineContext,
  GeminiError 
} from '../types';

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class GeminiService {
  private apiKey: string;
  private baseUrl: string;
  private retryOptions: RetryOptions;

  constructor(apiKey: string, retryOptions?: Partial<RetryOptions>) {
    this.apiKey = apiKey;
    this.baseUrl = GEMINI_CONFIG.API_URL;
    this.retryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      ...retryOptions
    };
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryOptions.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, this.retryOptions.maxDelay);
  }

  async generateContent(prompt: string, options: GeminiGenerationOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new GeminiError('Gemini API key is required');
    }

    const url = `${this.baseUrl}?key=${this.apiKey}`;
    
    const body: GeminiRequestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new GeminiError(
            `Gemini API error: ${errorData.error?.message || response.statusText}`,
            response.status,
            errorData
          );

          // Don't retry on client errors (4xx) except rate limiting (429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }

          lastError = error;
          
          if (attempt < this.retryOptions.maxRetries) {
            const delayMs = this.calculateRetryDelay(attempt);
            console.warn(`Retrying Gemini API request (attempt ${attempt + 1}/${this.retryOptions.maxRetries}) after ${delayMs}ms...`);
            await this.delay(delayMs);
            continue;
          }
          
          throw error;
        }

        const data: GeminiResponse = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
          return data.candidates[0].content.parts[0].text;
        } else {
          throw new GeminiError('No response generated from Gemini');
        }
      } catch (error) {
        console.error(`Gemini API request failed (attempt ${attempt + 1}):`, error);
        
        if (error instanceof GeminiError) {
          lastError = error;
        } else {
          lastError = new GeminiError('Failed to communicate with Gemini API', undefined, error);
        }

        // Don't retry on non-network errors
        if (!(error instanceof TypeError) && attempt < this.retryOptions.maxRetries) {
          const delayMs = this.calculateRetryDelay(attempt);
          console.warn(`Retrying Gemini API request (attempt ${attempt + 1}/${this.retryOptions.maxRetries}) after ${delayMs}ms...`);
          await this.delay(delayMs);
          continue;
        }

        if (attempt === this.retryOptions.maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new GeminiError('Unexpected error in retry loop');
  }

  // Pipeline-specific methods
  async analyzeData(dataDescription: string, config: PipelineConfig): Promise<string> {
    const prompt = `
As an AI data scientist, analyze the following data configuration and provide insights:

Data Configuration:
${JSON.stringify(config, null, 2)}

Data Description:
${dataDescription}

Please provide:
1. Data quality assessment
2. Preprocessing recommendations
3. Potential issues or concerns
4. Suggested improvements

Format your response as a structured analysis with clear sections.
`;

    return await this.generateContent(prompt);
  }

  async generateModel(dataConfig: PipelineConfig, modelRequirements: string): Promise<string> {
    const prompt = `
As an AI engineer, design a machine learning model for:

Data Configuration:
${JSON.stringify(dataConfig, null, 2)}

Model Requirements:
${modelRequirements}

Please provide:
1. Model architecture recommendations
2. Training strategy
3. Hyperparameter suggestions
4. Evaluation metrics
5. Implementation code

Format your response with clear sections and code examples.
`;

    return await this.generateContent(prompt);
  }

  async optimizeConfig(currentConfig: PipelineConfig, performanceMetrics: string): Promise<string> {
    const prompt = `
As an AI optimization expert, analyze and optimize the following pipeline configuration:

Current Configuration:
${JSON.stringify(currentConfig, null, 2)}

Performance Metrics:
${performanceMetrics}

Please provide:
1. Configuration analysis
2. Optimization recommendations
3. Expected improvements
4. Updated configuration

Return an optimized configuration with explanations.
`;

    return await this.generateContent(prompt);
  }

  async debugCode(code: string, errorMessage: string): Promise<string> {
    const prompt = `
As an AI debugging expert, help debug the following code:

Code:
\`\`\`
${code}
\`\`\`

Error Message:
${errorMessage}

Please provide:
1. Error analysis
2. Root cause identification
3. Fix recommendations
4. Corrected code
5. Prevention strategies

Format your response with clear sections and fixed code examples.
`;

    return await this.generateContent(prompt);
  }

  async generateDocumentation(code: string, purpose: string): Promise<string> {
    const prompt = `
As a documentation expert, create comprehensive documentation for:

Code:
\`\`\`
${code}
\`\`\`

Purpose:
${purpose}

Please provide:
1. Overview and purpose
2. Function/class documentation
3. Usage examples
4. Parameters and return values
5. Best practices

Format as clear, professional documentation.
`;

    return await this.generateContent(prompt);
  }

  async runPipelineStage(stageName: string, context: PipelineContext): Promise<string> {
    const stagePrompts: Record<string, string> = {
      'AI Tech Lead': `
You are an experienced AI Tech Lead. Analyze the project requirements and decide the optimal architecture.

Project Details:
${JSON.stringify(context.config, null, 2)}

Your tasks:
1. Analyze the project requirements and scope
2. Decide the optimal project type (frontend-only, backend-only, or fullstack)
3. Recommend the technology stack based on requirements
4. Provide architectural decision rationale
5. Create a high-level development roadmap

Please provide:
- Project type recommendation with justification
- Recommended technology stack
- High-level architecture overview
- Development phases and timeline
- Key technical considerations

Format your response with clear sections and actionable recommendations.
`,
      'AI Business Analyst': `
You are an expert AI Business Analyst. Create comprehensive business analysis documentation.

Project Context:
${JSON.stringify(context.config, null, 2)}

Previous Results:
${context.previousResults ? JSON.stringify(context.previousResults, null, 2) : 'None'}

Your tasks:
1. Analyze business requirements and objectives
2. Define functional and non-functional requirements
3. Create user stories and acceptance criteria
4. Identify stakeholders and their needs
5. Define success metrics and KPIs

Please provide:
- Business requirements document
- User stories with acceptance criteria
- Stakeholder analysis
- Success metrics and KPIs
- Risk assessment and mitigation strategies

Format as a comprehensive business analysis document.
`,
      'AI UX/UI Designer': `
You are a creative AI UX/UI Designer. Create a comprehensive design system for this project.

Project Context:
${JSON.stringify(context.config, null, 2)}

Previous Results:
${context.previousResults ? JSON.stringify(context.previousResults, null, 2) : 'None'}

Your tasks (only for frontend/fullstack projects):
1. Design user interface mockups and wireframes
2. Create a cohesive design system with color palette, typography, and components
3. Define user experience flows and interactions
4. Create responsive design specifications
5. Ensure accessibility compliance

Please provide:
- Design system with color palette and typography
- Component library specifications
- User interface mockups (described in detail)
- User experience flow diagrams
- Responsive design guidelines
- Accessibility considerations

Format as a detailed design specification document.
`,
      'AI Architect': `
You are a senior AI Architect. Create detailed technical specifications.

Project Context:
${JSON.stringify(context.config, null, 2)}

Previous Results:
${context.previousResults ? JSON.stringify(context.previousResults, null, 2) : 'None'}

Your tasks:
1. Design detailed system architecture
2. Define API specifications and database schema
3. Create component architecture and module structure
4. Specify security and performance requirements
5. Define deployment and infrastructure needs

Please provide:
- Detailed system architecture diagram (described)
- API specifications with endpoints
- Database schema design
- Component/module structure
- Security architecture
- Performance requirements
- Deployment strategy

Format as a comprehensive technical specification document.
`,
      'AI Developer': `
You are an expert AI Developer. Implement the project based on the specifications.

Project Context:
${JSON.stringify(context.config, null, 2)}

Previous Results:
${context.previousResults ? JSON.stringify(context.previousResults, null, 2) : 'None'}

Your tasks:
1. Implement the complete project according to specifications
2. Create all necessary files and code structure
3. Implement core functionality and features
4. Add proper error handling and validation
5. Include comprehensive documentation

Please provide:
- Complete project file structure
- All source code files with full implementation
- Configuration files (package.json, etc.)
- Documentation and README
- Setup and deployment instructions

Respond with multiple code blocks for different files, clearly labeled.
`,
      'AI QA Engineer': `
You are a meticulous AI QA Engineer. Review the code and identify issues.

Project Context:
${JSON.stringify(context.config, null, 2)}

Code to Review:
${context.files ? Object.entries(context.files).map(([name, content]) => `
File: ${name}
\`\`\`
${content}
\`\`\`
`).join('\n') : 'No code files available'}

Previous Results:
${context.previousResults ? JSON.stringify(context.previousResults, null, 2) : 'None'}

Your tasks:
1. Perform comprehensive code review
2. Identify bugs, security issues, and performance problems
3. Check code quality and best practices compliance
4. Verify functionality against requirements
5. Create detailed bug reports and improvement suggestions

Please provide:
- Code quality assessment
- List of identified bugs and issues
- Security vulnerability analysis
- Performance optimization suggestions
- Best practices compliance report
- Detailed bug reports with severity levels

Format as a comprehensive QA report with actionable feedback.
`,
      'AI Developer (Refinement)': `
You are an expert AI Developer specializing in code refinement. Fix issues based on QA feedback.

Project Context:
${JSON.stringify(context.config, null, 2)}

Current Code:
${context.files ? Object.entries(context.files).map(([name, content]) => `
File: ${name}
\`\`\`
${content}
\`\`\`
`).join('\n') : 'No code files available'}

QA Feedback:
${context.qaFeedback || 'No QA feedback available'}

Previous Results:
${context.previousResults ? JSON.stringify(context.previousResults, null, 2) : 'None'}

Your tasks:
1. Address all issues identified by QA
2. Fix bugs and security vulnerabilities
3. Improve code quality and performance
4. Enhance error handling and validation
5. Update documentation as needed

Please provide:
- Updated source code files with fixes
- Summary of changes made
- Explanation of bug fixes
- Improved error handling
- Enhanced documentation

Respond with updated code files and a summary of improvements.
`
    };

    const prompt = stagePrompts[stageName] || `
Execute pipeline stage: ${stageName}

Context: ${JSON.stringify(context, null, 2)}

Provide detailed implementation for this stage with:
1. Step-by-step execution plan
2. Code implementation
3. Error handling
4. Progress monitoring
5. Results validation

Format response with clear sections and executable code.
`;

    return await this.generateContent(prompt, { 
      maxOutputTokens: 2048,
      temperature: 0.5 
    });
  }
}

export default GeminiService;