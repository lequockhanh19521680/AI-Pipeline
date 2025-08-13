// AI Pipeline IDE JavaScript
class AIPipelineIDE {
    constructor() {
        this.editor = null;
        this.currentFile = 'pipeline.py';
        this.files = {
            'pipeline.py': `# AI Pipeline Main Script
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import yaml

class AIPipeline:
    def __init__(self, config_path='config.yaml'):
        """Initialize the AI Pipeline with configuration."""
        self.config = self.load_config(config_path)
        self.model = None
        self.data = None
        
    def load_config(self, config_path):
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as file:
                config = yaml.safe_load(file)
            print(f"✓ Configuration loaded from {config_path}")
            return config
        except FileNotFoundError:
            print(f"⚠ Config file {config_path} not found, using defaults")
            return self.get_default_config()
    
    def get_default_config(self):
        """Return default configuration."""
        return {
            'data': {
                'source': 'data/dataset.csv',
                'target_column': 'target'
            },
            'model': {
                'type': 'random_forest',
                'n_estimators': 100,
                'random_state': 42
            },
            'preprocessing': {
                'test_size': 0.2,
                'normalize': True
            }
        }
    
    def load_data(self):
        """Load and preprocess data."""
        print("📊 Loading data...")
        try:
            # Simulate data loading
            self.data = pd.read_csv(self.config['data']['source'])
            print(f"✓ Data loaded: {self.data.shape}")
            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def train_model(self):
        """Train the machine learning model."""
        if self.data is None:
            print("❌ No data loaded")
            return False
            
        print("🤖 Training model...")
        try:
            X = self.data.drop(self.config['data']['target_column'], axis=1)
            y = self.data[self.config['data']['target_column']]
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=self.config['preprocessing']['test_size'],
                random_state=self.config['model']['random_state']
            )
            
            self.model = RandomForestClassifier(
                n_estimators=self.config['model']['n_estimators'],
                random_state=self.config['model']['random_state']
            )
            
            self.model.fit(X_train, y_train)
            score = self.model.score(X_test, y_test)
            
            print(f"✓ Model trained successfully!")
            print(f"📈 Test accuracy: {score:.4f}")
            return True
            
        except Exception as e:
            print(f"❌ Error training model: {e}")
            return False
    
    def run_pipeline(self):
        """Execute the complete AI pipeline."""
        print("🚀 Starting AI Pipeline...")
        
        if not self.load_data():
            return False
            
        if not self.train_model():
            return False
            
        print("🎉 Pipeline completed successfully!")
        return True

if __name__ == "__main__":
    pipeline = AIPipeline()
    pipeline.run_pipeline()
`,
            'config.yaml': `# AI Pipeline Configuration
data:
  source: "data/dataset.csv"
  target_column: "target"
  
model:
  type: "random_forest"
  n_estimators: 100
  random_state: 42
  
preprocessing:
  test_size: 0.2
  normalize: true
  feature_selection: false
  
training:
  validation_split: 0.2
  epochs: 100
  batch_size: 32
  
output:
  model_path: "models/trained_model.pkl"
  metrics_path: "outputs/metrics.json"
  logs_path: "logs/pipeline.log"
`,
            'requirements.txt': `numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
PyYAML==6.0.1
matplotlib==3.7.2
seaborn==0.12.2
jupyter==1.0.0
`,
            'README.md': `# AI Pipeline Project

A modern AI pipeline for machine learning workflows.

## Features

- Data ingestion and preprocessing
- Model training and evaluation
- Automated pipeline execution
- Configuration management
- Logging and monitoring

## Usage

\`\`\`bash
python pipeline.py --config config.yaml
\`\`\`

## Configuration

Edit \`config.yaml\` to customize pipeline parameters.
`
        };
        
        this.init();
    }

    async init() {
        await this.initializeEditor();
        this.setupEventListeners();
        this.populateFileTree();
        this.startStatusUpdates();
    }

