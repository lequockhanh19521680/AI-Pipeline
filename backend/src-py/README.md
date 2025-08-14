# Python Environment Setup for ML Pipeline

## Prerequisites
- Python 3.8+ installed
- pip package manager

## Setup Virtual Environment

### Create Virtual Environment
```bash
python3 -m venv ml-pipeline-env
```

### Activate Virtual Environment

**On Linux/Mac:**
```bash
source ml-pipeline-env/bin/activate
```

**On Windows:**
```bash
ml-pipeline-env\Scripts\activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Verify Installation
```bash
python -c "import pandas, numpy, sklearn; print('All dependencies installed successfully!')"
```

## Usage in Production

The ML Pipeline system will automatically use the virtual environment when executing Python scripts. Ensure the virtual environment is activated before starting the backend server.

## Script Structure

All Python scripts should follow this structure:

```python
#!/usr/bin/env python3
import sys
import json
import yaml

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <config_file> <stage_id>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    stage_id = sys.argv[2]
    
    try:
        # Load configuration
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        
        # Process the stage
        result = process_stage(config, stage_id)
        
        # Output JSON result
        print(json.dumps({
            "status": "success",
            "stage": stage_id,
            "outputs": result,
            "artifacts": ["path/to/artifact1.json", "path/to/model.pkl"]
        }))
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "stage": stage_id,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## Output Format

Scripts should output JSON to stdout with the following structure:
- `status`: "success" or "error"
- `stage`: stage identifier
- `outputs`: stage-specific results
- `artifacts`: array of file paths to generated artifacts
- `error`: error message (if status is "error")