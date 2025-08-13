// Initial file data for the IDE
export const initialFiles = {
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

// Pipeline status types
export const PIPELINE_STAGES = {
  DATA_INGESTION: 'Data Ingestion',
  PROCESSING: 'Processing',
  MODEL_TRAINING: 'Model Training',
  DEPLOYMENT: 'Deployment'
};

export const PIPELINE_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// Gemini API configuration
export const GEMINI_CONFIG = {
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  DEFAULT_MODEL: 'gemini-pro'
};

// File icon mapping
export const getFileIcon = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'py':
      return 'fas fa-file-code text-blue-500';
    case 'yaml':
    case 'yml':
      return 'fas fa-file-alt text-yellow-500';
    case 'txt':
      return 'fas fa-file-text text-gray-500';
    case 'md':
      return 'fas fa-file-alt text-green-500';
    default:
      return 'fas fa-file text-gray-400';
  }
};