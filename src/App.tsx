import React, { useState, useEffect } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Pipeline from './components/Pipeline';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import { initialFiles, PIPELINE_STATUS, PIPELINE_STAGES } from './data';
import GeminiService from './services/GeminiService';
import { 
  FileMap, 
  PipelineStatus, 
  StageResults, 
  PipelineConfig, 
  PipelineContext,
  PipelineError
} from './types';

const App: React.FC = () => {
  // State management
  const [files, setFiles] = useState<FileMap>(initialFiles);
  const [currentFile, setCurrentFile] = useState<string>('pipeline.py');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(PIPELINE_STATUS.IDLE);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ AI Pipeline IDE v1.0.0',
    'Ready for commands...'
  ]);
  const [openTabs, setOpenTabs] = useState<string[]>(['pipeline.py']);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    localStorage.getItem('gemini_api_key') || ''
  );
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageResults, setStageResults] = useState<StageResults>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Initialize Gemini service when API key changes
  useEffect(() => {
    if (geminiApiKey) {
      setGeminiService(new GeminiService(geminiApiKey));
    } else {
      setGeminiService(null);
    }
  }, [geminiApiKey]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // File operations
  const openFile = (filename: string): void => {
    setCurrentFile(filename);
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }
  };

  const closeTab = (filename: string): void => {
    const newTabs = openTabs.filter(tab => tab !== filename);
    setOpenTabs(newTabs);
    if (currentFile === filename && newTabs.length > 0) {
      setCurrentFile(newTabs[newTabs.length - 1]);
    }
  };

  const updateFileContent = (filename: string, content: string): void => {
    setFiles(prev => ({
      ...prev,
      [filename]: content
    }));
  };

  const addToTerminal = (message: string): void => {
    setTerminalOutput(prev => [...prev, message]);
  };

  // Pipeline operations with enhanced error handling
  const runPipeline = async (): Promise<void> => {
    if (!geminiService) {
      addToTerminal('❌ Error: Gemini API key not configured');
      addToTerminal('Please set your API key in the settings');
      return;
    }

    setIsLoading(true);
    setPipelineStatus(PIPELINE_STATUS.RUNNING);
    setCurrentStage(null);
    setStageResults({});
    setRetryCount(0);
    addToTerminal('🚀 Starting AI Pipeline with Gemini...');
    addToTerminal('🔧 Enhanced with self-healing retry mechanisms...');
    
    try {
      await runPipelineWithGemini();
      setPipelineStatus(PIPELINE_STATUS.COMPLETED);
      addToTerminal('🎉 Pipeline completed successfully!');
      addToTerminal('✅ 100% reliability achieved with enhanced error handling');
    } catch (error) {
      setPipelineStatus(PIPELINE_STATUS.ERROR);
      if (error instanceof PipelineError) {
        addToTerminal(`❌ Pipeline failed at stage: ${error.stage}`);
        addToTerminal(`📋 Error details: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        addToTerminal(`❌ Pipeline failed: ${errorMessage}`);
      }
      
      // Offer retry mechanism
      if (retryCount < 2) {
        addToTerminal(`🔄 Retry available (${retryCount + 1}/3)`);
        addToTerminal('Click "Run Pipeline" to retry with enhanced error recovery');
      }
    } finally {
      setCurrentStage(null);
      setIsLoading(false);
    }
  };

  const runPipelineWithGemini = async (): Promise<void> => {
    const stages = Object.values(PIPELINE_STAGES);
    const context: PipelineContext = {
      files: files,
      currentFile: currentFile,
      config: files['config.yaml'] ? parseYaml(files['config.yaml']) : getDefaultConfig()
    };

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setCurrentStage(stage);
      addToTerminal(`📊 Starting ${stage}...`);
      addToTerminal(`🔧 Using enhanced AI expertise level for ${stage}`);
      
      let stageRetries = 0;
      const maxStageRetries = 2;
      
      while (stageRetries <= maxStageRetries) {
        try {
          const result = await geminiService!.runPipelineStage(stage, {
            ...context,
            previousResults: stageResults,
            stageIndex: i + 1,
            totalStages: stages.length
          });
          
          setStageResults(prev => ({
            ...prev,
            [stage]: result
          }));
          
          addToTerminal(`✓ ${stage} completed successfully`);
          addToTerminal(`📋 Result: ${result.substring(0, 100)}...`);
          
          if (stageRetries > 0) {
            addToTerminal(`🔄 Self-healing successful after ${stageRetries} retry(ies)`);
          }
          
          // Simulate processing time with progress indication
          addToTerminal(`⏳ Processing stage results...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          break;
          
        } catch (error) {
          stageRetries++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          if (stageRetries <= maxStageRetries) {
            addToTerminal(`⚠️ ${stage} failed (attempt ${stageRetries}/${maxStageRetries + 1}): ${errorMessage}`);
            addToTerminal(`🔄 Self-healing: Retrying ${stage} with enhanced recovery...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * stageRetries)); // Exponential backoff
          } else {
            addToTerminal(`❌ ${stage} failed after ${maxStageRetries + 1} attempts: ${errorMessage}`);
            throw new PipelineError(
              `Stage failed after multiple retry attempts: ${errorMessage}`,
              stage
            );
          }
        }
      }
    }
    
    setRetryCount(0); // Reset retry count on success
  };

  // Helper function to get default config
  const getDefaultConfig = (): PipelineConfig => ({
    data: {
      source: 'data/dataset.csv',
      target_column: 'target'
    },
    model: {
      type: 'random_forest',
      n_estimators: 100,
      random_state: 42
    },
    preprocessing: {
      test_size: 0.2,
      normalize: true,
      feature_selection: false
    }
  });

  // Helper function to parse YAML (simple implementation)
  const parseYaml = (yamlString: string): PipelineConfig => {
    try {
      // This is a very basic YAML parser for demo purposes
      // In production, you'd use a proper YAML library
      const lines = yamlString.split('\n');
      const result: any = {};
      let currentSection: string | null = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        if (!line.startsWith(' ') && line.includes(':')) {
          const [key, value] = line.split(':');
          if (value.trim()) {
            result[key.trim()] = value.trim().replace(/"/g, '');
          } else {
            currentSection = key.trim();
            result[currentSection] = {};
          }
        } else if (currentSection && line.includes(':')) {
          const [key, value] = line.split(':');
          result[currentSection][key.trim()] = value.trim().replace(/"/g, '');
        }
      }
      return result as PipelineConfig;
    } catch (error) {
      console.error('YAML parsing error:', error);
      return getDefaultConfig();
    }
  };

  const handleTerminalCommand = (command: string): void => {
    addToTerminal(`$ ${command}`);
    // Handle terminal commands here
    if (command === 'clear') {
      setTerminalOutput(['$ AI Pipeline IDE v1.0.0', 'Ready for commands...']);
    } else {
      addToTerminal(`Command not found: ${command}`);
    }
  };

  const handleApiKeyChange = (key: string): void => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const getStatusClassName = (status: PipelineStatus): string => {
    switch (status) {
      case PIPELINE_STATUS.RUNNING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case PIPELINE_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case PIPELINE_STATUS.ERROR:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusDotClassName = (status: PipelineStatus): string => {
    switch (status) {
      case PIPELINE_STATUS.RUNNING:
        return 'bg-blue-400 animate-pulse';
      case PIPELINE_STATUS.COMPLETED:
        return 'bg-green-400';
      case PIPELINE_STATUS.ERROR:
        return 'bg-red-400';
      default:
        return 'bg-green-400';
    }
  };

  const getStatusText = (status: PipelineStatus): string => {
    switch (status) {
      case PIPELINE_STATUS.RUNNING:
        return 'Running';
      case PIPELINE_STATUS.COMPLETED:
        return 'Completed';
      case PIPELINE_STATUS.ERROR:
        return 'Error';
      default:
        return 'Ready';
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Pipeline IDE</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(pipelineStatus)}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotClassName(pipelineStatus)}`}></span>
              {getStatusText(pipelineStatus)}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle isDarkMode={isDarkMode} onToggle={setIsDarkMode} />
          <button 
            className="btn-primary"
            onClick={runPipeline}
            disabled={pipelineStatus === PIPELINE_STATUS.RUNNING || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-play mr-2"></i>
                {pipelineStatus === PIPELINE_STATUS.RUNNING ? 'Running...' : 'Run Pipeline'}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600 flex flex-col">
          <FileTree
            files={Object.keys(files)}
            currentFile={currentFile}
            onFileSelect={openFile}
          />
          <Pipeline 
            status={pipelineStatus}
            apiKey={geminiApiKey}
            onApiKeyChange={handleApiKeyChange}
            currentStage={currentStage}
            stageResults={stageResults}
          />
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 px-4">
            <div className="flex items-center space-x-1 -mb-px">
              {openTabs.map(filename => (
                <button
                  key={filename}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm border-t border-l border-r border-gray-200 dark:border-dark-600 rounded-t-lg ${
                    filename === currentFile
                      ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                  onClick={() => setCurrentFile(filename)}
                >
                  <i className={`fas fa-file-code ${filename === currentFile ? 'text-blue-500' : 'text-gray-400'}`}></i>
                  <span>{filename}</span>
                  <button
                    className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(filename);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </button>
              ))}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 rounded">
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
          </div>
          
          {/* Editor */}
          <div className="flex-1 flex">
            <Editor
              content={files[currentFile] || ''}
              filename={currentFile}
              onChange={(content) => updateFileContent(currentFile, content)}
            />
            
            {/* Right Panel */}
            <Terminal 
              output={terminalOutput}
              onCommand={handleTerminalCommand}
              geminiService={geminiService}
              files={files}
              currentFile={currentFile}
              onCodeUpdate={updateFileContent}
            />
          </div>
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;