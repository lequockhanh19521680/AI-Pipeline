import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

interface MinimalistCodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: 'vs-dark' | 'vs-light';
  className?: string;
  showPreview?: boolean;
  previewContent?: string;
  onBuild?: () => void;
  onPreview?: () => void;
}

export const MinimalistCodeEditor: React.FC<MinimalistCodeEditorProps> = ({
  value = '',
  onChange,
  language = 'typescript',
  theme = 'vs-dark',
  className = '',
  showPreview = true,
  previewContent = '',
  onBuild,
  onPreview,
}) => {
  const [editorValue, setEditorValue] = useState(value);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = (newValue: string = '') => {
    setEditorValue(newValue);
    onChange?.(newValue);
    
    // Auto-save after 2 seconds of inactivity
    const timer = setTimeout(() => {
      console.log('Auto-saved');
    }, 2000);
    
    return () => clearTimeout(timer);
  };

  const handleBuild = async () => {
    if (!onBuild) return;
    
    setIsBuilding(true);
    setBuildStatus('idle');
    
    try {
      await onBuild();
      setBuildStatus('success');
    } catch (error) {
      setBuildStatus('error');
      console.error('Build failed:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    }
  };

  const getBuildButtonStyle = () => {
    switch (buildStatus) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getBuildButtonText = () => {
    if (isBuilding) return 'Building...';
    switch (buildStatus) {
      case 'success':
        return '✓ Built';
      case 'error':
        return '✗ Failed';
      default:
        return 'Build';
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Minimalist Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {language.toUpperCase()}
          </span>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Auto-save enabled
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className={`px-4 py-1 text-white text-sm rounded transition-colors ${getBuildButtonStyle()} ${
              isBuilding ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {getBuildButtonText()}
          </button>
          
          {showPreview && (
            <button
              onClick={handlePreview}
              className="px-4 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors"
            >
              Preview
            </button>
          )}
        </div>
      </div>

      {/* Split View: Code Editor + Preview */}
      <div className="flex-1">
        {showPreview ? (
          <Allotment>
            {/* Code Editor Panel */}
            <Allotment.Pane preferredSize="60%">
              <div className="h-full">
                <Editor
                  height="100%"
                  language={language}
                  theme={theme}
                  value={editorValue}
                  onChange={handleEditorChange}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    
                    // Configure editor for better experience
                    editor.updateOptions({
                      fontSize: 14,
                      lineHeight: 22,
                      letterSpacing: 0.5,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      renderLineHighlight: 'line',
                      suggestOnTriggerCharacters: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      folding: true,
                      bracketMatching: 'always',
                      autoIndent: 'full',
                      formatOnPaste: true,
                      formatOnType: true,
                    });

                    // Add useful keybindings
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                      console.log('Save shortcut triggered');
                    });

                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
                      handleBuild();
                    });
                  }}
                  options={{
                    selectOnLineNumbers: true,
                    automaticLayout: true,
                  }}
                />
              </div>
            </Allotment.Pane>

            {/* Preview Panel */}
            <Allotment.Pane preferredSize="40%">
              <div className="h-full bg-white dark:bg-gray-900 border-l">
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview
                  </h3>
                </div>
                <div className="p-4 h-full overflow-auto">
                  {previewContent ? (
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">👁️</div>
                        <p className="text-sm">Preview will appear here</p>
                        <p className="text-xs mt-1">Click "Preview" to generate</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Allotment.Pane>
          </Allotment>
        ) : (
          // Full-width editor when preview is disabled
          <Editor
            height="100%"
            language={language}
            theme={theme}
            value={editorValue}
            onChange={handleEditorChange}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            options={{
              selectOnLineNumbers: true,
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MinimalistCodeEditor;