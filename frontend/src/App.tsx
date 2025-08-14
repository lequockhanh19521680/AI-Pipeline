import React, { useState, useEffect } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Pipeline from './components/Pipeline';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import ProjectInput from './components/ProjectInput';
import PreviewPanel from './components/PreviewPanel';
import BackendStatus from './components/BackendStatus';
import PipelineFlow from './components/PipelineFlow';
import StageDetailModal from './components/StageDetailModal';
import ProjectManagement from './components/ProjectManagement';
import GitHubIntegration from './components/GitHubIntegration';
import AdvancedPipelineBuilder from './components/AdvancedPipelineBuilder';
import PipelineDashboard from './components/PipelineDashboard';
import AICodeReviewAssistant from './components/AICodeReviewAssistant';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import GeminiService from './services/GeminiService';
import backendAPI from './services/BackendAPI';
import webSocketManager from './services/WebSocketManager';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useFileStore } from './store/fileStore';
import { useProjectsStore } from './store/projectsStore';
import { useSoftwarePipeline } from './hooks/useSoftwarePipeline';
import { useMLPipeline } from './hooks/useMLPipeline';
import { 
  ProjectMetadata,
  GitHubConfig,
  MLPipelineConfig
} from './types';
import { PIPELINE_STATUS } from './data';

