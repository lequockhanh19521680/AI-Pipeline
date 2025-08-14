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
import { z } from 'zod';
import { SchemaRegistry, SchemaType } from '../prompts/schemas';
import PromptManager from '../prompts/PromptManager';

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

  // Robust JSON parsing with retry mechanism
  async parseJsonResponse<T>(
    responseText: string, 
    schemaType: SchemaType,
    originalPrompt?: string,
    maxRetries: number = 2
  ): Promise<T> {
    const schema = SchemaRegistry[schemaType];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Try to extract JSON from response
        const jsonText = this.extractJsonFromResponse(responseText);
        const parsedData = JSON.parse(jsonText);
        
        // Validate with schema
        const validatedData = schema.parse(parsedData);
        return validatedData as T;
        
      } catch (error) {
        console.warn(`JSON parsing attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries && originalPrompt) {
          // Retry with corrected prompt
          const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
          const retryPrompt = PromptManager.generateRetry(originalPrompt, errorMessage);
          
          try {
            responseText = await this.generateContent(retryPrompt, {
              temperature: 0.1,
              maxOutputTokens: 2048
            });
          } catch (retryError) {
            console.error(`Retry attempt ${attempt + 1} failed:`, retryError);
            throw new GeminiError(`JSON parsing failed after ${attempt + 1} attempts: ${errorMessage}`);
          }
        } else {
          throw new GeminiError(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    throw new GeminiError('Maximum retry attempts exceeded');
  }

  private extractJsonFromResponse(responseText: string): string {
    // Remove markdown code blocks
    let cleanText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object boundaries
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }
    
    return cleanText.trim();
  }

  // Enhanced pipeline methods using PromptManager
  async analyzeData(dataDescription: string, config: PipelineConfig): Promise<string> {
    const prompt = PromptManager.analyzeData(dataDescription, config);
    return await this.generateContent(prompt);
  }

  async optimizeConfig(config: PipelineConfig, context?: string): Promise<string> {
    const prompt = PromptManager.optimizeConfig(config, context);
    return await this.generateContent(prompt);
  }

  async debugCode(code: string, filename: string, error?: string, context?: string): Promise<string> {
    const prompt = PromptManager.debugCode(code, filename, error, context);
    return await this.generateContent(prompt);
  }

  async generateDocs(code: string, filename: string, projectContext?: PipelineConfig): Promise<string> {
    const prompt = PromptManager.generateDocs(code, filename, projectContext);
    return await this.generateContent(prompt);
  }

  async runPipelineStage(stage: string, context: PipelineContext): Promise<string> {
    const prompt = PromptManager.runPipelineStage(stage, context);
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

  async generateDocumentation(code: string, purpose: string): Promise<string> {
    const prompt = PromptManager.generateDocumentation({ code, filename: purpose });
    return await this.generateContent(prompt);
  }

}

export default GeminiService;
