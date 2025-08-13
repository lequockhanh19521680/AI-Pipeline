#!/usr/bin/env python3
"""
Data Preprocessing Stage
Prepares data for model training
"""

import sys
import yaml
import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

def load_config(config_file, stage_id):
    """Load pipeline configuration"""
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    return config

def preprocess_data(config):
    """Preprocess the ingested data"""
    print("🔄 Starting data preprocessing...")
    
    try:
        # Load ingested data
        output_path = config.get('data', {}).get('output_path', './outputs')
        data_path = Path(output_path) / 'data_ingestion' / 'ingested_data.csv'
        
        if not data_path.exists():
            raise FileNotFoundError(f"Ingested data not found at {data_path}")
        
        df = pd.read_csv(data_path)
        print(f"📊 Loaded data with shape: {df.shape}")
        
        # Identify target column
        target_col = 'target'
        if target_col not in df.columns:
            # Try to identify target column
            potential_targets = ['target', 'label', 'y', 'class']
            target_col = None
            for col in potential_targets:
                if col in df.columns:
                    target_col = col
                    break
            
            if target_col is None:
                # Use last column as target
                target_col = df.columns[-1]
                print(f"⚠️ Using last column '{target_col}' as target")
        
        # Separate features and target
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        print(f"📋 Features: {X.shape[1]} columns")
        print(f"📋 Target: {target_col}")
        
        # Handle missing values
        X_filled = X.fillna(X.mean(numeric_only=True))
        for col in X.select_dtypes(include=['object']).columns:
            X_filled[col] = X_filled[col].fillna(X_filled[col].mode()[0] if not X_filled[col].mode().empty else 'unknown')
        
        # Encode categorical variables
        categorical_cols = X_filled.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            print(f"🔢 Encoding {len(categorical_cols)} categorical columns")
            label_encoders = {}
            for col in categorical_cols:
                le = LabelEncoder()
                X_filled[col] = le.fit_transform(X_filled[col].astype(str))
                label_encoders[col] = le
        
        # Scale numerical features
        numeric_cols = X_filled.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            print(f"📏 Scaling {len(numeric_cols)} numerical columns")
            scaler = StandardScaler()
            X_scaled = X_filled.copy()
            X_scaled[numeric_cols] = scaler.fit_transform(X_filled[numeric_cols])
        else:
            X_scaled = X_filled
            scaler = None
        
        # Encode target if categorical
        if y.dtype == 'object':
            print("🎯 Encoding target variable")
            target_encoder = LabelEncoder()
            y_encoded = target_encoder.fit_transform(y)
        else:
            y_encoded = y
            target_encoder = None
        
        # Train-test split
        test_size = config.get('model', {}).get('test_size', 0.2)
        random_state = config.get('model', {}).get('random_state', 42)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=test_size, random_state=random_state, stratify=y_encoded
        )
        
        print(f"📊 Train set: {X_train.shape}")
        print(f"📊 Test set: {X_test.shape}")
        
        # Save preprocessed data
        output_dir = Path(output_path) / 'preprocessing'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save datasets
        X_train.to_csv(output_dir / 'X_train.csv', index=False)
        X_test.to_csv(output_dir / 'X_test.csv', index=False)
        pd.Series(y_train).to_csv(output_dir / 'y_train.csv', index=False, header=['target'])
        pd.Series(y_test).to_csv(output_dir / 'y_test.csv', index=False, header=['target'])
        
        # Save preprocessing metadata
        metadata = {
            'target_column': target_col,
            'feature_columns': list(X.columns),
            'categorical_columns': list(categorical_cols) if len(categorical_cols) > 0 else [],
            'numeric_columns': list(numeric_cols),
            'train_shape': X_train.shape,
            'test_shape': X_test.shape,
            'test_size': test_size,
            'random_state': random_state,
            'target_classes': list(np.unique(y_encoded)) if target_encoder else None
        }
        
        with open(output_dir / 'preprocessing_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        # Save preprocessing objects
        if scaler:
            import pickle
            with open(output_dir / 'scaler.pkl', 'wb') as f:
                pickle.dump(scaler, f)
        
        if 'label_encoders' in locals():
            with open(output_dir / 'label_encoders.pkl', 'wb') as f:
                pickle.dump(label_encoders, f)
        
        if target_encoder:
            with open(output_dir / 'target_encoder.pkl', 'wb') as f:
                pickle.dump(target_encoder, f)
        
        print("✅ Data preprocessing completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Data preprocessing failed: {str(e)}")
        return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python preprocessing.py <config_file> <stage_id>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    stage_id = sys.argv[2]
    
    try:
        config = load_config(config_file, stage_id)
        success = preprocess_data(config)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()