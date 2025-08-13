import React, { useEffect, useState } from 'react';
import { PreviewPanelProps } from '../types';

const PreviewPanel: React.FC<PreviewPanelProps> = ({ files, projectType, isVisible }) => {
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && (projectType === 'frontend' || projectType === 'fullstack')) {
      generatePreview();
    }
  }, [files, isVisible, projectType]);

  const generatePreview = () => {
    setIsLoading(true);
    
    // Find HTML files or create a basic preview
    const htmlFiles = Object.entries(files).filter(([name]) => 
      name.endsWith('.html') || name === 'index.html'
    );
    
    let html = '';
    
    if (htmlFiles.length > 0) {
      // Use the first HTML file found
      html = htmlFiles[0][1];
    } else {
      // Create a basic preview from other files
      const cssFiles = Object.entries(files).filter(([name]) => 
        name.endsWith('.css')
      );
      const jsFiles = Object.entries(files).filter(([name]) => 
        name.endsWith('.js') || name.endsWith('.jsx')
      );
      
      const cssContent = cssFiles.map(([_, content]) => content).join('\n');
      const hasReact = jsFiles.some(([_, content]) => 
        content.includes('React') || content.includes('jsx')
      );
      
      if (hasReact) {
        html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Preview</title>
    <style>${cssContent}</style>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <div class="preview-notice" style="
        position: fixed; 
        top: 10px; 
        right: 10px; 
        background: #1f2937; 
        color: white; 
        padding: 8px 12px; 
        border-radius: 6px; 
        font-size: 12px;
        z-index: 1000;
    ">
        🎬 Live Preview - React App
    </div>
    <script type="text/babel">
        // Basic React preview
        const App = () => {
            return React.createElement('div', {
                style: {
                    padding: '20px',
                    fontFamily: 'system-ui, sans-serif',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minHeight: '100vh',
                    color: 'white'
                }
            }, [
                React.createElement('h1', {key: 'title'}, 'React Application Preview'),
                React.createElement('p', {key: 'desc'}, 'This is a preview of your React application.'),
                React.createElement('div', {
                    key: 'status',
                    style: {
                        background: 'rgba(255,255,255,0.1)',
                        padding: '15px',
                        borderRadius: '8px',
                        marginTop: '20px'
                    }
                }, 'Application is ready for development!')
            ]);
        };
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
    </script>
</body>
</html>`;
      } else {
        // Basic HTML/CSS preview
        html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        .preview-notice {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #1f2937;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
        }
        ${cssContent}
    </style>
</head>
<body>
    <div class="preview-notice">🎬 Live Preview</div>
    <div class="container">
        <h1>🚀 Project Preview</h1>
        <p>This is a preview of your generated project.</p>
        <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px;">
            <h3>📁 Project Files:</h3>
            <ul>
                ${Object.keys(files).map(name => `<li>${name}</li>`).join('')}
            </ul>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: rgba(0,255,0,0.1); border-radius: 8px; border-left: 4px solid #22c55e;">
            <strong>✅ Application Ready!</strong><br>
            Your project has been generated and is ready for development.
        </div>
    </div>
</body>
</html>`;
      }
    }
    
    setPreviewHtml(html);
    setIsLoading(false);
  };

  if (!isVisible || (projectType !== 'frontend' && projectType !== 'fullstack')) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
          <i className="fas fa-eye mr-2 text-primary-600"></i>
          Live Preview
        </h3>
        <button
          onClick={generatePreview}
          disabled={isLoading}
          className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>
              Updating...
            </>
          ) : (
            <>
              <i className="fas fa-sync mr-1"></i>
              Refresh
            </>
          )}
        </button>
      </div>
      
      <div className="flex-1 relative">
        {previewHtml ? (
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Project Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <i className="fas fa-eye text-4xl mb-4"></i>
              <p>Preview will appear here</p>
              <p className="text-xs">Generate frontend code to see preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;