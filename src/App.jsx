import React, { useState, useEffect } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Pipeline from './components/Pipeline';
import ThemeToggle from './components/ThemeToggle';
import { initialFiles, PIPELINE_STATUS } from './data';

function App() {
  // State management
  const [files, setFiles] = useState(initialFiles);
  const [currentFile, setCurrentFile] = useState('pipeline.py');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pipelineStatus, setPipelineStatus] = useState(PIPELINE_STATUS.IDLE);
  const [terminalOutput, setTerminalOutput] = useState([
    '$ AI Pipeline IDE v1.0.0',
    'Ready for commands...'
  ]);
  const [openTabs, setOpenTabs] = useState(['pipeline.py']);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

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
  const openFile = (filename) => {
    setCurrentFile(filename);
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }
  };

  const closeTab = (filename) => {
    const newTabs = openTabs.filter(tab => tab !== filename);
    setOpenTabs(newTabs);
    if (currentFile === filename && newTabs.length > 0) {
      setCurrentFile(newTabs[newTabs.length - 1]);
    }
  };

  const updateFileContent = (filename, content) => {
    setFiles(prev => ({
      ...prev,
      [filename]: content
    }));
  };

  const addToTerminal = (message) => {
    setTerminalOutput(prev => [...prev, message]);
  };

  // Pipeline operations
  const runPipeline = async () => {
    if (!geminiApiKey) {
      addToTerminal('❌ Error: Gemini API key not configured');
      addToTerminal('Please set your API key in the settings');
      return;
    }

    setPipelineStatus(PIPELINE_STATUS.RUNNING);
    addToTerminal('🚀 Starting AI Pipeline with Gemini...');
    
    try {
      // Simulate pipeline execution with Gemini API
      await simulatePipelineWithGemini();
      setPipelineStatus(PIPELINE_STATUS.COMPLETED);
      addToTerminal('🎉 Pipeline completed successfully!');
    } catch (error) {
      setPipelineStatus(PIPELINE_STATUS.ERROR);
      addToTerminal(`❌ Pipeline failed: ${error.message}`);
    }
  };

  const simulatePipelineWithGemini = async () => {
    const stages = [
      { name: 'Data Ingestion', duration: 2000 },
      { name: 'Processing', duration: 3000 },
      { name: 'Model Training', duration: 4000 },
      { name: 'Deployment', duration: 2000 }
    ];

    for (const stage of stages) {
      addToTerminal(`📊 ${stage.name}...`);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      addToTerminal(`✓ ${stage.name} completed`);
    }
  };

  return (
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              pipelineStatus === PIPELINE_STATUS.RUNNING 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : pipelineStatus === PIPELINE_STATUS.COMPLETED
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : pipelineStatus === PIPELINE_STATUS.ERROR
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                pipelineStatus === PIPELINE_STATUS.RUNNING 
                  ? 'bg-blue-400 animate-pulse'
                  : pipelineStatus === PIPELINE_STATUS.COMPLETED
                  ? 'bg-green-400'
                  : pipelineStatus === PIPELINE_STATUS.ERROR
                  ? 'bg-red-400'
                  : 'bg-green-400'
              }`}></span>
              {pipelineStatus === PIPELINE_STATUS.RUNNING 
                ? 'Running'
                : pipelineStatus === PIPELINE_STATUS.COMPLETED
                ? 'Completed'
                : pipelineStatus === PIPELINE_STATUS.ERROR
                ? 'Error'
                : 'Ready'
              }
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle isDarkMode={isDarkMode} onToggle={setIsDarkMode} />
          <button 
            className="btn-primary"
            onClick={runPipeline}
            disabled={pipelineStatus === PIPELINE_STATUS.RUNNING}
          >
            <i className="fas fa-play mr-2"></i>
            {pipelineStatus === PIPELINE_STATUS.RUNNING ? 'Running...' : 'Run Pipeline'}
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
            onApiKeyChange={(key) => {
              setGeminiApiKey(key);
              localStorage.setItem('gemini_api_key', key);
            }}
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
              onCommand={(command) => {
                addToTerminal(`$ ${command}`);
                // Handle terminal commands here
                if (command === 'clear') {
                  setTerminalOutput(['$ AI Pipeline IDE v1.0.0', 'Ready for commands...']);
                } else {
                  addToTerminal(`Command not found: ${command}`);
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;