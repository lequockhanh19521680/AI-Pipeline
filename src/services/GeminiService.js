// Gemini API service for client-side AI pipeline processing
import { GEMINI_CONFIG } from '../data';

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = GEMINI_CONFIG.API_URL;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }

    const url = `${this.baseUrl}?key=${this.apiKey}`;
    
    const body = {
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
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response generated from Gemini');
      }
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  // Pipeline-specific methods
  async analyzeData(dataDescription, config) {
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

  async generateModel(dataConfig, modelRequirements) {
    const prompt = `
As an AI engineer, generate Python code for a machine learning model based on these requirements:

Data Configuration:
${JSON.stringify(dataConfig, null, 2)}

Model Requirements:
${modelRequirements}

Generate complete Python code that includes:
1. Data loading and preprocessing
2. Model definition and training
3. Evaluation metrics
4. Proper error handling
5. Comments explaining each step

The code should be production-ready and follow best practices.
`;

    return await this.generateContent(prompt, { maxOutputTokens: 2048 });
  }

  async optimizeConfig(currentConfig, performanceMetrics) {
    const prompt = `
As an AI optimization expert, analyze the current configuration and performance metrics to suggest improvements:

Current Configuration:
${JSON.stringify(currentConfig, null, 2)}

Performance Metrics:
${performanceMetrics}

Provide optimized configuration suggestions including:
1. Hyperparameter tuning recommendations
2. Model architecture improvements
3. Training optimization
4. Expected performance improvements

Return the response as a JSON object with optimized configuration and explanations.
`;

    return await this.generateContent(prompt);
  }

  async debugCode(code, errorMessage) {
    const prompt = `
As a debugging expert, help fix this Python code that has an error:

Code:
\`\`\`python
${code}
\`\`\`

Error Message:
${errorMessage}

Please provide:
1. Explanation of the error
2. Fixed code with corrections highlighted
3. Best practices to prevent similar issues
4. Testing suggestions

Format your response with clear sections and code blocks.
`;

    return await this.generateContent(prompt, { maxOutputTokens: 2048 });
  }

  async generateDocumentation(code, purpose) {
    const prompt = `
Generate comprehensive documentation for this Python code:

Code:
\`\`\`python
${code}
\`\`\`

Purpose: ${purpose}

Create documentation including:
1. Overview and purpose
2. Requirements and dependencies
3. Usage instructions
4. Parameter descriptions
5. Example usage
6. Expected outputs

Format as markdown documentation.
`;

    return await this.generateContent(prompt, { maxOutputTokens: 1536 });
  }

  async runPipelineStage(stageName, context) {
    const stagePrompts = {
      'Data Ingestion': `
Analyze and process data ingestion for an AI pipeline:

Context: ${JSON.stringify(context, null, 2)}

Provide detailed steps for:
1. Data source validation
2. Data loading strategy
3. Initial data quality checks
4. Error handling for data issues
5. Progress monitoring

Return actionable steps and code snippets if needed.
`,
      'Processing': `
Design data processing pipeline for:

Context: ${JSON.stringify(context, null, 2)}

Include:
1. Data cleaning procedures
2. Feature engineering steps
3. Data transformation logic
4. Validation checkpoints
5. Performance optimization

Provide implementation details and best practices.
`,
      'Model Training': `
Create model training strategy for:

Context: ${JSON.stringify(context, null, 2)}

Design:
1. Model selection rationale
2. Training pipeline setup
3. Hyperparameter tuning approach
4. Validation strategy
5. Performance monitoring

Include code examples and monitoring setup.
`,
      'Deployment': `
Plan deployment strategy for ML model:

Context: ${JSON.stringify(context, null, 2)}

Cover:
1. Model packaging and versioning
2. Deployment infrastructure
3. Monitoring and alerting
4. Rollback procedures
5. Performance tracking

Provide deployment checklist and implementation guide.
`
    };

    const prompt = stagePrompts[stageName] || `Process ${stageName} stage with context: ${JSON.stringify(context, null, 2)}`;
    return await this.generateContent(prompt);
  }
}

export default GeminiService;