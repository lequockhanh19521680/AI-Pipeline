#!/usr/bin/env python3
"""
Model Evaluation Stage
Evaluates the trained model performance
"""

import sys
import yaml
import pandas as pd
import numpy as np
import json
import pickle
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

def load_config(config_file, stage_id):
    """Load pipeline configuration"""
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    return config

def evaluate_model(config):
    """Evaluate the trained model"""
    print("🔄 Starting model evaluation...")
    
    try:
        output_path = config.get('data', {}).get('output_path', './outputs')
        model_dir = Path(output_path) / 'model_training'
        preprocessing_dir = Path(output_path) / 'preprocessing'
        
        # Load trained model
        with open(model_dir / 'trained_model.pkl', 'rb') as f:
            model = pickle.load(f)
        
        # Load test data
        X_test = pd.read_csv(preprocessing_dir / 'X_test.csv')
        y_test = pd.read_csv(preprocessing_dir / 'y_test.csv')['target'].values
        
        # Load model metadata
        with open(model_dir / 'model_metadata.json', 'r') as f:
            model_metadata = json.load(f)
        
        problem_type = model_metadata.get('problem_type', 'classification')
        print(f"🎯 Evaluating {problem_type} model: {model_metadata.get('model_type')}")
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate evaluation metrics
        evaluation_results = {
            'problem_type': problem_type,
            'n_test_samples': len(y_test)
        }
        
        if problem_type == 'classification':
            # Classification metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            
            print(f"📊 Accuracy: {accuracy:.4f}")
            print(f"📊 Precision: {precision:.4f}")
            print(f"📊 Recall: {recall:.4f}")
            print(f"📊 F1-Score: {f1:.4f}")
            
            evaluation_results.update({
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1
            })
            
            # Confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            evaluation_results['confusion_matrix'] = cm.tolist()
            
            # Classification report
            class_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
            evaluation_results['classification_report'] = class_report
            
            # Create confusion matrix plot
            plt.figure(figsize=(8, 6))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
            plt.title('Confusion Matrix')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            plt.tight_layout()
            
        else:
            # Regression metrics
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            
            print(f"📊 MSE: {mse:.4f}")
            print(f"📊 MAE: {mae:.4f}")
            print(f"📊 RMSE: {rmse:.4f}")
            print(f"📊 R² Score: {r2:.4f}")
            
            evaluation_results.update({
                'mse': mse,
                'mae': mae,
                'rmse': rmse,
                'r2_score': r2
            })
            
            # Create prediction vs actual plot
            plt.figure(figsize=(10, 6))
            
            plt.subplot(1, 2, 1)
            plt.scatter(y_test, y_pred, alpha=0.6)
            plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
            plt.xlabel('Actual Values')
            plt.ylabel('Predicted Values')
            plt.title('Predictions vs Actual')
            
            plt.subplot(1, 2, 2)
            residuals = y_test - y_pred
            plt.scatter(y_pred, residuals, alpha=0.6)
            plt.axhline(y=0, color='r', linestyle='--')
            plt.xlabel('Predicted Values')
            plt.ylabel('Residuals')
            plt.title('Residual Plot')
            
            plt.tight_layout()
        
        # Save evaluation plots
        evaluation_dir = Path(output_path) / 'evaluation'
        evaluation_dir.mkdir(parents=True, exist_ok=True)
        
        plot_filename = 'confusion_matrix.png' if problem_type == 'classification' else 'regression_plots.png'
        plt.savefig(evaluation_dir / plot_filename, dpi=300, bbox_inches='tight')
        plt.close()
        
        # Feature importance analysis (if available)
        if hasattr(model, 'feature_importances_'):
            feature_importance = dict(zip(X_test.columns, model.feature_importances_))
            sorted_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
            evaluation_results['feature_importance'] = sorted_importance
            
            # Create feature importance plot
            plt.figure(figsize=(10, 8))
            top_features = list(sorted_importance.items())[:15]  # Top 15 features
            features, importance = zip(*top_features)
            
            plt.barh(range(len(features)), importance)
            plt.yticks(range(len(features)), features)
            plt.xlabel('Feature Importance')
            plt.title('Top 15 Feature Importance')
            plt.gca().invert_yaxis()
            plt.tight_layout()
            plt.savefig(evaluation_dir / 'feature_importance.png', dpi=300, bbox_inches='tight')
            plt.close()
            
            print("🔍 Top 10 important features:")
            for i, (feature, importance) in enumerate(list(sorted_importance.items())[:10]):
                print(f"   {i+1}. {feature}: {importance:.4f}")
        
        # Model performance summary
        if problem_type == 'classification':
            performance_grade = 'Excellent' if accuracy > 0.9 else 'Good' if accuracy > 0.8 else 'Fair' if accuracy > 0.7 else 'Poor'
        else:
            performance_grade = 'Excellent' if r2 > 0.9 else 'Good' if r2 > 0.8 else 'Fair' if r2 > 0.6 else 'Poor'
        
        evaluation_results['performance_grade'] = performance_grade
        
        # Save detailed predictions
        predictions_df = pd.DataFrame({
            'actual': y_test,
            'predicted': y_pred,
            'error': y_test - y_pred if problem_type == 'regression' else None
        })
        predictions_df.to_csv(evaluation_dir / 'detailed_predictions.csv', index=False)
        
        # Save evaluation results
        with open(evaluation_dir / 'evaluation_results.json', 'w') as f:
            json.dump(evaluation_results, f, indent=2, default=str)
        
        # Generate evaluation report
        report = generate_evaluation_report(evaluation_results, model_metadata)
        with open(evaluation_dir / 'evaluation_report.md', 'w') as f:
            f.write(report)
        
        print(f"✅ Model evaluation completed. Performance: {performance_grade}")
        return True
        
    except Exception as e:
        print(f"❌ Model evaluation failed: {str(e)}")
        return False

