import React, { useState, useEffect, useReducer } from 'react';
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
import AICodeReviewAssistant from './components/AICodeReviewAssistant';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import { initialFiles, PIPELINE_STATUS, PIPELINE_STAGES, getDefaultProjectConfig } from './data';
import GeminiService from './services/GeminiService';
import backendAPI from './services/BackendAPI';
import webSocketService from './services/WebSocketService';
import { downloadProjectAsZip } from './utils/download';
import { useAuthStore } from './store/authStore';
import { 
  FileMap, 
  PipelineStatus, 
  StageResults, 
  PipelineConfig, 
  PipelineContext,
  PipelineError,
  MLPipelineStage,
  MLPipelineConfig,
  ProjectMetadata,
  GitHubConfig,
  MLPipelineStageType
} from './types';

// Consolidated state management types
interface AppState {
  // Pipeline state
  pipelineStatus: PipelineStatus;
  currentStage: string | null;
  stageResults: StageResults;
  isLoading: boolean;
  
  // File management
  files: FileMap;
  currentFile: string;
  
  // UI state
  showProjectInput: boolean;
  showPreview: boolean;
  showBackendStatus: boolean;
  currentView: 'code' | 'pipeline' | 'projects' | 'github' | 'review';
}

// Action types
type AppAction = 
  | { type: 'START_PIPELINE'; payload: { stage: string; status: PipelineStatus } }
  | { type: 'STAGE_COMPLETE'; payload: { stage: string; results: any } }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { filename: string; content: string } }
  | { type: 'SELECT_FILE'; payload: { filename: string } }
  | { type: 'SET_VIEW'; payload: { view: 'code' | 'pipeline' | 'projects' | 'github' | 'review' } }
  | { type: 'TOGGLE_PANEL'; payload: { panel: 'projectInput' | 'preview' | 'backendStatus' } }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_PIPELINE_STATUS'; payload: { status: PipelineStatus } }
  | { type: 'SET_CURRENT_STAGE'; payload: { stage: string | null } }
  | { type: 'UPDATE_STAGE_RESULTS'; payload: { stage: string; results: any } }
  | { type: 'SET_FILES'; payload: { files: FileMap } }
  | { type: 'PIPELINE_COMPLETE' }
  | { type: 'PIPELINE_ERROR' };

// Initial state
const initialState: AppState = {
  pipelineStatus: PIPELINE_STATUS.IDLE,
  currentStage: null,
  stageResults: {},
  isLoading: false,
  files: initialFiles,
  currentFile: 'project-requirements.md',
  showProjectInput: false,
  showPreview: false,
  showBackendStatus: false,
  currentView: 'code'
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'START_PIPELINE':
      return {
        ...state,
        pipelineStatus: action.payload.status,
        currentStage: action.payload.stage,
        isLoading: true
      };
    
    case 'STAGE_COMPLETE':
      return {
        ...state,
        stageResults: {
          ...state.stageResults,
          [action.payload.stage]: action.payload.results
        },
        isLoading: false
      };
    
    case 'UPDATE_FILE_CONTENT':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.filename]: action.payload.content
        }
      };
    
    case 'SELECT_FILE':
      return {
        ...state,
        currentFile: action.payload.filename
      };
    
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload.view
      };
    
    case 'TOGGLE_PANEL':
      const { panel } = action.payload;
      return {
        ...state,
        showProjectInput: panel === 'projectInput' ? !state.showProjectInput : state.showProjectInput,
        showPreview: panel === 'preview' ? !state.showPreview : state.showPreview,
        showBackendStatus: panel === 'backendStatus' ? !state.showBackendStatus : state.showBackendStatus
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.loading
      };

    case 'SET_PIPELINE_STATUS':
      return {
        ...state,
        pipelineStatus: action.payload.status
      };

    case 'SET_CURRENT_STAGE':
      return {
        ...state,
        currentStage: action.payload.stage
      };

    case 'UPDATE_STAGE_RESULTS':
      return {
        ...state,
        stageResults: {
          ...state.stageResults,
          [action.payload.stage]: action.payload.results
        }
      };

    case 'SET_FILES':
      return {
        ...state,
        files: action.payload.files
      };

    case 'PIPELINE_COMPLETE':
      return {
        ...state,
        pipelineStatus: PIPELINE_STATUS.COMPLETED,
        currentStage: null,
        isLoading: false
      };

    case 'PIPELINE_ERROR':
      return {
        ...state,
        pipelineStatus: PIPELINE_STATUS.ERROR,
        isLoading: false
      };
    
    default:
      return state;
  }
};

