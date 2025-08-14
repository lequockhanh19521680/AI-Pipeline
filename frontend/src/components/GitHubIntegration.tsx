import React, { useState, useEffect } from 'react';
import { GitHubIntegrationProps, GitHubConfig, RepoStructure } from '../types';
import backendAPI from '../services/BackendAPI';

const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({ isVisible, onConfigSave }) => {
  const [config, setConfig] = useState<GitHubConfig>({
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; user?: string } | null>(null);
  const [repoStructure, setRepoStructure] = useState<RepoStructure | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('github-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      if (parsed.token) {
        validateToken(parsed.token);
      }
    }
  }, []);

  const validateToken = async (token: string) => {
    setIsValidating(true);
    try {
      const result = await backendAPI.validateToken(token);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ valid: false });
    }
    setIsValidating(false);
  };

  const analyzeRepository = async () => {
    if (!config.token || !config.owner || !config.repo) return;

    setIsAnalyzing(true);
    try {
      const structure = await backendAPI.analyzeRepo(config.token, config.owner, config.repo);
      setRepoStructure(structure);
    } catch (error) {
      console.error('Failed to analyze repository:', error);
      setRepoStructure(null);
    }
    setIsAnalyzing(false);
  };

  const handleTokenChange = (token: string) => {
    setConfig({ ...config, token });
    setValidationResult(null);
    if (token) {
      validateToken(token);
    }
  };

  const handleSave = () => {
    localStorage.setItem('github-config', JSON.stringify(config));
    onConfigSave(config);
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-2xl">🐙</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">GitHub Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">Connect your GitHub repository for automatic deployments</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* GitHub Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Personal Access Token
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={config.token}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 pr-10"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              {isValidating && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            
            {validationResult && (
              <div className={`mt-2 text-sm flex items-center space-x-2 ${validationResult.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>{validationResult.valid ? '✅' : '❌'}</span>
                <span>
                  {validationResult.valid 
                    ? `Token valid for user: ${validationResult.user}` 
                    : 'Invalid token'
                  }
                </span>
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Create a token at{' '}
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub Settings
              </a>
              {' '}with repo permissions
            </p>
          </div>

          {/* Repository Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository Owner
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={config.owner}
              onChange={(e) => setConfig({ ...config, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="your-username"
            />
          </div>

          {/* Repository Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={config.repo}
              onChange={(e) => setConfig({ ...config, repo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="my-repository"
            />
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              <span>Advanced Settings</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Branch
                  </label>
                  <input
                    type="text"
                    value={config.branch || 'main'}
                    onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="main"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Branch to create pull requests against
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Repository Analysis */}
          {validationResult?.valid && config.owner && config.repo && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Repository Analysis</h4>
                <button
                  onClick={analyzeRepository}
                  disabled={isAnalyzing}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Analyze
                    </>
                  )}
                </button>
              </div>

              {repoStructure && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Repository</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{repoStructure.fullName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Primary Language</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{repoStructure.language}</p>
                    </div>
                  </div>
                  
                  {repoStructure.description && (
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Description</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{repoStructure.description}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Repository Structure (Top Level)</span>
                    <div className="mt-2 space-y-1">
                      {repoStructure.structure.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span>{item.type === 'directory' ? '📁' : '📄'}</span>
                          <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                      ))}
                      {repoStructure.structure.length > 10 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ... and {repoStructure.structure.length - 10} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {validationResult?.valid ? '✅ Ready for deployment' : '⚠️ Configuration incomplete'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!validationResult?.valid || !config.owner || !config.repo}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">GitHub Integration Features</h4>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Automatically push generated code to your repository</li>
              <li>• Create pull requests with comprehensive descriptions</li>
              <li>• Analyze existing repository structure for intelligent merging</li>
              <li>• Optional auto-merge for seamless deployment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegration;