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

class GeminiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = GEMINI_CONFIG.API_URL;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
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
        throw new GeminiError(
          `Gemini API error: ${errorData.error?.message || response.statusText}`,
          response.status,
          errorData
        );
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new GeminiError('No response generated from Gemini');
      }
    } catch (error) {
      console.error('Gemini API request failed:', error);
      if (error instanceof GeminiError) {
        throw error;
      }
      throw new GeminiError('Failed to communicate with Gemini API', undefined, error);
    }
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
      'Data Ingestion': `
Analyze and process data ingestion for an AI pipeline:

Context: ${JSON.stringify(context, null, 2)}

Provide detailed steps for:
1. Data source validation with comprehensive error handling
2. Robust data loading strategy with retry mechanisms
3. Initial data quality checks and validation rules
4. Advanced error handling for data issues
5. Real-time progress monitoring and logging

Return actionable steps, code snippets, and error recovery strategies.
`,
      'Processing': `
Design advanced data processing pipeline for:

Context: ${JSON.stringify(context, null, 2)}

Include:
1. Comprehensive data cleaning procedures with outlier detection
2. Advanced feature engineering with domain expertise
3. Intelligent data transformation logic
4. Multi-level validation checkpoints
5. Performance optimization and memory management

Provide implementation details, best practices, and scalability considerations.
`,
      'Model Training': `
Create advanced model training strategy for:

Context: ${JSON.stringify(context, null, 2)}

Design:
1. Intelligent model selection with automated hyperparameter tuning
2. Robust training pipeline with early stopping and checkpointing
3. Advanced hyperparameter optimization using Bayesian methods
4. Cross-validation strategy with stratified sampling
5. Comprehensive performance monitoring and model versioning

Include code examples, monitoring setup, and deployment preparation.
`,
      'Deployment': `
Design production deployment strategy for:

Context: ${JSON.stringify(context, null, 2)}

Create:
1. Production-ready model packaging and containerization
2. Scalable API endpoints with load balancing
3. Monitoring and alerting systems for model performance
4. A/B testing framework for model updates
5. Rollback strategies and disaster recovery

Provide deployment code, monitoring scripts, and operational procedures.
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