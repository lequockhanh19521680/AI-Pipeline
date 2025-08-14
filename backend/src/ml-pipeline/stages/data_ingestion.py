#!/usr/bin/env python3
"""
Data Ingestion Stage
Loads and validates data for the ML pipeline
"""

import sys
import yaml
import pandas as pd
import numpy as np
import json
import traceback
from pathlib import Path

def load_config(config_file, stage_id):
    """Load pipeline configuration"""
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    return config

def ingest_data(config):
    """Ingest and validate data"""
    print("🔄 Starting data ingestion...")
    
    # Simulate data loading
    data_path = config.get('data', {}).get('input_path', './data/sample_data.csv')
    
    try:
        # Create sample data if not exists
        if not Path(data_path).exists():
            print(f"📊 Creating sample dataset at {data_path}")
            Path(data_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Generate sample classification data
            np.random.seed(42)
            n_samples = 1000
            n_features = 20
            
            X = np.random.randn(n_samples, n_features)
            y = (X[:, 0] + X[:, 1] + np.random.randn(n_samples) * 0.1 > 0).astype(int)
            
            # Create feature names
            feature_names = [f'feature_{i}' for i in range(n_features)]
            
            # Create DataFrame
            df = pd.DataFrame(X, columns=feature_names)
            df['target'] = y
            
            # Save to CSV
            df.to_csv(data_path, index=False)
            print(f"✅ Sample dataset created with {n_samples} samples and {n_features} features")
        
        # Load the data
        df = pd.read_csv(data_path)
        
        # Basic validation
        print(f"📋 Dataset shape: {df.shape}")
        print(f"📋 Columns: {list(df.columns)}")
        print(f"📋 Missing values: {df.isnull().sum().sum()}")
        
        # Data quality checks
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        print(f"📋 Numeric columns: {len(numeric_cols)}")
        
        # Save data summary
        output_dir = Path(config.get('data', {}).get('output_path', './outputs')) / 'data_ingestion'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        summary = {
            'shape': df.shape,
            'columns': list(df.columns),
            'dtypes': df.dtypes.to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'numeric_columns': list(numeric_cols),
            'sample_data': df.head().to_dict()
        }
        
        with open(output_dir / 'data_summary.json', 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        # Save processed data
        df.to_csv(output_dir / 'ingested_data.csv', index=False)
        
        # Output structured JSON result for job queue processing
        result = {
            "status": "success",
            "stage": "data_ingestion",
            "outputs": {
                "data_shape": df.shape,
                "data_path": str(output_dir / 'ingested_data.csv'),
                "summary_path": str(output_dir / 'data_summary.json'),
                "columns": list(df.columns),
                "numeric_columns": len(numeric_cols)
            },
            "artifacts": [
                str(output_dir / 'ingested_data.csv'),
                str(output_dir / 'data_summary.json')
            ]
        }
        print(json.dumps(result))
        print("✅ Data ingestion completed successfully")
        return True
        
    except Exception as e:
        # Log full traceback for debugging
        error_traceback = traceback.format_exc()
        print(f"❌ Data ingestion failed: {str(e)}")
        print(f"Full traceback:\n{error_traceback}")
        
        # Print structured JSON error to stderr for backend detection
        error_info = {
            "status": "error",
            "stage": "data_ingestion", 
            "message": str(e),
            "traceback": error_traceback
        }
        print(json.dumps(error_info), file=sys.stderr)
        return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python data_ingestion.py <config_file> <stage_id>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    stage_id = sys.argv[2]
    
    try:
        config = load_config(config_file, stage_id)
        success = ingest_data(config)
        sys.exit(0 if success else 1)
    except Exception as e:
        # Log full traceback for debugging
        error_traceback = traceback.format_exc()
        print(f"❌ Error: {str(e)}")
        print(f"Full traceback:\n{error_traceback}")
        
        # Print structured JSON error to stderr for backend detection
        error_info = {
            "status": "error",
            "stage": "data_ingestion",
            "message": str(e),
            "traceback": error_traceback
        }
        print(json.dumps(error_info), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()