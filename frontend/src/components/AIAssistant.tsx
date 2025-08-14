import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faSpinner, 
  faCopy, 
  faCode, 
  faWrench, 
  faBug, 
  faFileText,
  faProjectDiagram,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { AIAssistantProps } from '../types';

type AssistantMode = 'analyze' | 'optimize' | 'debug' | 'document' | 'project-wide' | 'suggest-fix';

interface ProjectContext {
  files: Record<string, string>;
  structure: string[];
  currentFile: string;
  projectConfig: any;
  recentChanges: { file: string; timestamp: Date; type: 'edit' | 'create' | 'delete' }[];
}

interface CodeSuggestion {
  type: 'fix' | 'optimization' | 'enhancement';
  description: string;
  code: string;
  file: string;
  line?: number;
  confidence: number;
}

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
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [isContextAnalyzing, setIsContextAnalyzing] = useState(false);

  const modes: Record<AssistantMode, { label: string; icon: any; description: string }> = {
    analyze: { 
      label: 'Analyze Code', 
      icon: faCode, 
      description: 'Deep analysis of current file with context awareness' 
    },
    optimize: { 
      label: 'Optimize', 
      icon: faWrench, 
      description: 'Performance and structure optimization suggestions' 
    },
    debug: { 
      label: 'Debug', 
      icon: faBug, 
      description: 'Find and fix potential issues in your code' 
    },
    document: { 
      label: 'Document', 
      icon: faFileText, 
      description: 'Generate comprehensive documentation' 
    },
    'project-wide': { 
      label: 'Project Analysis', 
      icon: faProjectDiagram, 
      description: 'Analyze entire project structure and dependencies' 
    },
    'suggest-fix': { 
      label: 'Suggest Fix', 
      icon: faCheckCircle, 
      description: 'AI-powered fixes for detected issues' 
    }
  };

  // Build comprehensive project context
  useEffect(() => {
    const buildProjectContext = () => {
      const structure = Object.keys(files).sort();
      const recentChanges: { file: string; timestamp: Date; type: 'edit' | 'create' | 'delete' }[] = [];
      
      // In a real implementation, you'd track actual file changes
      // For now, we'll simulate recent activity
      structure.slice(0, 3).forEach(file => {
        recentChanges.push({
          file,
          timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
          type: 'edit'
        });
      });

      setProjectContext({
        files,
        structure,
        currentFile,
        projectConfig,
        recentChanges
      });
    };

    buildProjectContext();
  }, [files, currentFile, projectConfig]);

  // Analyze project context for intelligent suggestions
  const analyzeProjectContext = useCallback(async () => {
    if (!geminiService || !projectContext) return;

    setIsContextAnalyzing(true);
    try {
      // Build comprehensive context for AI analysis
      const contextData = {
        fileCount: projectContext.structure.length,
        primaryLanguages: detectPrimaryLanguages(projectContext.files),
        projectStructure: projectContext.structure,
        currentFile: projectContext.currentFile,
        recentActivity: projectContext.recentChanges,
        codeComplexity: calculateCodeComplexity(projectContext.files),
        dependencies: extractDependencies(projectContext.files)
      };

      // Generate intelligent suggestions based on full project context
      const contextAnalysis = await performContextualAnalysis(contextData);
      setSuggestions(contextAnalysis);
    } catch (error) {
      console.error('Context analysis failed:', error);
    } finally {
      setIsContextAnalyzing(false);
    }
  }, [geminiService, projectContext]);

  // Perform contextual analysis
  const performContextualAnalysis = async (contextData: any): Promise<CodeSuggestion[]> => {
    // Simulate AI-powered analysis - in production, this would call your AI service
    const suggestions: CodeSuggestion[] = [];

    // Analyze current file for specific issues
    const currentCode = files[currentFile] || '';
    
    // Check for common patterns and suggest improvements
    if (currentCode.includes('console.log') && !currentCode.includes('// DEBUG')) {
      suggestions.push({
        type: 'optimization',
        description: 'Remove debug console.log statements for production',
        code: currentCode.replace(/console\.log\([^)]*\);?\n?/g, ''),
        file: currentFile,
        confidence: 0.9
      });
    }

    // Check for missing error handling
    if (currentCode.includes('await ') && !currentCode.includes('try') && !currentCode.includes('catch')) {
      suggestions.push({
        type: 'fix',
        description: 'Add error handling for async operations',
        code: wrapWithTryCatch(currentCode),
        file: currentFile,
        confidence: 0.85
      });
    }

    // Suggest TypeScript improvements
    if (currentFile.endsWith('.ts') || currentFile.endsWith('.tsx')) {
      if (currentCode.includes(': any')) {
        suggestions.push({
          type: 'enhancement',
          description: 'Replace "any" types with specific type definitions',
          code: improveTypeDefinitions(currentCode),
          file: currentFile,
          confidence: 0.8
        });
      }
    }

    return suggestions;
  };

  // Helper functions for code analysis
  const detectPrimaryLanguages = (files: Record<string, string>): string[] => {
    const extensions = Object.keys(files).map(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      return ext;
    }).filter(Boolean);

    const langMap: Record<string, string> = {
      'ts': 'TypeScript',
      'tsx': 'TypeScript React',
      'js': 'JavaScript',
      'jsx': 'JavaScript React',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C'
    };

    return Array.from(new Set(extensions.map(ext => langMap[ext!]).filter(Boolean)));
  };

  const calculateCodeComplexity = (files: Record<string, string>): number => {
    let totalLines = 0;
    let totalFunctions = 0;

    Object.values(files).forEach(content => {
      const lines = content.split('\n').length;
      const functions = (content.match(/function|const\s+\w+\s*=/g) || []).length;
      totalLines += lines;
      totalFunctions += functions;
    });

    return totalFunctions / Math.max(totalLines / 100, 1); // Functions per 100 lines
  };

  const extractDependencies = (files: Record<string, string>): string[] => {
    const imports = new Set<string>();
    
    Object.values(files).forEach(content => {
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
      importMatches.forEach(match => {
        const dep = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
        if (dep && !dep.startsWith('.')) {
          imports.add(dep.split('/')[0]); // Get package name
        }
      });
    });

    return Array.from(imports);
  };

  const wrapWithTryCatch = (code: string): string => {
    // Simple implementation - in production, you'd use AST parsing
    return `try {\n${code}\n} catch (error) {\n  console.error('Error:', error);\n  // Handle error appropriately\n}`;
  };

  const improveTypeDefinitions = (code: string): string => {
    // Simple replacement - in production, you'd use TypeScript compiler API
    return code.replace(/:\s*any\b/g, ': unknown // TODO: Define proper type');
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
          // Enhanced analysis with project context
          const contextInfo = projectContext ? `
Project Context:
- Files: ${projectContext.structure.length}
- Languages: ${detectPrimaryLanguages(projectContext.files).join(', ')}
- Current file: ${currentFile}
- Recent changes: ${projectContext.recentChanges.length}
          ` : '';
          
          response = await geminiService.analyzeData(
            `${contextInfo}\n\nCode to analyze:\n${currentCode}`,
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
            `Optimize this configuration considering the project structure:\n${JSON.stringify(projectContext?.structure.slice(0, 10), null, 2)}`
          );
          break;
          
        case 'debug':
          response = await geminiService.debugCode(
            currentCode,
            'Please review this code for potential issues and provide specific fixes'
          );
          break;
          
        case 'document':
          response = await geminiService.generateDocumentation(
            currentCode,
            `Generate comprehensive documentation for ${currentFile} in the context of a ${projectConfig?.projectType || 'generic'} project`
          );
          break;
          
        case 'project-wide':
          // Comprehensive project analysis
          const projectSummary = `
Project Overview:
- Type: ${projectConfig?.projectType || 'Unknown'}
- Files: ${Object.keys(files).length}
- Languages: ${detectPrimaryLanguages(files).join(', ')}
- Dependencies: ${extractDependencies(files).join(', ')}
- Complexity Score: ${calculateCodeComplexity(files).toFixed(2)}

Key Files:
${Object.keys(files).slice(0, 5).map(f => `- ${f}`).join('\n')}
          `;
          
          response = await geminiService.analyzeData(
            projectSummary,
            { ...projectConfig, analysisType: 'project-wide' }
          );
          break;
          
        case 'suggest-fix':
          // Generate contextual suggestions
          await analyzeProjectContext();
          response = `Based on the analysis, I found ${suggestions.length} potential improvements. See the suggestions panel below for actionable fixes.`;
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

  // Enhanced apply fix functionality with Monaco editor integration
  const applyCodeSuggestion = (suggestion: CodeSuggestion): void => {
    if (onCodeUpdate && suggestion.file) {
      onCodeUpdate(suggestion.file, suggestion.code);
      
      // Remove applied suggestion from the list
      setSuggestions(prev => prev.filter(s => s !== suggestion));
      
      // Show success feedback
      setResult(`✅ Applied ${suggestion.type}: ${suggestion.description}`);
    }
  };

  const applySuggestionByIndex = (index: number): void => {
    const suggestion = suggestions[index];
    if (suggestion) {
      applyCodeSuggestion(suggestion);
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
      
      const suggestion: CodeSuggestion = {
        type: 'enhancement',
        description: 'Code suggestion from AI analysis',
        code: suggestedCode,
        file: currentFile,
        confidence: 0.8
      };
      
      applyCodeSuggestion(suggestion);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Enhanced Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center mb-3">
          <FontAwesomeIcon icon={faRobot} className="text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Assistant
          </h3>
          {isContextAnalyzing && (
            <FontAwesomeIcon icon={faSpinner} spin className="ml-2 text-blue-500" />
          )}
        </div>
        
        {/* Project Context Summary */}
        {projectContext && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
            <div className="text-gray-600 dark:text-gray-300">
              📊 {projectContext.structure.length} files • 
              🔧 {detectPrimaryLanguages(projectContext.files).join(', ')} • 
              📝 {currentFile}
            </div>
          </div>
        )}
        
        {/* Enhanced Mode Selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assistant Mode
            </label>
            <select
              value={assistantMode}
              onChange={handleModeChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Object.entries(modes).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {modes[assistantMode].description}
            </p>
          </div>
          
          <button
            onClick={handleAnalysis}
            disabled={isLoading || !geminiService}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <FontAwesomeIcon 
              icon={isLoading ? faSpinner : modes[assistantMode].icon} 
              spin={isLoading}
              className="mr-2" 
            />
            {isLoading ? 'Processing...' : `Run ${modes[assistantMode].label}`}
          </button>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* AI Suggestions Panel */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
              Smart Suggestions ({suggestions.length})
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          suggestion.type === 'fix' ? 'bg-red-100 text-red-700' :
                          suggestion.type === 'optimization' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {suggestion.type.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        File: {suggestion.file}
                      </div>
                    </div>
                    <button
                      onClick={() => applySuggestionByIndex(index)}
                      className="ml-3 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                    >
                      Apply Fix
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Analysis Result
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Copy to clipboard"
                >
                  <FontAwesomeIcon icon={faCopy} className="text-xs" />
                </button>
                {result.includes('```') && (
                  <button
                    onClick={extractAndApplyCodeSuggestions}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Apply Code
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}

        {/* Context Analysis Status */}
        {isContextAnalyzing && (
          <div className="text-center py-4">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Analyzing project context...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!result && !error && !isLoading && !isContextAnalyzing && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faRobot} className="text-4xl mb-3 opacity-50" />
            <p className="text-sm">
              Select an analysis mode and click "Run" to get AI-powered insights about your code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;