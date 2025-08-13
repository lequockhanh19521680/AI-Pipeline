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
import { initialFiles, PIPELINE_STATUS, PIPELINE_STAGES, getDefaultProjectConfig } from './data';
import GeminiService from './services/GeminiService';
import { downloadProjectAsZip } from './utils/download';
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
  const [currentFile, setCurrentFile] = useState<string>('project-requirements.md');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(PIPELINE_STATUS.IDLE);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '🤖 AI Pipeline IDE v2.0.0',
    '✨ Ready to build amazing projects with AI assistance!',
    'Enter your project requirements to get started...'
  ]);
  const [openTabs, setOpenTabs] = useState<string[]>(['project-requirements.md']);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    localStorage.getItem('gemini_api_key') || ''
  );
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageResults, setStageResults] = useState<StageResults>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // New state for enhanced features
  const [projectConfig, setProjectConfig] = useState<PipelineConfig | null>(null);
  const [showProjectInput, setShowProjectInput] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showBackendStatus, setShowBackendStatus] = useState<boolean>(false);
  const [qaFeedback, setQaFeedback] = useState<string>('');

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

  // Update panels based on project type
  useEffect(() => {
    if (projectConfig) {
      setShowPreview(projectConfig.projectType === 'frontend' || projectConfig.projectType === 'fullstack');
      setShowBackendStatus(projectConfig.projectType === 'backend' || projectConfig.projectType === 'fullstack');
    }
  }, [projectConfig]);

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

  // New pipeline operations for software development workflow
  const startNewProject = (): void => {
    setShowProjectInput(true);
  };

  const handleProjectSubmit = (config: PipelineConfig): void => {
    setProjectConfig(config);
    setShowProjectInput(false);
    
    // Update initial files based on project type
    const newFiles = { ...initialFiles };
    newFiles['project-config.json'] = JSON.stringify(config, null, 2);
    setFiles(newFiles);
    
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
      setShowProjectInput(true);
      return;
    }

    setIsLoading(true);
    setPipelineStatus(PIPELINE_STATUS.RUNNING);
    setCurrentStage(null);
    setStageResults({});
    setQaFeedback('');
    setRetryCount(0);
    addToTerminal('🚀 Starting AI Software Development Pipeline...');
    addToTerminal(`🎯 Project: ${projectConfig.projectName} (${projectConfig.projectType})`);
    
    try {
      await runSoftwarePipelineWithGemini();
      setPipelineStatus(PIPELINE_STATUS.COMPLETED);
      addToTerminal('🎉 Software development pipeline completed successfully!');
      addToTerminal('💡 Your project is ready for download and development!');
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

  const runSoftwarePipelineWithGemini = async (): Promise<void> => {
    const stages = Object.values(PIPELINE_STAGES);
    const context: PipelineContext = {
      files,
      currentFile,
      config: projectConfig!,
      qaFeedback
    };

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setCurrentStage(stage);
      addToTerminal(`👨‍💼 ${stage} starting analysis...`);
      
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
    const newFiles: FileMap = { ...files };
    
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
    if (Object.keys(newFiles).length === Object.keys(files).length) {
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
    
    setFiles(newFiles);
    
    // Open the main file
    const mainFile = newFiles['index.html'] || newFiles['server.js'] || Object.keys(newFiles)[0];
    if (mainFile && mainFile !== currentFile) {
      openFile(Object.keys(newFiles).find(name => newFiles[name] === mainFile) || Object.keys(newFiles)[0]);
    }
  };

  const parseAndUpdateRefinedFiles = (result: string): void => {
    // Similar to parseAndAddGeneratedFiles but for refinements
    parseAndAddGeneratedFiles(result);
    addToTerminal('🔧 Code refinements applied based on QA feedback');
  };

  const downloadProject = (): void => {
    if (!projectConfig) {
      addToTerminal('❌ No project to download');
      return;
    }
    
    const success = downloadProjectAsZip(files, projectConfig.projectName);
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
                    ${config.techStack.frontend?.map(tech => `<span class="tech-tag">${tech}</span>`).join('\n                    ') || ''}
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
        addToTerminal(`📊 Pipeline Status: ${pipelineStatus}`);
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
        {/* Project Input Modal */}
        <ProjectInput 
          onProjectSubmit={handleProjectSubmit}
          isVisible={showProjectInput}
        />

        {/* Header */}
        <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Pipeline IDE</h1>
              {projectConfig && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  | {projectConfig.projectName} ({projectConfig.projectType})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(pipelineStatus)}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotClassName(pipelineStatus)}`}></span>
                {getStatusText(pipelineStatus)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={startNewProject}
              className="btn-secondary text-sm"
              disabled={pipelineStatus === PIPELINE_STATUS.RUNNING}
            >
              <i className="fas fa-plus mr-2"></i>
              New Project
            </button>
            {projectConfig && pipelineStatus === PIPELINE_STATUS.COMPLETED && (
              <button
                onClick={downloadProject}
                className="btn-secondary text-sm"
              >
                <i className="fas fa-download mr-2"></i>
                Download
              </button>
            )}
            <ThemeToggle isDarkMode={isDarkMode} onToggle={setIsDarkMode} />
            <button 
              className="btn-primary"
              onClick={runPipeline}
              disabled={pipelineStatus === PIPELINE_STATUS.RUNNING || isLoading || !projectConfig}
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
                    {openTabs.length > 1 && (
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(filename);
                        }}
                      >
                        <i className="fas fa-times"></i>
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
                  content={files[currentFile] || ''}
                  filename={currentFile}
                  onChange={(content) => updateFileContent(currentFile, content)}
                />
              </div>

              {/* Right Panel - Terminal */}
              <div className="w-96 border-l border-gray-200 dark:border-dark-600 flex flex-col">
                <Terminal 
                  output={terminalOutput}
                  onCommand={handleTerminalCommand}
                  geminiService={geminiService}
                  files={files}
                  currentFile={currentFile}
                  onCodeUpdate={updateFileContent}
                />
              </div>
            </div>
          </main>

          {/* Right Side Panel - Preview/Backend Status */}
          {(showPreview || showBackendStatus) && (
            <aside className="w-80 border-l border-gray-200 dark:border-dark-600 flex flex-col">
              {showPreview && (
                <div className="flex-1">
                  <PreviewPanel
                    files={files}
                    projectType={projectConfig?.projectType || 'frontend'}
                    isVisible={showPreview}
                  />
                </div>
              )}
              {showBackendStatus && (
                <div className={showPreview ? 'h-1/2 border-t border-gray-200 dark:border-dark-600' : 'flex-1'}>
                  <BackendStatus
                    files={files}
                    projectType={projectConfig?.projectType || 'backend'}
                    isVisible={showBackendStatus}
                  />
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;