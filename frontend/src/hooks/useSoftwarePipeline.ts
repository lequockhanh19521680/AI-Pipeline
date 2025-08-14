import { useState, useCallback } from 'react';
import { PipelineConfig, PipelineContext, FileMap, PipelineError } from '../types';
import { PIPELINE_STAGES, PIPELINE_STATUS } from '../data';
import GeminiService from '../services/GeminiService';
import { useUIStore } from '../store/uiStore';
import { useFileStore } from '../store/fileStore';

interface SoftwarePipelineState {
  projectConfig: PipelineConfig | null;
  qaFeedback: string;
  retryCount: number;
  pipelineStatus: string;
  currentStage: string | null;
  stageResults: Record<string, any>;
  isLoading: boolean;
}

interface SoftwarePipelineActions {
  setProjectConfig: (config: PipelineConfig) => void;
  runPipeline: (geminiService: GeminiService) => Promise<void>;
  handleProjectSubmit: (config: PipelineConfig) => void;
  downloadProject: () => Promise<void>;
  generateDefaultFiles: (config: PipelineConfig) => FileMap;
  resetPipeline: () => void;
}

export const useSoftwarePipeline = (): SoftwarePipelineState & SoftwarePipelineActions => {
  const [projectConfig, setProjectConfigState] = useState<PipelineConfig | null>(null);
  const [qaFeedback, setQaFeedback] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [pipelineStatus, setPipelineStatus] = useState<string>(PIPELINE_STATUS.IDLE);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageResults, setStageResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { addTerminalMessage, togglePanel } = useUIStore();
  const { files, setFiles, updateFile } = useFileStore();

  const setProjectConfig = useCallback((config: PipelineConfig) => {
    setProjectConfigState(config);
  }, []);

  const handleProjectSubmit = useCallback((config: PipelineConfig) => {
    setProjectConfig(config);
    togglePanel('showProjectInput');
    
    // Update files with project config
    const newFiles = { ...files };
    newFiles['project-config.json'] = JSON.stringify(config, null, 2);
    setFiles(newFiles);
    
    addTerminalMessage(`🎯 Project "${config.projectName}" configured`);
    addTerminalMessage(`📋 Type: ${config.projectType}`);
    addTerminalMessage(`📝 Description: ${config.description}`);
    addTerminalMessage('✅ Ready to start AI Pipeline!');
  }, [files, setFiles, setProjectConfig, togglePanel, addTerminalMessage]);

  const runPipeline = useCallback(async (geminiService: GeminiService) => {
    if (!projectConfig) {
      addTerminalMessage('❌ Error: No project configured');
      addTerminalMessage('Please create a new project first');
      togglePanel('showProjectInput');
      return;
    }

    setPipelineStatus(PIPELINE_STATUS.RUNNING);
    setCurrentStage('initialization');
    setIsLoading(true);
    setQaFeedback('');
    setRetryCount(0);
    
    addTerminalMessage('🚀 Starting AI Software Development Pipeline...');
    addTerminalMessage(`🎯 Project: ${projectConfig.projectName} (${projectConfig.projectType})`);
    
    try {
      await runSoftwarePipelineWithGemini(geminiService);
      setPipelineStatus(PIPELINE_STATUS.COMPLETED);
      setStageResults(prev => ({ ...prev, pipeline: 'completed' }));
      addTerminalMessage('🎉 Software development pipeline completed successfully!');
      addTerminalMessage('💡 Your project is ready for download and development!');
    } catch (error) {
      setPipelineStatus(PIPELINE_STATUS.ERROR);
      if (error instanceof PipelineError) {
        addTerminalMessage(`❌ Pipeline failed at stage: ${error.stage}`);
        addTerminalMessage(`📋 Error details: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        addTerminalMessage(`❌ Pipeline failed: ${errorMessage}`);
      }
      
      // Offer retry mechanism
      if (retryCount < 2) {
        addTerminalMessage(`🔄 Retry available (${retryCount + 1}/3)`);
        addTerminalMessage('Click "Run Pipeline" to retry with enhanced error recovery');
      }
    } finally {
      setCurrentStage(null);
      setIsLoading(false);
    }
  }, [projectConfig, retryCount, addTerminalMessage, togglePanel]);

  const runSoftwarePipelineWithGemini = async (geminiService: GeminiService): Promise<void> => {
    const stages = Object.values(PIPELINE_STAGES);
    const context: PipelineContext = {
      files,
      currentFile: Object.keys(files)[0] || '',
      config: projectConfig!,
      qaFeedback
    };

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setCurrentStage(stage);
      addTerminalMessage(`👨‍💼 ${stage} starting analysis...`);
      
      let stageRetries = 0;
      const maxStageRetries = 2;
      
      while (stageRetries <= maxStageRetries) {
        try {
          const result = await geminiService.runPipelineStage(stage, {
            ...context,
            previousResults: stageResults,
            stageIndex: i + 1,
            totalStages: stages.length
          });
          
          setStageResults(prev => ({ ...prev, [stage]: result }));
          addTerminalMessage(`✅ ${stage} completed successfully`);
          
          // Handle specific stage results
          if (stage === 'AI Developer') {
            parseAndAddGeneratedFiles(result);
          } else if (stage === 'AI QA Engineer') {
            setQaFeedback(result);
            addTerminalMessage('🔍 QA analysis complete - issues identified for refinement');
          } else if (stage === 'AI Developer (Refinement)') {
            parseAndUpdateRefinedFiles(result);
          }
          
          if (stageRetries > 0) {
            addTerminalMessage(`🔄 Self-healing successful after ${stageRetries} retry(ies)`);
          }
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 1500));
          break;
          
        } catch (error) {
          stageRetries++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          if (stageRetries <= maxStageRetries) {
            addTerminalMessage(`⚠️ ${stage} failed (attempt ${stageRetries}/${maxStageRetries + 1}): ${errorMessage}`);
            addTerminalMessage(`🔄 Retrying ${stage} with enhanced recovery...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * stageRetries));
          } else {
            addTerminalMessage(`❌ ${stage} failed after ${maxStageRetries + 1} attempts: ${errorMessage}`);
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
            addTerminalMessage(`📄 Generated: ${fileName}`);
          }
        }
      }
    }
    
    // Add default files if none were generated
    if (Object.keys(newFiles).length === Object.keys(files).length) {
      const defaultFiles = generateDefaultFiles(projectConfig!);
      Object.assign(newFiles, defaultFiles);
    }
    
    setFiles(newFiles);
  };

  const parseAndUpdateRefinedFiles = (result: string): void => {
    parseAndAddGeneratedFiles(result);
    addTerminalMessage('🔧 Code refinements applied based on QA feedback');
  };

  const generateDefaultFiles = (config: PipelineConfig): FileMap => {
    const defaultFiles: FileMap = {};
    const projectType = config.projectType || 'frontend';
    
    if (projectType === 'frontend' || projectType === 'fullstack') {
      defaultFiles['index.html'] = generateDefaultHTML(config);
      defaultFiles['style.css'] = generateDefaultCSS();
      defaultFiles['script.js'] = generateDefaultJS();
      addTerminalMessage('📄 Generated default frontend files');
    }
    
    if (projectType === 'backend' || projectType === 'fullstack') {
      defaultFiles['server.js'] = generateDefaultServer();
      defaultFiles['package.json'] = generateDefaultPackageJson(config);
      addTerminalMessage('📄 Generated default backend files');
    }
    
    return defaultFiles;
  };

  const downloadProject = async (): Promise<void> => {
    if (!projectConfig) {
      addTerminalMessage('❌ No project to download');
      return;
    }
    
    try {
      const { downloadProjectAsZip } = await import('../utils/download');
      const success = await downloadProjectAsZip(files, projectConfig.projectName);
      if (success) {
        addTerminalMessage(`📦 Project "${projectConfig.projectName}" downloaded successfully!`);
        addTerminalMessage('🚀 Extract and run "npm install" to get started');
      } else {
        addTerminalMessage('❌ Failed to download project');
      }
    } catch (error) {
      addTerminalMessage('❌ Failed to download project');
    }
  };

  const resetPipeline = useCallback(() => {
    setProjectConfigState(null);
    setQaFeedback('');
    setRetryCount(0);
    setPipelineStatus(PIPELINE_STATUS.IDLE);
    setCurrentStage(null);
    setStageResults({});
    setIsLoading(false);
  }, []);

  return {
    // State
    projectConfig,
    qaFeedback,
    retryCount,
    pipelineStatus,
    currentStage,
    stageResults,
    isLoading,
    
    // Actions
    setProjectConfig,
    runPipeline,
    handleProjectSubmit,
    downloadProject,
    generateDefaultFiles,
    resetPipeline
  };
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