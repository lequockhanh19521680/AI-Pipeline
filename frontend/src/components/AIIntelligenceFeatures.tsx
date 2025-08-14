import React, { useState, useEffect } from 'react';
import { AICodeSuggestion, CodeAnalysisResult, CodeIssue } from '@shared/interfaces/common.js';
import GeminiService from '../services/GeminiService';
import PromptManager from '../prompts/PromptManager';

interface AIIntelligenceFeaturesProps {
  code: string;
  language: string;
  filename?: string;
  geminiService?: GeminiService;
  onApplySuggestion?: (suggestion: AICodeSuggestion) => void;
  className?: string;
}

export const AIIntelligenceFeatures: React.FC<AIIntelligenceFeaturesProps> = ({
  code,
  language,
  filename = 'untitled',
  geminiService,
  onApplySuggestion,
  className = '',
}) => {
  const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'issues' | 'metrics'>('suggestions');

  // Real AI analysis using Gemini service
  const analyzeCode = async () => {
    if (!geminiService) {
      console.error('Gemini service not available');
      return;
    }

    if (!code.trim()) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Use PromptManager to generate structured code review prompt
      const prompt = PromptManager.generateCodeReview({
        content: code,
        filename,
        language
      });

      const aiResponse = await geminiService.generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 2048
      });

      // Parse the AI response to extract structured data
      const analysisResult = parseAIResponse(aiResponse);
      setAnalysisResult(analysisResult);

    } catch (error) {
      console.error('Failed to analyze code:', error);
      // Show error to user
      setAnalysisResult({
        file: filename,
        issues: [{
          id: '1',
          type: 'error',
          severity: 'high',
          message: 'Failed to analyze code. Please check your Gemini API key and try again.',
          file: filename,
          line: 1,
          column: 1,
          rule: 'analysis-error'
        }],
        suggestions: [],
        metrics: {
          complexity: 0,
          maintainability: 0,
          testCoverage: 0
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Parse AI response into structured format
  const parseAIResponse = (response: string): CodeAnalysisResult => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          file: filename,
          issues: parsed.issues || [],
          suggestions: parsed.suggestions || [],
          metrics: parsed.metrics || {
            complexity: 0,
            maintainability: 0,
            testCoverage: 0
          }
        };
      }

      // Fallback: try to parse the entire response as JSON
      const parsed = JSON.parse(response);
      return {
        file: filename,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        metrics: parsed.metrics || {
          complexity: 0,
          maintainability: 0,
          testCoverage: 0
        }
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      
      // Fallback: create a basic analysis from the text response
      return {
        file: filename,
        issues: [],
        suggestions: [{
          id: '1',
          type: 'improvement',
          title: 'AI Analysis Results',
          description: response.substring(0, 500) + (response.length > 500 ? '...' : ''),
          code: code,
          confidence: 0.7,
          file: filename
        }],
        metrics: {
          complexity: 5,
          maintainability: 7,
          testCoverage: 0
        }
      };
    }
  };

  useEffect(() => {
    if (code && geminiService) {
      const timer = setTimeout(() => {
        analyzeCode();
      }, 1000); // Auto-analyze after 1 second of code changes
      
      return () => clearTimeout(timer);
    }
  }, [code, geminiService]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'text-green-600 bg-green-100';
      case 'improvement': return 'text-blue-600 bg-blue-100';
      case 'bug-fix': return 'text-red-600 bg-red-100';
      case 'feature': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">🤖 AI Code Intelligence</h2>
            <p className="text-sm opacity-90">Real-time code analysis and suggestions</p>
          </div>
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing}
            className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50 dark:bg-gray-800">
        {[
          { id: 'suggestions', label: 'Suggestions', icon: '💡' },
          { id: 'issues', label: 'Issues', icon: '⚠️' },
          { id: 'metrics', label: 'Metrics', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white dark:bg-gray-900'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin text-3xl mb-2">🤖</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI is analyzing your code...
              </p>
            </div>
          </div>
        ) : analysisResult ? (
          <>
            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                {analysisResult.suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(suggestion.type)}`}>
                          {suggestion.type}
                        </span>
                        <h3 className="font-medium mt-1 text-gray-900 dark:text-gray-100">
                          {suggestion.title}
                        </h3>
                      </div>
                      <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-3">
                      <pre className="text-xs overflow-x-auto">
                        <code>{suggestion.code}</code>
                      </pre>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Line {suggestion.line}
                      </span>
                      <button
                        onClick={() => onApplySuggestion?.(suggestion)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="space-y-3">
                {analysisResult.issues.map(issue => (
                  <div
                    key={issue.id}
                    className="border rounded-lg p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {issue.rule}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                          {issue.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Line {issue.line}, Column {issue.column}
                        </p>
                      </div>
                      <div className="text-lg">
                        {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Code Complexity
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(analysisResult.metrics.complexity / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {analysisResult.metrics.complexity}/10
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Maintainability
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${analysisResult.metrics.maintainability * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {analysisResult.metrics.maintainability}/10
                      </span>
                    </div>
                  </div>

                  {analysisResult.metrics.testCoverage && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Test Coverage
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${analysisResult.metrics.testCoverage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {analysisResult.metrics.testCoverage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start typing code to see AI analysis
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIIntelligenceFeatures;