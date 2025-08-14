import React, { useState, useEffect } from 'react';
import { GitHubConfig, FileMap } from '../types';
import GeminiService from '../services/GeminiService';

interface CodeReviewResult {
  file: string;
  issues: CodeIssue[];
  metrics: CodeMetrics;
  suggestions: CodeSuggestion[];
}

interface CodeIssue {
  line: number;
  type: 'error' | 'warning' | 'suggestion' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  rule: string;
  fixSuggestion?: string;
}

interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  technicalDebt: number;
  codeSmells: number;
  duplications: number;
}

interface CodeSuggestion {
  type: 'optimization' | 'refactoring' | 'best-practice' | 'security';
  title: string;
  description: string;
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
}

interface AICodeReviewAssistantProps {
  files: FileMap;
  githubConfig?: GitHubConfig;
  geminiService?: GeminiService;
  onCodeUpdate?: (filename: string, content: string) => void;
}

const AICodeReviewAssistant: React.FC<AICodeReviewAssistantProps> = ({
  files,
  githubConfig,
  geminiService,
  onCodeUpdate
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewResults, setReviewResults] = useState<CodeReviewResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [overallMetrics, setOverallMetrics] = useState<CodeMetrics | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<string[]>([]);

  const analyzeCodeQuality = async () => {
    if (!geminiService) {
      console.error('Gemini service not available');
      return;
    }

    setIsAnalyzing(true);
    const results: CodeReviewResult[] = [];
    let overallComplexity = 0;
    let overallMaintainability = 0;
    let totalIssues = 0;

    try {
      for (const [filename, content] of Object.entries(files)) {
        if (shouldAnalyzeFile(filename)) {
          const prompt = `
            Perform a comprehensive code review on the following ${getFileLanguage(filename)} file:

            File: ${filename}
            \`\`\`${getFileLanguage(filename)}
            ${content}
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

          try {
            const aiResponse = await geminiService.generateContent(prompt, {
              temperature: 0.3,
              maxOutputTokens: 2048
            });

            // Parse AI response and extract structured data
            const analysisResult = parseAIAnalysis(aiResponse, filename);
            results.push(analysisResult);

            overallComplexity += analysisResult.metrics.complexity;
            overallMaintainability += analysisResult.metrics.maintainability;
            totalIssues += analysisResult.issues.length;
          } catch (error) {
            console.error(`Failed to analyze ${filename}:`, error);
          }
        }
      }

      // Calculate overall metrics
      const fileCount = results.length;
      if (fileCount > 0) {
        setOverallMetrics({
          complexity: Math.round(overallComplexity / fileCount),
          maintainability: Math.round(overallMaintainability / fileCount),
          testCoverage: 0, // Would be calculated from test files
          technicalDebt: Math.round(totalIssues / fileCount * 10),
          codeSmells: results.reduce((sum, r) => sum + r.metrics.codeSmells, 0),
          duplications: results.reduce((sum, r) => sum + r.metrics.duplications, 0)
        });
      }

      setReviewResults(results);
      
      // Add to analysis history
      const timestamp = new Date().toLocaleString();
      setAnalysisHistory(prev => [`Code review completed at ${timestamp}`, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('Code analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAIAnalysis = (aiResponse: string, filename: string): CodeReviewResult => {
    try {
      // Try to extract JSON from the AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          file: filename,
          issues: parsed.issues || [],
          metrics: {
            complexity: parsed.metrics?.complexity || 1,
            maintainability: parsed.metrics?.maintainability || 8,
            testCoverage: 0,
            technicalDebt: parsed.metrics?.technicalDebt || 1,
            codeSmells: parsed.metrics?.codeSmells || 0,
            duplications: parsed.metrics?.duplications || 0
          },
          suggestions: parsed.suggestions || []
        };
      }
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
    }

    // Fallback result
    return {
      file: filename,
      issues: [],
      metrics: {
        complexity: 1,
        maintainability: 8,
        testCoverage: 0,
        technicalDebt: 1,
        codeSmells: 0,
        duplications: 0
      },
      suggestions: []
    };
  };

  const shouldAnalyzeFile = (filename: string): boolean => {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  };

  const getFileLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby'
    };
    return languageMap[extension || ''] || 'text';
  };

  const getIssueColor = (type: string, severity: string) => {
    if (type === 'error') return 'text-red-600 bg-red-50 border-red-200';
    if (type === 'security') return 'text-purple-600 bg-purple-50 border-purple-200';
    if (severity === 'critical') return 'text-red-600 bg-red-50 border-red-200';
    if (severity === 'high') return 'text-orange-600 bg-orange-50 border-orange-200';
    if (severity === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getMetricColor = (value: number, reverse: boolean = false) => {
    if (reverse) {
      if (value <= 3) return 'text-green-600';
      if (value <= 6) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 8) return 'text-green-600';
      if (value >= 5) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const applyFix = (filename: string, suggestion: CodeSuggestion) => {
    if (onCodeUpdate && files[filename]) {
      const updatedContent = files[filename].replace(suggestion.before, suggestion.after);
      onCodeUpdate(filename, updatedContent);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Code Review Assistant</h3>
                <p className="text-gray-600 dark:text-gray-400">Intelligent code analysis and improvement suggestions</p>
              </div>
            </div>
            <button
              onClick={analyzeCodeQuality}
              disabled={isAnalyzing || !geminiService}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-lg disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Start Analysis'
              )}
            </button>
          </div>
        </div>

        {/* Overall Metrics */}
        {overallMetrics && (
          <div className="px-6 py-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Code Quality Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(overallMetrics.maintainability)}`}>
                  {overallMetrics.maintainability}/10
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Maintainability</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(overallMetrics.complexity, true)}`}>
                  {overallMetrics.complexity}/10
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Complexity</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMetricColor(overallMetrics.technicalDebt, true)}`}>
                  {overallMetrics.technicalDebt}/10
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tech Debt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {overallMetrics.codeSmells}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Code Smells</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {overallMetrics.duplications}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Duplications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {reviewResults.reduce((sum, r) => sum + r.issues.length, 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Issues</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Analysis Results */}
      {reviewResults.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">File Analysis Results</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* File List */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Files</h5>
                {reviewResults.map((result) => (
                  <button
                    key={result.file}
                    onClick={() => setSelectedFile(result.file)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedFile === result.file
                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.file}
                      </span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {result.issues.length} issues
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="lg:col-span-2">
                  {(() => {
                    const result = reviewResults.find(r => r.file === selectedFile);
                    if (!result) return null;

                    return (
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedFile} - Issues & Suggestions
                        </h5>

                        {/* Issues */}
                        {result.issues.length > 0 && (
                          <div className="space-y-3">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Issues</h6>
                            {result.issues.map((issue, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border ${getIssueColor(issue.type, issue.severity)}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                                        Line {issue.line}
                                      </span>
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                                        {issue.type}
                                      </span>
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                                        {issue.severity}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium">{issue.message}</p>
                                    {issue.fixSuggestion && (
                                      <p className="text-xs mt-2 opacity-75">
                                        💡 {issue.fixSuggestion}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {result.suggestions.length > 0 && (
                          <div className="space-y-3">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Improvement Suggestions</h6>
                            {result.suggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                      {suggestion.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {suggestion.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => applyFix(selectedFile, suggestion)}
                                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                  >
                                    Apply Fix
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">Before:</div>
                                    <pre className="bg-red-50 dark:bg-red-900/20 p-2 rounded border overflow-x-auto">
                                      <code>{suggestion.before}</code>
                                    </pre>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">After:</div>
                                    <pre className="bg-green-50 dark:bg-green-900/20 p-2 rounded border overflow-x-auto">
                                      <code>{suggestion.after}</code>
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analysis History</h4>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {analysisHistory.map((entry, index) => (
                <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICodeReviewAssistant;