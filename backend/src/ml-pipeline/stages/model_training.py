#!/usr/bin/env python3
"""
Model Training Stage
Trains ML models on preprocessed data
"""

import sys
import yaml
import pandas as pd
import numpy as np
import json
import pickle
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, r2_score

def load_config(config_file, stage_id):
    """Load pipeline configuration"""
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    return config

def determine_problem_type(y_train):
    """Determine if this is a classification or regression problem"""
    unique_values = len(np.unique(y_train))
    if unique_values <= 20 and y_train.dtype in ['int64', 'object']:
        return 'classification'
    else:
        return 'regression'

def get_model(model_config, problem_type):
    """Get the appropriate model based on configuration"""
    algorithm = model_config.get('algorithm', 'random_forest')
    parameters = model_config.get('parameters', {})
    
    if problem_type == 'classification':
        if algorithm == 'random_forest':
            return RandomForestClassifier(**parameters)
        elif algorithm == 'logistic_regression':
            return LogisticRegression(**parameters)
        elif algorithm == 'svm':
            return SVC(**parameters)
        else:
            return RandomForestClassifier(**parameters)
    else:  # regression
        if algorithm == 'random_forest':
            return RandomForestRegressor(**parameters)
        elif algorithm == 'linear_regression':
            return LinearRegression(**parameters)
        elif algorithm == 'svm':
            return SVR(**parameters)
        else:
            return RandomForestRegressor(**parameters)

def train_model(config):
    """Train the ML model"""
    print("🔄 Starting model training...")
    
    try:
        output_path = config.get('data', {}).get('output_path', './outputs')
        preprocessing_dir = Path(output_path) / 'preprocessing'
        
        # Load preprocessed data
        X_train = pd.read_csv(preprocessing_dir / 'X_train.csv')
        X_test = pd.read_csv(preprocessing_dir / 'X_test.csv')
        y_train = pd.read_csv(preprocessing_dir / 'y_train.csv')['target'].values
        y_test = pd.read_csv(preprocessing_dir / 'y_test.csv')['target'].values
        
        print(f"📊 Training data: {X_train.shape}")
        print(f"📊 Test data: {X_test.shape}")
        
        # Load metadata
        with open(preprocessing_dir / 'preprocessing_metadata.json', 'r') as f:
            metadata = json.load(f)
        
        # Determine problem type
        problem_type = determine_problem_type(y_train)
        print(f"🎯 Problem type: {problem_type}")
        
        # Get model configuration
        model_config = config.get('model', {})
        model_config['type'] = problem_type
        
        # Create and train model
        model = get_model(model_config, problem_type)
        print(f"🤖 Training {type(model).__name__}...")
        
        # Train the model
        model.fit(X_train, y_train)
        
        # Make predictions
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)
        
        # Calculate metrics
        if problem_type == 'classification':
            train_accuracy = accuracy_score(y_train, y_train_pred)
            test_accuracy = accuracy_score(y_test, y_test_pred)
            
            print(f"📈 Training accuracy: {train_accuracy:.4f}")
            print(f"📈 Test accuracy: {test_accuracy:.4f}")
            
            # Classification report
            class_report = classification_report(y_test, y_test_pred, output_dict=True)
            
            metrics = {
                'problem_type': problem_type,
                'train_accuracy': train_accuracy,
                'test_accuracy': test_accuracy,
                'classification_report': class_report
            }
        else:
            train_mse = mean_squared_error(y_train, y_train_pred)
            test_mse = mean_squared_error(y_test, y_test_pred)
            train_r2 = r2_score(y_train, y_train_pred)
            test_r2 = r2_score(y_test, y_test_pred)
            
            print(f"📈 Training MSE: {train_mse:.4f}")
            print(f"📈 Test MSE: {test_mse:.4f}")
            print(f"📈 Training R²: {train_r2:.4f}")
            print(f"📈 Test R²: {test_r2:.4f}")
            
            metrics = {
                'problem_type': problem_type,
                'train_mse': train_mse,
                'test_mse': test_mse,
                'train_r2': train_r2,
                'test_r2': test_r2
            }
        
        # Feature importance (if available)
        if hasattr(model, 'feature_importances_'):
            feature_importance = dict(zip(X_train.columns, model.feature_importances_))
            sorted_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
            metrics['feature_importance'] = sorted_importance
            
            print("🔍 Top 5 important features:")
            for i, (feature, importance) in enumerate(list(sorted_importance.items())[:5]):
                print(f"   {i+1}. {feature}: {importance:.4f}")
        
        # Save model and results
        output_dir = Path(output_path) / 'model_training'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save trained model
        with open(output_dir / 'trained_model.pkl', 'wb') as f:
            pickle.dump(model, f)
        
        # Save predictions
        pd.DataFrame({
            'y_true': y_test,
            'y_pred': y_test_pred
        }).to_csv(output_dir / 'predictions.csv', index=False)
        
        # Save metrics
        with open(output_dir / 'training_metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2, default=str)
        
        # Save model metadata
        model_metadata = {
            'model_type': type(model).__name__,
            'problem_type': problem_type,
            'algorithm': model_config.get('algorithm', 'random_forest'),
            'parameters': model_config.get('parameters', {}),
            'features': list(X_train.columns),
            'n_features': len(X_train.columns),
            'n_samples_train': len(X_train),
            'n_samples_test': len(X_test)
        }
        
        with open(output_dir / 'model_metadata.json', 'w') as f:
            json.dump(model_metadata, f, indent=2, default=str)
        
        print("✅ Model training completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Model training failed: {str(e)}")
        return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python model_training.py <config_file> <stage_id>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    stage_id = sys.argv[2]
    
    try:
        config = load_config(config_file, stage_id)
        success = train_model(config)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()