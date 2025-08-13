import React from 'react';
import { getFileIcon } from '../data';
import { FileTreeProps } from '../types';

const FileTree: React.FC<FileTreeProps> = ({ files, currentFile, onFileSelect }) => {
  return (
    <>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-600">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Project Explorer</h2>
          <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700">
            <i className="fas fa-plus text-xs text-gray-600 dark:text-gray-400"></i>
          </button>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <div className="space-y-1">
          {files.map(filename => (
            <div
              key={filename}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors file-item ${
                filename === currentFile
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
              onClick={() => onFileSelect(filename)}
            >
              <i className={getFileIcon(filename)}></i>
              <span className="text-sm font-medium truncate">{filename}</span>
              {filename === currentFile && (
                <i className="fas fa-circle text-primary-500 ml-auto" style={{ fontSize: '6px' }}></i>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FileTree;