const App: React.FC = () => {
  // Use new store hooks and custom hooks
  const { isAuthenticated, user } = useAuthStore();
  const { 
    isDarkMode, 
    currentFile, 
    openTabs,
    terminalOutput,
    showProjectInput,
    showPreview, 
    showBackendStatus,
    showAuthModal,
    showStageDetail,
    showProjectManagement,
    showGitHubIntegration,
    currentView,
    pipelineView,
    authMode,
    backendConnected,
    setTheme,
    addTerminalMessage,
    openTab,
    closeTab,
    setCurrentFile,
    togglePanel,
    setPanel,
    setCurrentView,
    setPipelineView,
    setAuthMode,
    setBackendConnected
  } = useUIStore();
  
  const { files, updateFile } = useFileStore();
  const { projects, currentProject, setCurrentProject } = useProjectsStore();
  
  const {
    projectConfig,
    runPipeline: runSoftwarePipeline,
    handleProjectSubmit,
    downloadProject,
    resetPipeline: resetSoftwarePipeline
  } = useSoftwarePipeline();
  
  const {
    mlPipelineStages,
    currentMLPipeline,
    selectedStage,
    runMLPipeline,
    handleStageClick,
    setShowStageDetail: setMLStageDetail
  } = useMLPipeline();

  // Minimal remaining state for features not yet migrated
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    localStorage.getItem('gemini_api_key') || ''
  );
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  
  // GitHub Integration state
  const [githubConfig, setGitHubConfig] = useState<GitHubConfig | null>(null);

  // Initialize theme on mount and load data
  useEffect(() => {
    // Load GitHub config
    const savedGitHubConfig = localStorage.getItem('github-config');
    if (savedGitHubConfig) {
      setGitHubConfig(JSON.parse(savedGitHubConfig));
    }

    // Initialize backend connection
    initializeBackend();
  }, []);

  // Initialize Gemini service when API key changes
  useEffect(() => {
    if (geminiApiKey) {
      setGeminiService(new GeminiService(geminiApiKey));
    } else {
      setGeminiService(null);
    }
  }, [geminiApiKey]);

  // Update panels based on project type
  useEffect(() => {
    if (projectConfig) {
      if (projectConfig.projectType === 'frontend' || projectConfig.projectType === 'fullstack') {
        setPanel('showPreview', true);
      }
      if (projectConfig.projectType === 'backend' || projectConfig.projectType === 'fullstack') {
        setPanel('showBackendStatus', true);
      }
    }
  }, [projectConfig, setPanel]);

  const initializeBackend = async () => {
    try {
      const isHealthy = await backendAPI.healthCheck();
      setBackendConnected(isHealthy);
      
      if (isHealthy) {
        addTerminalMessage('🔗 Backend connection established');
        
        // Initialize WebSocket connection
        try {
          await webSocketManager.connect();
          addTerminalMessage('📡 Real-time updates enabled');
        } catch (error) {
          addTerminalMessage('⚠️ WebSocket connection failed - real-time updates disabled');
        }
      } else {
        addTerminalMessage('⚠️ Backend connection failed - some features may be limited');
      }
    } catch (error) {
      setBackendConnected(false);
      addTerminalMessage('❌ Backend unavailable - running in offline mode');
    }
  };

  // Simple delegation functions
  const openFile = (filename: string): void => {
    openTab(filename);
  };

  const updateFileContent = (filename: string, content: string): void => {
    updateFile(filename, content);
  };

  const startNewProject = (): void => {
    togglePanel('showProjectInput');
  };

  const runPipeline = async (): Promise<void> => {
    if (!geminiService) {
      addTerminalMessage('❌ Error: Gemini API key not configured');
      addTerminalMessage('Please set your API key in the settings');
      return;
    }
    await runSoftwarePipeline(geminiService);
  };

  const handleApiKeyChange = (key: string): void => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleTerminalCommand = (command: string): void => {
    addTerminalMessage(`$ ${command}`);
    
    switch (command.toLowerCase()) {
      case 'clear':
        // Clear terminal would be handled by UI store
        break;
      case 'new':
      case 'new project':
        startNewProject();
        addTerminalMessage('📝 Opening project configuration...');
        break;
      case 'download':
        downloadProject();
        break;
      case 'help':
        addTerminalMessage('📚 Available commands:');
        addTerminalMessage('  • clear - Clear terminal');
        addTerminalMessage('  • new - Create new project');
        addTerminalMessage('  • download - Download project');
        addTerminalMessage('  • help - Show this help');
        break;
      default:
        addTerminalMessage(`❓ Unknown command: ${command}`);
        addTerminalMessage('💡 Type "help" for available commands');
    }
  };

  // Project management handlers
  const handleProjectCreate = (project: ProjectMetadata): void => {
    // Would delegate to projects store
    addTerminalMessage(`📝 Project created: ${project.name}`);
    setCurrentView('code');
  };

  const handleProjectSelect = (project: ProjectMetadata): void => {
    setCurrentProject(project);
    addTerminalMessage(`📂 Project loaded: ${project.name}`);
    setCurrentView('code');
  };

  const handleProjectDelete = (projectId: string): void => {
    // Would delegate to projects store  
    addTerminalMessage('🗑️ Project deleted');
  };

  // GitHub integration handlers
  const handleGitHubConfigSave = (config: GitHubConfig): void => {
    setGitHubConfig(config);
    addTerminalMessage(`🐙 GitHub integration configured for ${config.owner}/${config.repo}`);
  };

  const deployToGitHub = async (): Promise<void> => {
    if (!githubConfig) {
      addTerminalMessage('❌ GitHub integration not configured');
      setPanel('showGitHubIntegration', true);
      return;
    }

    if (!projectConfig) {
      addTerminalMessage('❌ No project to deploy');
      return;
    }

    addTerminalMessage('🚀 Deploying to GitHub...');
    // Implementation would use backend API
  };

  const handleProjectLoad = (project: ProjectMetadata): void => {
    setCurrentProject(project);
    // Switch to code view to start the pipeline
    setCurrentView('code');
    addTerminalMessage(`🚀 Project loaded: ${project.name} - Ready to start pipeline!`);
  };

  const handleStageHover = (stageId: string | null): void => {
    // Optional: Add hover effects or tooltips
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col">
        {/* Modals */}
        <ProjectInput 
          onProjectSubmit={handleProjectSubmit}
          isVisible={showProjectInput}
          onProjectCreate={handleProjectCreate}
        />

        {selectedStage && (
          <StageDetailModal
            stage={selectedStage}
            isOpen={showStageDetail}
            onClose={() => setMLStageDetail(false)}
          />
        )}

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => setPanel('showAuthModal', false)}
                  className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="clear-both pt-2">
                  {authMode === 'login' && (
                    <Login
                      onSuccess={() => setPanel('showAuthModal', false)}
                      onSwitchToRegister={() => setAuthMode('register')}
                    />
                  )}
                  {authMode === 'register' && (
                    <Register
                      onSuccess={() => setPanel('showAuthModal', false)}
                      onSwitchToLogin={() => setAuthMode('login')}
                    />
                  )}
                  {authMode === 'profile' && (
                    <Profile
                      onClose={() => setPanel('showAuthModal', false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Professional Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Logo and Brand */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Pipeline IDE</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Professional Edition v3.0</p>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="hidden sm:flex items-center space-x-4">
                  {/* Connection Status */}
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`w-2.5 h-2.5 rounded-full ${backendConnected ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-red-400 shadow-red-400/50 shadow-sm'}`}></div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {backendConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>

                  {/* Pipeline Status - temporarily disabled until pipeline status available */}
                  {/*
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm`}>
                    <span className={`w-2 h-2 rounded-full mr-2`}></span>
                    Pipeline Status
                  </div>
                  */}
                </div>
              </div>

              {/* Theme Toggle and Authentication */}
              <div className="flex items-center space-x-2">
                <ThemeToggle isDarkMode={isDarkMode} onToggle={setTheme} />
                
                {/* Authentication */}
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setAuthMode('profile');
                      setPanel('showAuthModal', true);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="View Profile"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user?.profile?.firstName?.[0]?.toUpperCase() || user?.username[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.profile?.firstName || user?.username}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setPanel('showAuthModal', true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setPanel('showAuthModal', true);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-inner">
                {[
                  { id: 'code', name: 'AI Code', icon: '💻' },
                  { id: 'pipeline', name: 'ML Pipeline', icon: '🔄' },
                  { id: 'projects', name: 'Projects', icon: '📁' },
                  { id: 'github', name: 'GitHub', icon: '🐙' },
                  { id: 'review', name: 'Code Review', icon: '🔍' },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id as any)}
                    className={`
                      px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 min-w-[100px] justify-center
                      ${currentView === view.id
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <span className="text-base">{view.icon}</span>
                    <span className="hidden sm:inline">{view.name}</span>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {currentView === 'pipeline' && (
                  <button
                    onClick={() => runMLPipeline(projectConfig!, backendConnected)}
                    disabled={!backendConnected}
                    className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    Run ML Pipeline
                  </button>
                )}

                {currentView === 'code' && (
                  <>
                    {projectConfig && (
                      <>
                        <button
                          onClick={runPipeline}
                          disabled={!projectConfig}
                          className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                          </svg>
                          Start Pipeline
                        </button>

                        {githubConfig && (
                          <button
                            onClick={deployToGitHub}
                            className="inline-flex items-center px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                            </svg>
                            Deploy
                          </button>
                        )}
                      </>
                    )}
                    
                    {!projectConfig && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl">
                        Create a project in the Projects tab to get started
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Dual View System */}
        <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* Render different views based on currentView */}
          {currentView === 'code' && (
            <>
              {/* Sidebar */}
              <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <FileTree
                  files={Object.keys(files)}
                  currentFile={currentFile}
                  onFileSelect={openFile}
                />
                <Pipeline 
                  status={PIPELINE_STATUS.IDLE} // TODO: get from pipeline store
                  apiKey={geminiApiKey}
                  onApiKeyChange={handleApiKeyChange}
                  currentStage={null} // TODO: get from pipeline store
                  stageResults={{}} // TODO: get from pipeline store
                  stages={[]} // TODO: get stages from data
                />
              </aside>

              {/* Main Editor Area */}
              <main className="flex-1 flex flex-col">
                {/* Tabs */}
                <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-4">
                  <div className="flex items-center space-x-1 -mb-px">
                    {openTabs.map(filename => (
                      <button
                        key={filename}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm border-t border-l border-r border-gray-200 dark:border-gray-600 rounded-t-lg ${
                          filename === currentFile
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => openFile(filename)}
                      >
                        <svg className={`h-4 w-4 ${filename === currentFile ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{filename}</span>
                        {openTabs.length > 1 && (
                          <button
                            className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeTab(filename);
                            }}
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Editor and Panels Layout */}
                <div className="flex-1 flex">
                  {/* Code Editor */}
                  <div className="flex-1 flex flex-col">
                    <Editor
                      value={files[currentFile] || ''}
                      content={files[currentFile] || ''}
                      filename={currentFile}
                      onChange={(content) => updateFileContent(currentFile, content)}
                    />
                  </div>

                  {/* Right Panel - Terminal */}
                  <div className="w-96 border-l border-gray-200 dark:border-gray-600 flex flex-col">
                    <Terminal
                      messages={terminalOutput}
                      output={terminalOutput}
                      isVisible={true}
                      onCommand={handleTerminalCommand}
                      geminiService={geminiService}
                      files={files}
                      currentFile={currentFile}
                      onCodeUpdate={updateFileContent}
                      projectConfig={projectConfig}
                    />
                  </div>
                </div>
              </main>
            </>
          )}

          {currentView === 'pipeline' && (
            <div className="flex-1 flex flex-col">
              {/* Pipeline Sub-Navigation */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
                  {[
                    { id: 'builder', name: 'Pipeline Builder', icon: '🔧' },
                    { id: 'flow', name: 'Execution Flow', icon: '🔄' },
                    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
                  ].map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setPipelineView(view.id as any)}
                      className={`
                        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 min-w-[120px] justify-center
                        ${pipelineView === view.id
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md ring-1 ring-gray-200 dark:ring-gray-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }
                      `}
                    >
                      <span className="text-base">{view.icon}</span>
                      <span>{view.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pipeline Content Area */}
              <div className="flex-1 flex flex-col">
                {pipelineView === 'builder' && (
                  <AdvancedPipelineBuilder
                    pipeline={currentMLPipeline ? {
                      id: currentMLPipeline.id,
                      name: currentMLPipeline.name,
                      description: currentMLPipeline.description,
                      nodes: [],
                      edges: [],
                      category: 'data-processing' as const,
                      createdAt: new Date(),
                      updatedAt: new Date()
                    } : undefined}
                    onPipelineChange={(pipeline) => {
                      // Convert pipeline to MLPipelineConfig format
                      const mlConfig: MLPipelineConfig = {
                        id: pipeline.id,
                        name: pipeline.name,
                        description: pipeline.description,
                        stages: pipeline.nodes.map(node => ({
                          id: node.id,
                          name: node.data.label,
                          status: 'idle' as const,
                          logs: [],
                          outputs: {},
                          artifacts: []
                        }))
                      };
                      // setCurrentMLPipeline hook function not available here, would need to be passed
                      // TODO: implement pipeline change handler
                    }}
                    className="flex-1"
                  />
                )}
                
                {pipelineView === 'flow' && (
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900">
                    <PipelineFlow
                      stages={mlPipelineStages}
                      currentStage={undefined} // TODO: get from pipeline store
                      onStageClick={handleStageClick}
                      onStageHover={handleStageHover}
                      nodes={[]}
                      edges={[]}
                      onNodesChange={() => {}}
                      onEdgesChange={() => {}}
                      onConnect={() => {}}
                      onNodeClick={() => {}}
                    />
                  </div>
                )}
                
                {pipelineView === 'dashboard' && (
                  <PipelineDashboard className="flex-1" />
                )}
              </div>
              
              {/* Pipeline Info Panel - Only show for flow view */}
              {pipelineView === 'flow' && (
                <div className="h-64 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pipeline Status</h3>
                  <div className="space-y-2">
                    {currentMLPipeline && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Pipeline:</strong> {currentMLPipeline.name}
                      </div>
                    )}
                    <div className="grid grid-cols-5 gap-2">
                      {mlPipelineStages.map((stage) => (
                        <div
                          key={stage.id}
                          className={`p-2 rounded text-center text-xs cursor-pointer transition-colors ${
                            stage.status === 'running'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : stage.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : stage.status === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                          onClick={() => handleStageClick(stage.id)}
                        >
                          <div className="font-medium">{stage.name}</div>
                          <div className="capitalize">{stage.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'projects' && (
            <div className="flex-1 p-6 overflow-y-auto">
              {isAuthenticated ? (
                <ProjectManagement
                  projects={projects}
                  currentProject={currentProject}
                  onProjectSelect={handleProjectSelect}
                  onProjectCreate={handleProjectCreate}
                  onProjectLoad={handleProjectLoad}
                  onProjectDelete={handleProjectDelete}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="mb-6">
                      <i className="fas fa-lock text-6xl text-gray-400 dark:text-gray-600"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Authentication Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Please sign in to access your projects and create new ones.
                    </p>
                    <div className="space-x-4">
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setPanel('showAuthModal', true);
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('register');
                          setPanel('showAuthModal', true);
                        }}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'github' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <GitHubIntegration
                isVisible={true}
                onConfigSave={handleGitHubConfigSave}
              />
            </div>
          )}

          {currentView === 'review' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <AICodeReviewAssistant
                files={files}
                githubConfig={githubConfig || undefined}
                geminiService={geminiService || undefined}
                onCodeUpdate={(filename, content) => {
                  updateFileContent(filename, content);
                  addTerminalMessage(`📝 Applied code fix to ${filename}`);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;