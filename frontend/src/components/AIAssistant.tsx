import React, { useState } from 'react';
import { AIAssistantProps } from '../types';

type AssistantMode = 'analyze' | 'optimize' | 'debug' | 'document';

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  geminiService, 
  files, 
  currentFile, 
  onCodeUpdate,
  projectConfig
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('analyze');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const modes: Record<AssistantMode, string> = {
    analyze: 'Analyze Code',
    optimize: 'Optimize Config',
    debug: 'Debug Code',
    document: 'Generate Docs'
  };

  const handleAnalysis = async (): Promise<void> => {
    if (!geminiService) {
      setError('Gemini API key not configured');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      let response = '';
      const currentCode = files[currentFile] || '';
      
      switch (assistantMode) {
        case 'analyze':
          if (!projectConfig) {
            setError('Project configuration is required for code analysis');
            setIsLoading(false);
            return;
          }
          response = await geminiService.analyzeData(
            currentCode || `Current file: ${currentFile}`,
            projectConfig
          );
          break;
        case 'optimize':
          if (!projectConfig) {
            setError('Project configuration is required for optimization');
            setIsLoading(false);
            return;
          }
          response = await geminiService.optimizeConfig(
            projectConfig,
            'Request optimization suggestions for the current project configuration'
          );
          break;
        case 'debug':
          response = await geminiService.debugCode(
            currentCode,
            'Please review this code for potential issues'
          );
          break;
        case 'document':
          response = await geminiService.generateDocumentation(
            currentCode,
            `Documentation for ${currentFile}`
          );
          break;
        default:
          response = 'Unknown mode selected';
      }
      
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCodeSuggestion = (suggestedCode: string): void => {
    if (onCodeUpdate && currentFile) {
      onCodeUpdate(currentFile, suggestedCode);
    }
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setAssistantMode(e.target.value as AssistantMode);
  };

  const handleCopyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(result);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const extractAndApplyCodeSuggestions = (): void => {
    // Extract code suggestions from result and apply
    const codeBlocks = result.match(/```[\s\S]*?```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      const suggestedCode = codeBlocks[0]
        .replace(/```\w*\n?/, '')
        .replace(/\n?```$/, '');
      applyCodeSuggestion(suggestedCode);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          AI Assistant
        </h3>
        
        {/* Mode Selection */}
        <div className="space-y-2">
          <select
            value={assistantMode}
            onChange={handleModeChange}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
          >
            {Object.entries(modes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <button
            onClick={handleAnalysis}
            disabled={isLoading || !geminiService}
            className="w-full btn-primary text-xs py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2 inline-block"></div>
                Processing...
              </>
            ) : (
              `Run ${modes[assistantMode]}`
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-4 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-red-600"></i>
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="card p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {modes[assistantMode]} Result
              </h4>
              <div className="bg-gray-50 dark:bg-dark-900 rounded p-3 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {result}
              </div>
            </div>

            {/* Action buttons for code suggestions */}
            {(assistantMode === 'debug' || assistantMode === 'optimize') && (
              <div className="space-y-2">
                <button
                  onClick={extractAndApplyCodeSuggestions}
                  className="w-full btn-secondary text-xs py-1"
                >
                  Apply Suggestions
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="w-full btn-secondary text-xs py-1"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        )}

        {!result && !error && !isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            Select a mode and click "Run" to get AI assistance with your code.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;