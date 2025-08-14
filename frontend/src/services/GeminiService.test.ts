import { describe, it, expect, beforeEach } from 'vitest';
import GeminiService from '../services/GeminiService';

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    geminiService = new GeminiService('test-api-key');
  });

  it('should create a GeminiService instance', () => {
    expect(geminiService).toBeDefined();
  });

  it('should set API key', () => {
    const newKey = 'new-test-key';
    geminiService.setApiKey(newKey);
    // Since apiKey is private, we can't directly test it, but we can test that setApiKey doesn't throw
    expect(() => geminiService.setApiKey(newKey)).not.toThrow();
  });

  it('should validate required API key for content generation', async () => {
    const emptyService = new GeminiService('');
    
    await expect(emptyService.generateContent('test prompt')).rejects.toThrow('Gemini API key is required');
  });
});