    async initializeEditor() {
        const editorLoading = document.getElementById('editorLoading');
        editorLoading.classList.remove('hidden');

        // Create a simple textarea-based editor for now
        const editorContainer = document.getElementById('editor');
        editorContainer.innerHTML = `
            <textarea 
                id="codeEditor" 
                class="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 border-0 outline-none resize-none scrollbar-thin"
                spellcheck="false"
                placeholder="// AI Pipeline IDE - Code Editor"
            >${this.files[this.currentFile]}</textarea>
        `;

        const textarea = document.getElementById('codeEditor');
        textarea.addEventListener('input', (e) => {
            this.files[this.currentFile] = e.target.value;
        });

        editorLoading.classList.add('hidden');
        return Promise.resolve();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', this.toggleTheme.bind(this));

        // File tree clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('file-item')) {
                this.openFile(e.target.dataset.file);
            }
        });

        // Run pipeline button
        const runButton = document.querySelector('.btn-primary');
        runButton.addEventListener('click', this.runPipeline.bind(this));

        // Resize handler for responsive layout
        window.addEventListener('resize', () => {
            // Handle responsive layout updates
            console.log('Window resized');
        });
    }

    populateFileTree() {
        const fileTree = document.getElementById('fileTree');
        const fileStructure = {
            'pipeline.py': { icon: 'fas fa-file-code text-blue-500', type: 'python' },
            'config.yaml': { icon: 'fas fa-cog text-green-500', type: 'yaml' },
            'requirements.txt': { icon: 'fas fa-file-alt text-yellow-500', type: 'text' },
            'README.md': { icon: 'fas fa-file-text text-purple-500', type: 'markdown' }
        };

        fileTree.innerHTML = Object.entries(fileStructure).map(([filename, info]) => `
            <div class="file-item flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer transition-colors" data-file="${filename}">
                <i class="${info.icon}"></i>
                <span class="text-sm text-gray-700 dark:text-gray-300">${filename}</span>
                ${filename === this.currentFile ? '<i class="fas fa-circle text-primary-500 ml-auto" style="font-size: 6px;"></i>' : ''}
            </div>
        `).join('');
    }

    openFile(filename) {
        if (this.files[filename]) {
            this.currentFile = filename;
            
            // Update textarea content
            const textarea = document.getElementById('codeEditor');
            if (textarea) {
                textarea.value = this.files[filename];
            }
            
            // Update file tree highlight
            this.populateFileTree();
            
            // Update tab
            this.updateActiveTab(filename);
        }
    }

    getLanguageFromFilename(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'py': 'python',
            'yaml': 'yaml',
            'yml': 'yaml',
            'txt': 'plaintext',
            'md': 'markdown',
            'json': 'json',
            'js': 'javascript',
            'html': 'html',
            'css': 'css'
        };
        return languageMap[ext] || 'plaintext';
    }

    updateActiveTab(filename) {
        const tabs = document.getElementById('editorTabs');
        const icon = filename.endsWith('.py') ? 'fas fa-file-code' : 
                   filename.endsWith('.yaml') ? 'fas fa-cog' :
                   filename.endsWith('.md') ? 'fas fa-file-text' : 'fas fa-file-alt';
        
        tabs.innerHTML = `
            <div class="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-dark-800 border-t-2 border-primary-500 text-sm font-medium text-gray-900 dark:text-white">
                <i class="${icon} text-primary-500"></i>
                <span>${filename}</span>
                <button class="ml-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded p-1">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeIcon = document.querySelector('#themeToggle i');
        
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            themeIcon.className = 'fas fa-moon text-gray-600';
        } else {
            html.classList.add('dark');
            themeIcon.className = 'fas fa-sun text-yellow-500';
        }
    }

    async runPipeline() {
        const runButton = document.querySelector('.btn-primary');
        const originalText = runButton.innerHTML;
        
        // Show loading state
        runButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Running...';
        runButton.disabled = true;
        
        // Simulate pipeline execution
        await this.simulatePipelineExecution();
        
        // Reset button
        setTimeout(() => {
            runButton.innerHTML = originalText;
            runButton.disabled = false;
        }, 3000);
    }

    async simulatePipelineExecution() {
        const steps = [
            { name: 'Data Ingestion', duration: 1000 },
            { name: 'Processing', duration: 2000 },
            { name: 'Model Training', duration: 3000 },
            { name: 'Deployment', duration: 1500 }
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, steps[i].duration));
            this.updatePipelineStatus(i + 1);
        }
    }

    updatePipelineStatus(completedSteps) {
        const statusItems = document.querySelectorAll('.pipeline-status-item');
        statusItems.forEach((item, index) => {
            const indicator = item.querySelector('.w-2');
            if (index < completedSteps) {
                indicator.className = 'w-2 h-2 bg-green-400 rounded-full';
            } else if (index === completedSteps) {
                indicator.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse';
            }
        });
    }

    startStatusUpdates() {
        // Simulate real-time status updates
        setInterval(() => {
            const timestamp = new Date().toLocaleTimeString();
            // Add subtle animations and updates
        }, 5000);
    }
}

// Initialize the IDE when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AIPipelineIDE();
});

// Add some utility functions for enhanced UX
function showTooltip(element, text) {
    // Simple tooltip implementation
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute bg-gray-900 text-white text-xs rounded py-1 px-2 z-50';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 30) + 'px';
    
    setTimeout(() => {
        document.body.removeChild(tooltip);
    }, 2000);
}

// Add drag and drop functionality for files
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            console.log(`File ${file.name} uploaded:`, event.target.result);
            // Handle file upload
        };
        reader.readAsText(file);
    });
});