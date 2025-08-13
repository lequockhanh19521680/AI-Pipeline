import React, { useState } from 'react';

function Editor({ content, filename, onChange }) {
  const [editorContent, setEditorContent] = useState(content);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setEditorContent(newContent);
    onChange(newContent);
  };

  const getLanguageFromFilename = (filename) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'py':
        return 'python';
      case 'js':
      case 'jsx':
        return 'javascript';
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
  React.useEffect(() => {
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
}

export default Editor;