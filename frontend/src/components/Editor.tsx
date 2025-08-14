import React, { useState, useEffect } from 'react';
import { EditorProps } from '../types';

const Editor: React.FC<EditorProps> = ({ content, filename, onChange }) => {
  const [editorContent, setEditorContent] = useState<string>(content);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditorContent(newContent);
    onChange(newContent);
  };

  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'py':
        return 'python';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'text';
    }
  };

  // Update local state when content prop changes
  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  return (
    <div className="flex-1 relative">
      {/* Editor Container */}
      <div className="h-full">
        <textarea
          value={editorContent}
          onChange={handleChange}
          className="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 border-0 outline-none resize-none scrollbar-thin"
          spellCheck="false"
          placeholder={`// ${filename || 'AI Pipeline IDE'} - Code Editor`}
          style={{
            lineHeight: '1.5',
            tabSize: 4,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
          }}
        />
      </div>
      
      {/* File info overlay */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        {getLanguageFromFilename(filename)} • {editorContent.split('\n').length} lines
      </div>
    </div>
  );
};

export default Editor;