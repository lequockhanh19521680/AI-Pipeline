#!/usr/bin/env python3
"""
Model Deployment Stage
Prepares the model for deployment
"""

import sys
import yaml
import pandas as pd
import numpy as np
import json
import pickle
import shutil
from pathlib import Path

def load_config(config_file, stage_id):
    """Load pipeline configuration"""
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    return config

def deploy_model(config):
    """Prepare model for deployment"""
    print("🔄 Starting model deployment preparation...")
    
    try:
        output_path = config.get('data', {}).get('output_path', './outputs')
        model_dir = Path(output_path) / 'model_training'
        preprocessing_dir = Path(output_path) / 'preprocessing'
        evaluation_dir = Path(output_path) / 'evaluation'
        
        # Create deployment directory
        deployment_dir = Path(output_path) / 'deployment'
        deployment_dir.mkdir(parents=True, exist_ok=True)
        
        # Load model metadata
        with open(model_dir / 'model_metadata.json', 'r') as f:
            model_metadata = json.load(f)
        
        # Load evaluation results
        with open(evaluation_dir / 'evaluation_results.json', 'r') as f:
            evaluation_results = json.load(f)
        
        print(f"🚀 Preparing deployment for {model_metadata.get('model_type')} model")
        
        # Copy essential files for deployment
        essential_files = [
            (model_dir / 'trained_model.pkl', 'model.pkl'),
            (preprocessing_dir / 'preprocessing_metadata.json', 'preprocessing_metadata.json')
        ]
        
        # Copy preprocessing objects if they exist
        preprocessing_objects = ['scaler.pkl', 'label_encoders.pkl', 'target_encoder.pkl']
        for obj_file in preprocessing_objects:
            obj_path = preprocessing_dir / obj_file
            if obj_path.exists():
                essential_files.append((obj_path, obj_file))
        
        # Copy files to deployment directory
        for src, dst in essential_files:
            if src.exists():
                shutil.copy2(src, deployment_dir / dst)
                print(f"📦 Copied {dst}")
        
        # Create model serving API template
        api_template = create_api_template(model_metadata, evaluation_results)
        with open(deployment_dir / 'model_api.py', 'w') as f:
            f.write(api_template)
        print("📦 Created model_api.py")
        
        # Create requirements.txt for deployment
        requirements = create_requirements_file()
        with open(deployment_dir / 'requirements.txt', 'w') as f:
            f.write(requirements)
        print("📦 Created requirements.txt")
        
        # Create Dockerfile
        dockerfile = create_dockerfile()
        with open(deployment_dir / 'Dockerfile', 'w') as f:
            f.write(dockerfile)
        print("📦 Created Dockerfile")
        
        # Create deployment documentation
        deployment_docs = create_deployment_docs(model_metadata, evaluation_results)
        with open(deployment_dir / 'DEPLOYMENT.md', 'w') as f:
            f.write(deployment_docs)
        print("📦 Created DEPLOYMENT.md")
        
        # Create model info JSON for easy access
        deployment_info = {
            'model_type': model_metadata.get('model_type'),
            'problem_type': model_metadata.get('problem_type'),
            'performance_grade': evaluation_results.get('performance_grade'),
            'features': model_metadata.get('features', []),
            'deployment_date': pd.Timestamp.now().isoformat(),
            'api_endpoint': '/predict',
            'health_endpoint': '/health',
            'model_info_endpoint': '/info'
        }
        
        if model_metadata.get('problem_type') == 'classification':
            deployment_info['accuracy'] = evaluation_results.get('accuracy')
            deployment_info['f1_score'] = evaluation_results.get('f1_score')
        else:
            deployment_info['r2_score'] = evaluation_results.get('r2_score')
            deployment_info['rmse'] = evaluation_results.get('rmse')
        
        with open(deployment_dir / 'deployment_info.json', 'w') as f:
            json.dump(deployment_info, f, indent=2, default=str)
        
        # Create example usage script
        example_script = create_example_usage(model_metadata)
        with open(deployment_dir / 'example_usage.py', 'w') as f:
            f.write(example_script)
        print("📦 Created example_usage.py")
        
        print("✅ Model deployment preparation completed successfully")
        print(f"📁 Deployment package ready at: {deployment_dir}")
        print("🚀 Ready for production deployment!")
        
        return True
        
    except Exception as e:
        print(f"❌ Model deployment preparation failed: {str(e)}")
        return False

def create_api_template(model_metadata, evaluation_results):
    """Create a Flask API template for model serving"""
    problem_type = model_metadata.get('problem_type', 'classification')
    features = model_metadata.get('features', [])
    
    template = f'''#!/usr/bin/env python3
"""
AI Pipeline Model Serving API
Auto-generated deployment template
"""

from flask import Flask, request, jsonify
import pickle
import pandas as pd
import numpy as np
import json
from pathlib import Path

app = Flask(__name__)

# Global variables for model and preprocessing objects
model = None
scaler = None
label_encoders = None
target_encoder = None
preprocessing_metadata = None

def load_model_and_preprocessors():
    """Load the trained model and preprocessing objects"""
    global model, scaler, label_encoders, target_encoder, preprocessing_metadata
    
    # Load model
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    
    # Load preprocessing metadata
    with open('preprocessing_metadata.json', 'r') as f:
        preprocessing_metadata = json.load(f)
    
    # Load preprocessing objects if they exist
    try:
        with open('scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
    except FileNotFoundError:
        scaler = None
    
    try:
        with open('label_encoders.pkl', 'rb') as f:
            label_encoders = pickle.load(f)
    except FileNotFoundError:
        label_encoders = None
    
    try:
        with open('target_encoder.pkl', 'rb') as f:
            target_encoder = pickle.load(f)
    except FileNotFoundError:
        target_encoder = None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({{"status": "healthy", "model_loaded": model is not None}})

@app.route('/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({{
        "model_type": "{model_metadata.get('model_type', 'Unknown')}",
        "problem_type": "{problem_type}",
        "features": {features},
        "performance_grade": "{evaluation_results.get('performance_grade', 'Unknown')}",
        {"accuracy": evaluation_results.get('accuracy')," if problem_type == 'classification' else "r2_score": evaluation_results.get('r2_score'),"}
        "n_features": {len(features)}
    }})

@app.route('/predict', methods=['POST'])
def predict():
    """Make predictions"""
    try:
        # Get input data
        data = request.get_json()
        
        if 'features' not in data:
            return jsonify({{"error": "Missing 'features' in request"}}, 400
        
        # Convert to DataFrame
        df = pd.DataFrame([data['features']])
        
        # Ensure all required features are present
        required_features = {features}
        missing_features = set(required_features) - set(df.columns)
        if missing_features:
            return jsonify({{
                "error": f"Missing features: {{list(missing_features)}}"
            }}), 400
        
        # Reorder columns to match training data
        df = df[list(required_features)]
        
        # Apply preprocessing
        if label_encoders:
            for col, encoder in label_encoders.items():
                if col in df.columns:
                    df[col] = encoder.transform(df[col].astype(str))
        
        if scaler:
            numeric_cols = preprocessing_metadata.get('numeric_columns', [])
            if numeric_cols:
                df[numeric_cols] = scaler.transform(df[numeric_cols])
        
        # Make prediction
        prediction = model.predict(df)[0]
        
        # Apply target decoding if needed
        if target_encoder:
            prediction = target_encoder.inverse_transform([prediction])[0]
        
        # Get prediction probability for classification
        result = {{"prediction": prediction}}
        
        if hasattr(model, 'predict_proba') and "{problem_type}" == "classification":
            probabilities = model.predict_proba(df)[0]
            result["probabilities"] = probabilities.tolist()
            result["confidence"] = float(max(probabilities))
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({{"error": str(e)}}), 500

if __name__ == '__main__':
    load_model_and_preprocessors()
    app.run(host='0.0.0.0', port=5000, debug=False)
'''
    
    return template

def create_requirements_file():
    """Create requirements.txt for deployment"""
    return '''flask==2.3.3
scikit-learn==1.3.0
pandas==2.0.3
numpy==1.24.3
pickle-mixin==1.0.2
gunicorn==21.2.0
'''

def create_dockerfile():
    """Create Dockerfile for containerized deployment"""
    return '''FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model files and API
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "model_api:app"]
'''

def create_deployment_docs(model_metadata, evaluation_results):
    """Create deployment documentation"""
    problem_type = model_metadata.get('problem_type', 'classification')
    
    docs = f'''# AI Pipeline Model Deployment Guide

## Model Information
- **Model Type**: {model_metadata.get('model_type', 'Unknown')}
- **Problem Type**: {problem_type.title()}
- **Performance Grade**: {evaluation_results.get('performance_grade', 'Unknown')}
- **Number of Features**: {len(model_metadata.get('features', []))}

## Performance Metrics
'''
    
    if problem_type == 'classification':
        docs += f'''- **Accuracy**: {evaluation_results.get('accuracy', 0):.4f}
- **F1-Score**: {evaluation_results.get('f1_score', 0):.4f}
- **Precision**: {evaluation_results.get('precision', 0):.4f}
- **Recall**: {evaluation_results.get('recall', 0):.4f}
'''
    else:
        docs += f'''- **R² Score**: {evaluation_results.get('r2_score', 0):.4f}
- **RMSE**: {evaluation_results.get('rmse', 0):.4f}
- **MAE**: {evaluation_results.get('mae', 0):.4f}
'''
    
    docs += '''
## Deployment Options

### Option 1: Local Deployment
```bash
# Install dependencies
pip install -r requirements.txt

# Start the API server
python model_api.py
```

### Option 2: Docker Deployment
```bash
# Build the Docker image
docker build -t ai-pipeline-model .

# Run the container
docker run -p 5000:5000 ai-pipeline-model
```

### Option 3: Production Deployment with Gunicorn
```bash
# Install gunicorn
pip install gunicorn

# Start with gunicorn
gunicorn --bind 0.0.0.0:5000 model_api:app
```

## API Endpoints

### Health Check
```
GET /health
```

### Model Information
```
GET /info
```

### Make Predictions
```
POST /predict
Content-Type: application/json

{
  "features": {
    "feature_1": value1,
    "feature_2": value2,
    ...
  }
}
```

## Example Usage
See `example_usage.py` for a complete example of how to use the API.

## Required Features
'''
    
    for i, feature in enumerate(model_metadata.get('features', []), 1):
        docs += f"{i}. `{feature}`\n"
    
    docs += '''
## Monitoring and Maintenance
- Monitor the `/health` endpoint for service status
- Log all predictions for model drift detection
- Retrain the model periodically with new data
- Monitor prediction accuracy in production
'''
    
    return docs

def create_example_usage(model_metadata):
    """Create example usage script"""
    features = model_metadata.get('features', [])
    
    example = f'''#!/usr/bin/env python3
"""
Example usage of the deployed AI Pipeline model
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:5000"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{{API_URL}}/health")
    print("Health check:", response.json())

def test_model_info():
    """Get model information"""
    response = requests.get(f"{{API_URL}}/info")
    print("Model info:", response.json())

def test_prediction():
    """Test model prediction"""
    # Example feature values (replace with actual values)
    sample_features = {{
'''
    
    for i, feature in enumerate(features[:10]):  # Limit to first 10 features for example
        example += f'        "{feature}": {i * 0.1 + 1.0},\n'
    
    example += '''    }
    
    payload = {
        "features": sample_features
    }
    
    response = requests.post(
        f"{API_URL}/predict",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print("Prediction:", result.get("prediction"))
        if "confidence" in result:
            print("Confidence:", result.get("confidence"))
        if "probabilities" in result:
            print("Probabilities:", result.get("probabilities"))
    else:
        print("Error:", response.json())

if __name__ == "__main__":
    print("Testing AI Pipeline Model API...")
    test_health()
    test_model_info()
    test_prediction()
'''
    
    return example

def main():
    if len(sys.argv) != 3:
        print("Usage: python deployment.py <config_file> <stage_id>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    stage_id = sys.argv[2]
    
    try:
        config = load_config(config_file, stage_id)
        success = deploy_model(config)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()