def generate_evaluation_report(results, metadata):
    """Generate a comprehensive evaluation report"""
    problem_type = results.get('problem_type', 'classification')
    
    report = f"""# Model Evaluation Report

## Model Information
- **Model Type**: {metadata.get('model_type', 'Unknown')}
- **Problem Type**: {problem_type.title()}
- **Algorithm**: {metadata.get('algorithm', 'Unknown')}
- **Number of Features**: {metadata.get('n_features', 'Unknown')}
- **Training Samples**: {metadata.get('n_samples_train', 'Unknown')}
- **Test Samples**: {results.get('n_test_samples', 'Unknown')}

## Performance Summary
- **Overall Grade**: {results.get('performance_grade', 'Unknown')}

"""
    
    if problem_type == 'classification':
        report += f"""## Classification Metrics
- **Accuracy**: {results.get('accuracy', 0):.4f}
- **Precision**: {results.get('precision', 0):.4f}
- **Recall**: {results.get('recall', 0):.4f}
- **F1-Score**: {results.get('f1_score', 0):.4f}

## Model Interpretation
The model shows {"excellent" if results.get('accuracy', 0) > 0.9 else "good" if results.get('accuracy', 0) > 0.8 else "fair"} performance on the test set.
"""
    else:
        report += f"""## Regression Metrics
- **MSE**: {results.get('mse', 0):.4f}
- **MAE**: {results.get('mae', 0):.4f}
- **RMSE**: {results.get('rmse', 0):.4f}
- **R² Score**: {results.get('r2_score', 0):.4f}

## Model Interpretation
The model explains {results.get('r2_score', 0)*100:.1f}% of the variance in the target variable.
"""
    
    if 'feature_importance' in results:
        report += f"""
## Feature Importance
Top 5 most important features:
"""
        for i, (feature, importance) in enumerate(list(results['feature_importance'].items())[:5]):
            report += f"{i+1}. **{feature}**: {importance:.4f}\n"
    
    report += f"""
## Files Generated
- `detailed_predictions.csv`: Individual predictions for each test sample
- `evaluation_results.json`: Complete evaluation metrics in JSON format
- `{'confusion_matrix.png' if problem_type == 'classification' else 'regression_plots.png'}`: Visualization of model performance
"""
    
    if 'feature_importance' in results:
        report += "- `feature_importance.png`: Feature importance visualization\n"
    
    return report

def main():
    if len(sys.argv) != 3:
        print("Usage: python evaluation.py <config_file> <stage_id>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    stage_id = sys.argv[2]
    
    try:
        config = load_config(config_file, stage_id)
        success = evaluate_model(config)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()