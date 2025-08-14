import React, { useState, useEffect } from 'react';
import { GitHubIntegrationProps, GitHubConfig, RepoStructure } from '../types';
import backendAPI from '../services/BackendAPI';

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  language: string;
  updated_at: string;
  stargazers_count: number;
  default_branch: string;
}

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
  
  // Enhanced repository selector state
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<GitHubRepository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearchTerm, setRepoSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [repoFilter, setRepoFilter] = useState<'all' | 'owner' | 'member'>('all');

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

  // Filter repositories based on search term and filter type
  useEffect(() => {
    if (!repositories.length) {
      setFilteredRepositories([]);
      return;
    }

    let filtered = repositories;

    // Apply search filter
    if (repoSearchTerm) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(repoSearchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(repoSearchTerm.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(repoSearchTerm.toLowerCase())
      );
    }

    // Apply ownership filter
    if (repoFilter === 'owner') {
      filtered = filtered.filter(repo => !repo.fork && repo.full_name.split('/')[0] === validationResult?.user);
    } else if (repoFilter === 'member') {
      filtered = filtered.filter(repo => repo.full_name.split('/')[0] !== validationResult?.user);
    }

    setFilteredRepositories(filtered);
  }, [repositories, repoSearchTerm, repoFilter, validationResult?.user]);

  const validateToken = async (token: string) => {
    setIsValidating(true);
    try {
      const result = await backendAPI.validateToken(token);
      setValidationResult(result);
      if (result.valid) {
        await loadRepositories(token);
      }
    } catch (error) {
      setValidationResult({ valid: false });
    }
    setIsValidating(false);
  };

  const loadRepositories = async (token: string) => {
    setIsLoadingRepos(true);
    try {
      // This would be implemented in the backend API
      // For now, using a placeholder implementation
      const response = await fetch('https://api.github.com/user/repos?per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
    }
    setIsLoadingRepos(false);
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
    setRepositories([]);
    setSelectedRepo(null);
    if (token) {
      validateToken(token);
    }
  };

  const handleRepositorySelect = (repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setConfig({
      ...config,
      owner: repo.full_name.split('/')[0],
      repo: repo.name,
      branch: repo.default_branch
    });
    setShowRepoSelector(false);
  };

  const handleSave = () => {
    localStorage.setItem('github-config', JSON.stringify(config));
    onConfigSave(config);
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      'C#': '#239120',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#fa7343',
      Kotlin: '#A97BFF',
    };
    return colors[language] || '#6b7280';
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Enhanced Professional GitHub Integration */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">GitHub Integration</h3>
              <p className="text-gray-600 dark:text-gray-400">Connect and deploy to your GitHub repositories</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* GitHub Authentication */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={config.token}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-all duration-200"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                {isValidating && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              {validationResult && (
                <div className={`mt-3 p-3 rounded-lg flex items-center space-x-3 ${
                  validationResult.valid 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <span className="text-lg">
                    {validationResult.valid ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${
                      validationResult.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {validationResult.valid ? 'Token authenticated successfully' : 'Invalid token'}
                    </p>
                    {validationResult.valid && validationResult.user && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Authenticated as {validationResult.user}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Create a token at{' '}
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  GitHub Settings
                </a>
                {' '}with repo permissions
              </div>
            </div>

            {/* Repository Selector */}
            {validationResult?.valid && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Repository Selection
                  </label>
                  {repositories.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {repositories.length} repositories available
                    </span>
                  )}
                </div>

                {selectedRepo ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">📁</div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {selectedRepo.full_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedRepo.description || 'No description'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {selectedRepo.language && (
                              <span className="flex items-center space-x-1">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: getLanguageColor(selectedRepo.language) }}
                                ></div>
                                <span>{selectedRepo.language}</span>
                              </span>
                            )}
                            <span>⭐ {selectedRepo.stargazers_count}</span>
                            <span>{selectedRepo.private ? '🔒 Private' : '🌐 Public'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRepoSelector(true)}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRepoSelector(true)}
                    disabled={isLoadingRepos}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
                  >
                    <div className="text-center">
                      {isLoadingRepos ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                          <span className="text-gray-600 dark:text-gray-400">Loading repositories...</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl mb-2">📁</div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select a repository
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Choose from your GitHub repositories
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repository Selector Modal */}
      {showRepoSelector && repositories.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select Repository
              </h3>
              <button
                onClick={() => setShowRepoSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={repoSearchTerm}
                    onChange={(e) => setRepoSearchTerm(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex space-x-2">
                  {['all', 'owner', 'member'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRepoFilter(filter as any)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        repoFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {filter === 'all' ? 'All repositories' : filter === 'owner' ? 'Owned by me' : 'Member of'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repository List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRepositories.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => handleRepositorySelect(repo)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {repo.full_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {repo.description || 'No description available'}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          {repo.language && (
                            <span className="flex items-center space-x-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                              ></div>
                              <span>{repo.language}</span>
                            </span>
                          )}
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                          {repo.private && <span>🔒 Private</span>}
                          {repo.fork && <span>🍴 Fork</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredRepositories.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {repoSearchTerm ? 'No repositories match your search' : 'No repositories found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Configuration */}
      {validationResult?.valid && selectedRepo && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            Save Configuration
          </button>
        </div>
      )}
    </div>
  );
};

export default GitHubIntegration;
