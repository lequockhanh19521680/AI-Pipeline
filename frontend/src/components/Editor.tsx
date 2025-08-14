import React, { useState, useEffect } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { EditorProps } from '../types';

const Editor: React.FC<EditorProps> = ({ value, content, filename, onChange }) => {
  // Use value prop if provided, otherwise fall back to content for backward compatibility
  const editorValue = value !== undefined ? value : content || '';

  const handleChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  const getLanguageFromFilename = (filename?: string): string => {
    if (!filename) return 'text';
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'py':
        return 'python';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      case 'sql':
        return 'sql';
      default:
        return 'plaintext';
    }
  };

  // Update local state when content prop changes - removed since Monaco handles this
  // useEffect(() => {
  //   setEditorContent(content);
  // }, [content]);

  return (
    <div className="flex-1 relative">
      {/* Monaco Editor Container */}
      <div className="h-full">
        <MonacoEditor
          value={editorValue}
          onChange={handleChange}
          language={getLanguageFromFilename(filename)}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            cursorStyle: 'line',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            }
          }}
          loading={<div className="flex items-center justify-center h-full bg-gray-900 text-white">Loading editor...</div>}
        />
      </div>
      
      {/* File info overlay */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        {getLanguageFromFilename(filename)} • {editorValue.split('\n').length} lines
      </div>
    </div>
  );
};

export default Editor;