const App: React.FC = () => {
  // Consolidated state management with useReducer
  const [appState, dispatch] = useReducer(appReducer, initialState);
  
  // Remaining individual state hooks for complex or unrelated state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '🤖 AI Pipeline IDE v3.0.0 - Professional Edition',
    '✨ Enhanced with real ML pipelines and GitHub integration',
    '🚀 Ready to build production-ready applications!'
  ]);
  const [openTabs, setOpenTabs] = useState<string[]>(['project-requirements.md']);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    localStorage.getItem('gemini_api_key') || ''
  );
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Enhanced state for new features
  const [projectConfig, setProjectConfig] = useState<PipelineConfig | null>(null);
  const [qaFeedback, setQaFeedback] = useState<string>('');
  
  // New ML Pipeline state
  const [mlPipelineStages, setMLPipelineStages] = useState<MLPipelineStage[]>([]);
  const [currentMLPipeline, setCurrentMLPipeline] = useState<MLPipelineConfig | null>(null);
  const [selectedStage, setSelectedStage] = useState<MLPipelineStage | null>(null);
  const [showStageDetail, setShowStageDetail] = useState<boolean>(false);
  
  // Project Management state
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [showProjectManagement, setShowProjectManagement] = useState<boolean>(false);
  
  // GitHub Integration state
  const [showGitHubIntegration, setShowGitHubIntegration] = useState<boolean>(false);
  const [githubConfig, setGitHubConfig] = useState<GitHubConfig | null>(null);
  
  // Authentication state
  const { isAuthenticated, user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'profile'>('login');
  
  // UI State
  const [currentView, setCurrentView] = useState<'code' | 'pipeline' | 'projects' | 'github' | 'review'>('code');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Initialize theme on mount and load data
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }

    // Load projects from localStorage
    const savedProjects = localStorage.getItem('ai-pipeline-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    // Load GitHub config
    const savedGitHubConfig = localStorage.getItem('github-config');
    if (savedGitHubConfig) {
      setGitHubConfig(JSON.parse(savedGitHubConfig));
    }

    // Initialize backend connection
    initializeBackend();

    // Initialize default ML pipeline stages
    initializeMLPipeline();
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

  // Update panels based on project type
  useEffect(() => {
    if (projectConfig) {
      if (projectConfig.projectType === 'frontend' || projectConfig.projectType === 'fullstack') {
        dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'preview' } });
      }
      if (projectConfig.projectType === 'backend' || projectConfig.projectType === 'fullstack') {
        dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'backendStatus' } });
      }
    }
  }, [projectConfig]);

  const initializeBackend = async () => {
    try {
      const isHealthy = await backendAPI.healthCheck();
      setBackendConnected(isHealthy);
      
      if (isHealthy) {
        addToTerminal('🔗 Backend connection established');
        
        // Initialize WebSocket connection
        try {
          await webSocketService.connect();
          setupWebSocketListeners();
          addToTerminal('📡 Real-time updates enabled');
        } catch (error) {
          addToTerminal('⚠️ WebSocket connection failed - real-time updates disabled');
        }
      } else {
        addToTerminal('⚠️ Backend connection failed - some features may be limited');
      }
    } catch (error) {
      setBackendConnected(false);
      addToTerminal('❌ Backend unavailable - running in offline mode');
    }
  };

  const initializeMLPipeline = () => {
    const defaultStages: MLPipelineStage[] = [
      {
        id: 'data_ingestion',
        name: 'Data Ingestion',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'preprocessing',
        name: 'Data Preprocessing', 
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'model_training',
        name: 'Model Training',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'evaluation',
        name: 'Model Evaluation',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'deployment',
        name: 'Model Deployment',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      }
    ];
    setMLPipelineStages(defaultStages);
  };

  const setupWebSocketListeners = () => {
    webSocketService.onStageStart((event) => {
      addToTerminal(`🚀 Stage started: ${event.data.stage}`);
      updateMLPipelineStage(event.stageId!, { status: 'running', startTime: new Date() });
    });

    webSocketService.onStageComplete((event) => {
      addToTerminal(`✅ Stage completed: ${event.data.stage}`);
      updateMLPipelineStage(event.stageId!, { 
        status: 'completed', 
        endTime: new Date(),
        outputs: event.data.outputs || {}
      });
    });

    webSocketService.onStageError((event) => {
      addToTerminal(`❌ Stage failed: ${event.data.error}`);
      updateMLPipelineStage(event.stageId!, { status: 'error', endTime: new Date() });
    });

    webSocketService.onPipelineComplete((event) => {
      addToTerminal('🎉 ML Pipeline completed successfully!');
      dispatch({ type: 'PIPELINE_COMPLETE' });
    });

    webSocketService.onLog((log) => {
      const logMessage = `[${log.stage || 'SYSTEM'}] ${log.message}`;
      addToTerminal(logMessage);
      
      // Add log to the specific stage
      if (log.stage) {
        updateMLPipelineStage(log.stage, (stage) => ({
          logs: [...stage.logs, log.message]
        }));
      }
    });
  };

  const updateMLPipelineStage = (stageId: string, update: Partial<MLPipelineStage> | ((stage: MLPipelineStage) => Partial<MLPipelineStage>)) => {
    setMLPipelineStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const updateData = typeof update === 'function' ? update(stage) : update;
        return { ...stage, ...updateData };
      }
      return stage;
    }));
  };

  // File operations
  const openFile = (filename: string): void => {
    dispatch({ type: 'SELECT_FILE', payload: { filename } });
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }
  };

  const closeTab = (filename: string): void => {
    const newTabs = openTabs.filter(tab => tab !== filename);
    setOpenTabs(newTabs);
    if (appState.currentFile === filename && newTabs.length > 0) {
      dispatch({ type: 'SELECT_FILE', payload: { filename: newTabs[newTabs.length - 1] } });
    }
  };

  const updateFileContent = (filename: string, content: string): void => {
    dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { filename, content } });
  };

  const addToTerminal = (message: string): void => {
    setTerminalOutput(prev => [...prev, message]);
  };

  // New pipeline operations for software development workflow
  const startNewProject = (): void => {
    dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'projectInput' } });
  };

  const handleProjectSubmit = (config: PipelineConfig): void => {
    setProjectConfig(config);
    dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'projectInput' } });
    
    // Update initial files based on project type
    const newFiles = { ...initialFiles };
    newFiles['project-config.json'] = JSON.stringify(config, null, 2);
    dispatch({ type: 'SET_FILES', payload: { files: newFiles } });
    
    addToTerminal(`🎯 Project "${config.projectName}" configured`);
    addToTerminal(`📋 Type: ${config.projectType}`);
    addToTerminal(`📝 Description: ${config.description}`);
    addToTerminal('✅ Ready to start AI Pipeline!');
  };

  const runPipeline = async (): Promise<void> => {
    if (!geminiService) {
      addToTerminal('❌ Error: Gemini API key not configured');
      addToTerminal('Please set your API key in the settings');
      return;
    }

    if (!projectConfig) {
      addToTerminal('❌ Error: No project configured');
      addToTerminal('Please create a new project first');
      dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'projectInput' } });
      return;
    }

    dispatch({ type: 'START_PIPELINE', payload: { stage: 'initialization', status: PIPELINE_STATUS.RUNNING } });
    setQaFeedback('');
    setRetryCount(0);
    addToTerminal('🚀 Starting AI Software Development Pipeline...');
    addToTerminal(`🎯 Project: ${projectConfig.projectName} (${projectConfig.projectType})`);
    
    try {
      await runSoftwarePipelineWithGemini();
      dispatch({ type: 'STAGE_COMPLETE', payload: { stage: 'pipeline', results: 'completed' } });
      addToTerminal('🎉 Software development pipeline completed successfully!');
      addToTerminal('💡 Your project is ready for download and development!');
    } catch (error) {
      dispatch({ type: 'PIPELINE_ERROR' });
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
      dispatch({ type: 'SET_CURRENT_STAGE', payload: { stage: null } });
      dispatch({ type: 'SET_LOADING', payload: { loading: false } });
    }
  };

  const runSoftwarePipelineWithGemini = async (): Promise<void> => {
    const stages = Object.values(PIPELINE_STAGES);
    const context: PipelineContext = {
      files: appState.files,
      currentFile: appState.currentFile,
      config: projectConfig!,
      qaFeedback
    };

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      dispatch({ type: 'SET_CURRENT_STAGE', payload: { stage } });
      addToTerminal(`👨‍💼 ${stage} starting analysis...`);
      
      let stageRetries = 0;
      const maxStageRetries = 2;
      
      while (stageRetries <= maxStageRetries) {
        try {
          const result = await geminiService!.runPipelineStage(stage, {
            ...context,
            previousResults: appState.stageResults,
            stageIndex: i + 1,
            totalStages: stages.length
          });
          
          dispatch({ type: 'UPDATE_STAGE_RESULTS', payload: { stage, results: result } });
          
          addToTerminal(`✅ ${stage} completed successfully`);
          
          // Handle specific stage results
          if (stage === 'AI Developer') {
            // Parse and add generated files
            parseAndAddGeneratedFiles(result);
          } else if (stage === 'AI QA Engineer') {
            // Store QA feedback for refinement stage
            setQaFeedback(result);
            addToTerminal('🔍 QA analysis complete - issues identified for refinement');
          } else if (stage === 'AI Developer (Refinement)') {
            // Parse and update files with fixes
            parseAndUpdateRefinedFiles(result);
          }
          
          if (stageRetries > 0) {
            addToTerminal(`🔄 Self-healing successful after ${stageRetries} retry(ies)`);
          }
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 1500));
          break;
          
        } catch (error) {
          stageRetries++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          if (stageRetries <= maxStageRetries) {
            addToTerminal(`⚠️ ${stage} failed (attempt ${stageRetries}/${maxStageRetries + 1}): ${errorMessage}`);
            addToTerminal(`🔄 Retrying ${stage} with enhanced recovery...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * stageRetries));
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
    
    setRetryCount(0);
  };

  const parseAndAddGeneratedFiles = (result: string): void => {
    // Parse the AI Developer result for file content
    const fileBlocks = result.split('```');
    const newFiles: FileMap = { ...appState.files };
    
    for (let i = 0; i < fileBlocks.length; i++) {
      const block = fileBlocks[i];
      if (block.includes('File:') || block.includes('filename:')) {
        const lines = block.split('\n');
        const fileName = lines[0].replace(/File:|filename:|```/g, '').trim();
        if (fileName && i + 1 < fileBlocks.length) {
          const content = fileBlocks[i + 1].trim();
          if (content && fileName.length > 0) {
            newFiles[fileName] = content;
            addToTerminal(`📄 Generated: ${fileName}`);
          }
        }
      }
    }
    
    // Add some default files if none were generated
    if (Object.keys(newFiles).length === Object.keys(appState.files).length) {
      const projectType = projectConfig?.projectType || 'frontend';
      
      if (projectType === 'frontend' || projectType === 'fullstack') {
        newFiles['index.html'] = generateDefaultHTML(projectConfig!);
        newFiles['style.css'] = generateDefaultCSS();
        newFiles['script.js'] = generateDefaultJS();
        addToTerminal('📄 Generated default frontend files');
      }
      
      if (projectType === 'backend' || projectType === 'fullstack') {
        newFiles['server.js'] = generateDefaultServer();
        newFiles['package.json'] = generateDefaultPackageJson(projectConfig!);
        addToTerminal('📄 Generated default backend files');
      }
    }
    
    dispatch({ type: 'SET_FILES', payload: { files: newFiles } });
    
    // Open the main file
    const mainFile = newFiles['index.html'] || newFiles['server.js'] || Object.keys(newFiles)[0];
    if (mainFile && mainFile !== appState.currentFile) {
      openFile(Object.keys(newFiles).find(name => newFiles[name] === mainFile) || Object.keys(newFiles)[0]);
    }
  };

  const parseAndUpdateRefinedFiles = (result: string): void => {
    // Similar to parseAndAddGeneratedFiles but for refinements
    parseAndAddGeneratedFiles(result);
    addToTerminal('🔧 Code refinements applied based on QA feedback');
  };

  const downloadProject = async (): Promise<void> => {
    if (!projectConfig) {
      addToTerminal('❌ No project to download');
      return;
    }
    
    const success = await downloadProjectAsZip(appState.files, projectConfig.projectName);
    if (success) {
      addToTerminal(`📦 Project "${projectConfig.projectName}" downloaded successfully!`);
      addToTerminal('🚀 Extract and run "npm install" to get started');
    } else {
      addToTerminal('❌ Failed to download project');
    }
  };

  // Helper functions for generating default files
  const generateDefaultHTML = (config: PipelineConfig): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.projectName}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 ${config.projectName}</h1>
            <p>${config.description}</p>
        </header>
        
        <main>
            <section class="features">
                <h2>Features</h2>
                <ul>
                    ${config.features.map(feature => `<li>${feature}</li>`).join('\n                    ')}
                </ul>
            </section>
            
            <section class="tech-stack">
                <h2>Technology Stack</h2>
                <div class="tech-list">
                    ${config.techStack?.frontend?.map(tech => `<span class="tech-tag">${tech}</span>`).join('\n                    ') || ''}
                </div>
            </section>
        </main>
        
        <footer>
            <p>Generated with AI Pipeline IDE</p>
        </footer>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;
  };

  const generateDefaultCSS = (): string => {
    return `/* Modern CSS for AI Generated Project */
:root {
    --primary-color: #3b82f6;
    --secondary-color: #1e40af;
    --accent-color: #f59e0b;
    --text-color: #1f2937;
    --bg-color: #ffffff;
    --bg-secondary: #f9fafb;
    --border-color: #e5e7eb;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: var(--bg-color);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    border-radius: 1rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
}

header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid var(--border-color);
}

header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 1rem;
}

header p {
    font-size: 1.2rem;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto;
}

.features {
    margin-bottom: 3rem;
}

.features h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: var(--secondary-color);
}

.features ul {
    list-style: none;
}

.features li {
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    border-left: 4px solid var(--primary-color);
}

.tech-stack {
    margin-bottom: 3rem;
}

.tech-stack h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: var(--secondary-color);
}

.tech-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.tech-tag {
    background: var(--primary-color);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

footer {
    text-align: center;
    padding-top: 2rem;
    border-top: 2px solid var(--border-color);
    color: #6b7280;
}

@media (max-width: 768px) {
    .container {
        margin: 1rem;
        padding: 1.5rem;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .tech-list {
        justify-content: center;
    }
}`;
  };

  const generateDefaultJS = (): string => {
    return `// JavaScript for AI Generated Project
console.log('🚀 AI Generated Project Loaded!');

// Modern JavaScript features and functionality
class ProjectApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.animateElements();
        this.showWelcomeMessage();
    }
    
    setupEventListeners() {
        // Add interactive functionality
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM fully loaded');
            this.highlightFeatures();
        });
        
        // Add click handlers for interactive elements
        const techTags = document.querySelectorAll('.tech-tag');
        techTags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                this.showTechInfo(e.target.textContent);
            });
        });
    }
    
    animateElements() {
        // Simple fade-in animation
        const elements = document.querySelectorAll('.features li, .tech-tag');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    highlightFeatures() {
        const features = document.querySelectorAll('.features li');
        features.forEach(feature => {
            feature.addEventListener('mouseenter', () => {
                feature.style.transform = 'translateX(10px)';
                feature.style.transition = 'transform 0.3s ease';
            });
            
            feature.addEventListener('mouseleave', () => {
                feature.style.transform = 'translateX(0)';
            });
        });
    }
    
    showTechInfo(tech) {
        alert(\`You clicked on: \${tech}\\n\\nThis technology is part of our modern stack!\`);
    }
    
    showWelcomeMessage() {
        setTimeout(() => {
            console.log('✨ Welcome to your AI-generated project!');
            console.log('🛠️ Start customizing and building amazing features!');
        }, 1000);
    }
}

// Initialize the application
const app = new ProjectApp();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectApp;
}`;
  };

  const generateDefaultServer = (): string => {
    return `// Express.js Server for AI Generated Project
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'AI Generated API',
        version: '1.0.0',
        description: 'RESTful API generated by AI Pipeline IDE',
        endpoints: [
            'GET /api/health',
            'GET /api/info',
            'GET /api/users',
            'POST /api/users'
        ]
    });
});

// Users API example
let users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

app.get('/api/users', (req, res) => {
    res.json({
        status: 'success',
        data: users,
        count: users.length
    });
});

app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: 'User not found'
        });
    }
    
    res.json({
        status: 'success',
        data: user
    });
});

app.post('/api/users', (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            status: 'error',
            message: 'Name and email are required'
        });
    }
    
    const newUser = {
        id: users.length + 1,
        name,
        email
    };
    
    users.push(newUser);
    
    res.status(201).json({
        status: 'success',
        data: newUser,
        message: 'User created successfully'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
    console.log(\`📊 Health check: http://localhost:\${PORT}/api/health\`);
    console.log(\`📋 API info: http://localhost:\${PORT}/api/info\`);
});

module.exports = app;`;
  };

  const generateDefaultPackageJson = (config: PipelineConfig): string => {
    return JSON.stringify({
      name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: config.description,
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        morgan: '^1.10.0'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        jest: '^29.7.0'
      },
      keywords: config.features.concat(['ai-generated', 'express', 'api']),
      author: 'AI Pipeline IDE',
      license: 'MIT'
    }, null, 2);
  };

  const handleTerminalCommand = (command: string): void => {
    addToTerminal(`$ ${command}`);
    
    // Handle enhanced terminal commands
    switch (command.toLowerCase()) {
      case 'clear':
        setTerminalOutput(['🤖 AI Pipeline IDE v2.0.0', '✨ Ready to build amazing projects!']);
        break;
      case 'new':
      case 'new project':
        startNewProject();
        addToTerminal('📝 Opening project configuration...');
        break;
      case 'download':
        downloadProject();
        break;
      case 'status':
        addToTerminal(`📊 Pipeline Status: ${appState.pipelineStatus}`);
        if (projectConfig) {
          addToTerminal(`🎯 Project: ${projectConfig.projectName}`);
          addToTerminal(`📋 Type: ${projectConfig.projectType}`);
        }
        break;
      case 'help':
        addToTerminal('📚 Available commands:');
        addToTerminal('  • clear - Clear terminal');
        addToTerminal('  • new - Create new project');
        addToTerminal('  • download - Download project');
        addToTerminal('  • status - Show pipeline status');
        addToTerminal('  • help - Show this help');
        break;
      default:
        addToTerminal(`❓ Unknown command: ${command}`);
        addToTerminal('💡 Type "help" for available commands');
    }
  };

  const handleApiKeyChange = (key: string): void => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const getStatusClassName = (status: PipelineStatus): string => {
    switch (status) {
      case PIPELINE_STATUS.RUNNING:
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case PIPELINE_STATUS.COMPLETED:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case PIPELINE_STATUS.ERROR:
        return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusDotClassName = (status: PipelineStatus): string => {
    switch (status) {
      case PIPELINE_STATUS.RUNNING:
        return 'bg-blue-500 animate-pulse shadow-blue-500/50 shadow-sm';
      case PIPELINE_STATUS.COMPLETED:
        return 'bg-emerald-500 shadow-emerald-500/50 shadow-sm';
      case PIPELINE_STATUS.ERROR:
        return 'bg-red-500 shadow-red-500/50 shadow-sm';
      default:
        return 'bg-gray-400 shadow-gray-400/50 shadow-sm';
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

  // New enhanced pipeline functions
  const runMLPipeline = async (): Promise<void> => {
    if (!backendConnected) {
      addToTerminal('❌ Backend connection required for ML Pipeline execution');
      addToTerminal('💡 Please ensure the backend server is running');
      return;
    }

    if (!projectConfig) {
      addToTerminal('❌ No project configured for ML Pipeline');
      dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'projectInput' } });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: { loading: true } });
    dispatch({ type: 'SET_PIPELINE_STATUS', payload: { status: PIPELINE_STATUS.RUNNING } });
    dispatch({ type: 'SET_CURRENT_STAGE', payload: { stage: null } });
    addToTerminal('🚀 Starting ML Pipeline execution...');
    addToTerminal(`🎯 Project: ${projectConfig.projectName}`);

    try {
      // Create ML pipeline configuration
      const mlConfig: Partial<MLPipelineConfig> = {
        name: `${projectConfig.projectName} ML Pipeline`,
        description: projectConfig.description,
        dataPath: './data/sample_data.csv',
        outputPath: `./outputs/${Date.now()}`
      };

      // Create pipeline through backend
      const pipeline = await backendAPI.createPipeline(mlConfig);
      setCurrentMLPipeline(pipeline);
      addToTerminal(`📋 ML Pipeline created: ${pipeline.id}`);

      // Join WebSocket room for real-time updates
      webSocketService.joinPipeline(pipeline.id);

      // Execute the pipeline
      const executionId = await backendAPI.executePipeline(pipeline.id, pipeline);
      addToTerminal(`🔄 Execution started: ${executionId}`);

    } catch (error) {
      dispatch({ type: 'PIPELINE_ERROR' });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToTerminal(`❌ ML Pipeline failed: ${errorMessage}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { loading: false } });
    }
  };

  // Enhanced project management functions
  const handleProjectCreate = (project: ProjectMetadata): void => {
    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    localStorage.setItem('ai-pipeline-projects', JSON.stringify(updatedProjects));
    
    setCurrentProject(project);
    addToTerminal(`📝 Project created: ${project.name}`);
    
    // Convert to PipelineConfig for compatibility
    const pipelineConfig: PipelineConfig = {
      projectType: project.type,
      projectName: project.name,
      description: project.description,
      requirements: 'Generated from project metadata',
      techStack: getDefaultTechStack(project.type),
      features: ['Core functionality', 'User interface', 'Error handling']
    };
    
    setProjectConfig(pipelineConfig);
    project.pipelineConfig = pipelineConfig;
    setCurrentView('code');
  };

  const handleProjectSelect = (project: ProjectMetadata): void => {
    setCurrentProject(project);
    if (project.pipelineConfig) {
      setProjectConfig(project.pipelineConfig);
    }
    addToTerminal(`📂 Project loaded: ${project.name}`);
    setCurrentView('code');
  };

  const handleProjectDelete = (projectId: string): void => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('ai-pipeline-projects', JSON.stringify(updatedProjects));
    
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setProjectConfig(null);
    }
    addToTerminal(`🗑️ Project deleted`);
  };

  const handleProjectLoad = (project: ProjectMetadata): void => {
    setCurrentProject(project);
    if (project.pipelineConfig) {
      setProjectConfig(project.pipelineConfig);
    }
    // Switch to code view to start the pipeline
    setCurrentView('code');
    addToTerminal(`🚀 Project loaded: ${project.name} - Ready to start pipeline!`);
  };

  const getDefaultTechStack = (type: 'frontend' | 'backend' | 'fullstack') => {
    switch (type) {
      case 'frontend':
        return { frontend: ['React', 'TypeScript', 'Tailwind CSS'] };
      case 'backend':
        return { backend: ['Node.js', 'Express', 'TypeScript'] };
      case 'fullstack':
        return { 
          frontend: ['React', 'TypeScript', 'Tailwind CSS'],
          backend: ['Node.js', 'Express', 'TypeScript'],
          database: 'PostgreSQL'
        };
    }
  };

  // GitHub integration functions
  const handleGitHubConfigSave = (config: GitHubConfig): void => {
    setGitHubConfig(config);
    addToTerminal(`🐙 GitHub integration configured for ${config.owner}/${config.repo}`);
  };

  const deployToGitHub = async (): Promise<void> => {
    if (!githubConfig) {
      addToTerminal('❌ GitHub integration not configured');
      setShowGitHubIntegration(true);
      return;
    }

    if (!projectConfig) {
      addToTerminal('❌ No project to deploy');
      return;
    }

    addToTerminal('🚀 Deploying to GitHub...');

    try {
      // Prepare generated code in correct format - for now, combine all files into one
      const combinedContent = Object.entries(appState.files)
        .map(([filename, content]) => `// File: ${filename}\n${content}`)
        .join('\n\n');
      
      const generatedCode: any = {
        filename: 'combined-project.txt',
        content: combinedContent,
        path: 'combined-project.txt'
      };

      // Push code to repository
      const prDetails = await backendAPI.pushCode(
        githubConfig.token,
        githubConfig.owner,
        githubConfig.repo,
        githubConfig.branch || 'main',
        [generatedCode],
        `AI-generated: ${projectConfig.projectName}`
      );

      addToTerminal(`📤 Code pushed to branch: ${prDetails.branch}`);

      // Create pull request
      const prDetailsCreate = await backendAPI.createPR(
        githubConfig.token,
        githubConfig,
        prDetails.branch,
        `Add ${projectConfig.projectName}`,
        `AI-generated application: ${projectConfig.description}`,
        generatedCode
      );

      addToTerminal(`🔄 Pull request created: #${prDetailsCreate.number}`);
      addToTerminal(`🔗 URL: ${prDetails.url}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToTerminal(`❌ GitHub deployment failed: ${errorMessage}`);
    }
  };

  // Pipeline flow interaction handlers
  const handleStageClick = (stageId: string): void => {
    const stage = mlPipelineStages.find(s => s.id === stageId);
    if (stage) {
      setSelectedStage(stage);
      setShowStageDetail(true);
    }
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
          isVisible={appState.showProjectInput}
          onProjectCreate={handleProjectCreate}
        />

        {selectedStage && (
          <StageDetailModal
            stage={selectedStage}
            isOpen={showStageDetail}
            onClose={() => setShowStageDetail(false)}
          />
        )}

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="clear-both pt-2">
                  {authMode === 'login' && (
                    <Login
                      onSuccess={() => setShowAuthModal(false)}
                      onSwitchToRegister={() => setAuthMode('register')}
                    />
                  )}
                  {authMode === 'register' && (
                    <Register
                      onSuccess={() => setShowAuthModal(false)}
                      onSwitchToLogin={() => setAuthMode('login')}
                    />
                  )}
                  {authMode === 'profile' && (
                    <Profile
                      onClose={() => setShowAuthModal(false)}
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

                  {/* Pipeline Status */}
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${getStatusClassName(appState.pipelineStatus)}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${getStatusDotClassName(appState.pipelineStatus)}`}></span>
                    {getStatusText(appState.pipelineStatus)}
                  </div>
                </div>
              </div>

              {/* Theme Toggle and Authentication */}
              <div className="flex items-center space-x-2">
                <ThemeToggle isDarkMode={isDarkMode} onToggle={(value) => setIsDarkMode(value)} />
                
                {/* Authentication */}
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setAuthMode('profile');
                      setShowAuthModal(true);
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
                        setShowAuthModal(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setShowAuthModal(true);
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
                    onClick={runMLPipeline}
                    disabled={appState.pipelineStatus === PIPELINE_STATUS.RUNNING || appState.isLoading || !backendConnected}
                    className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {appState.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                        Run ML Pipeline
                      </>
                    )}
                  </button>
                )}

                {currentView === 'code' && (
                  <>
                    {projectConfig && (
                      <>
                        <button
                          onClick={runPipeline}
                          disabled={appState.pipelineStatus === PIPELINE_STATUS.RUNNING || appState.isLoading || !projectConfig}
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
                  files={Object.keys(appState.files)}
                  currentFile={appState.currentFile}
                  onFileSelect={openFile}
                />
                <Pipeline 
                  status={appState.pipelineStatus}
                  apiKey={geminiApiKey}
                  onApiKeyChange={handleApiKeyChange}
                  currentStage={appState.currentStage}
                  stageResults={appState.stageResults}
                  stages={Object.values(PIPELINE_STAGES)}
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
                          filename === appState.currentFile
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => openFile(filename)}
                      >
                        <svg className={`h-4 w-4 ${filename === appState.currentFile ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      value={appState.files[appState.currentFile] || ''}
                      content={appState.files[appState.currentFile] || ''}
                      filename={appState.currentFile}
                      onChange={(content) => updateFileContent(appState.currentFile, content)}
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
                      files={appState.files}
                      currentFile={appState.currentFile}
                      onCodeUpdate={updateFileContent}
                    />
                  </div>
                </div>
              </main>
            </>
          )}

          {currentView === 'pipeline' && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-gray-50 dark:bg-gray-900">
                <PipelineFlow
                  stages={mlPipelineStages}
                  currentStage={appState.currentStage || undefined}
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
              
              {/* Pipeline Info Panel */}
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
                          setShowAuthModal(true);
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('register');
                          setShowAuthModal(true);
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
                files={appState.files}
                githubConfig={githubConfig || undefined}
                geminiService={geminiService || undefined}
                onCodeUpdate={(filename, content) => {
                  updateFileContent(filename, content);
                  addToTerminal(`📝 Applied code fix to ${filename}`);
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