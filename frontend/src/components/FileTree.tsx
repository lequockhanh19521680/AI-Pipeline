import React, { useState, useCallback } from 'react';
import { getFileIcon } from '../data';
import { FileTreeProps, FileNode } from '../types';
import { useFileStore } from '../store/fileStore';

interface ContextMenuPosition {
  x: number;
  y: number;
  target?: FileNode | null;
}

const FileTreeItem: React.FC<{
  node: FileNode;
  currentFile: string;
  onFileSelect: (file: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  level: number;
}> = ({ node, currentFile, onFileSelect, onContextMenu, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isFileUnsaved } = useFileStore();
  
  const isFile = node.type === 'file';
  const isCurrentFile = isFile && node.path === currentFile;
  const hasUnsavedChanges = isFile && node.path && isFileUnsaved(node.path);
  
  const handleClick = () => {
    if (isFile && node.path) {
      onFileSelect(node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, node);
  };

  const getIcon = () => {
    if (isFile) {
      return getFileIcon(node.name);
    } else {
      return isExpanded 
        ? 'fas fa-folder-open text-blue-500' 
        : 'fas fa-folder text-blue-600';
    }
  };

  return (
    <>
      <div
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors file-item group ${
          isCurrentFile
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Folder Expand/Collapse Arrow */}
        {!isFile && (
          <button
            className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-xs text-gray-500 dark:text-gray-400`}></i>
          </button>
        )}
        
        {/* File/Folder Icon */}
        <div className={isFile ? 'ml-4' : ''}>
          <i className={getIcon()}></i>
        </div>
        
        {/* Name */}
        <span className="text-sm font-medium truncate flex-1">
          {node.name}
        </span>
        
        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Unsaved changes"></div>
        )}
        
        {/* Current File Indicator */}
        {isCurrentFile && (
          <i className="fas fa-circle text-primary-500 ml-auto" style={{ fontSize: '6px' }}></i>
        )}
        
        {/* Context Menu Button (visible on hover) */}
        <button
          className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e);
          }}
        >
          <i className="fas fa-ellipsis-h text-xs text-gray-500 dark:text-gray-400"></i>
        </button>
      </div>
      
      {/* Children (for folders) */}
      {!isFile && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem
              key={`${child.path || child.name}-${index}`}
              node={child}
              currentFile={currentFile}
              onFileSelect={onFileSelect}
              onContextMenu={onContextMenu}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

const ContextMenu: React.FC<{
  position: ContextMenuPosition;
  onClose: () => void;
  onAction: (action: string, target?: FileNode) => void;
}> = ({ position, onClose, onAction }) => {
  const handleAction = (action: string) => {
    onAction(action, position.target || undefined);
    onClose();
  };

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 z-50 min-w-[150px]"
      style={{ left: position.x, top: position.y }}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => handleAction('newFile')}
      >
        <i className="fas fa-file mr-2"></i>
        New File
      </button>
      <button
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => handleAction('newFolder')}
      >
        <i className="fas fa-folder mr-2"></i>
        New Folder
      </button>
      <hr className="my-1 border-gray-200 dark:border-gray-600" />
      <button
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => handleAction('rename')}
      >
        <i className="fas fa-edit mr-2"></i>
        Rename
      </button>
      <button
        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        onClick={() => handleAction('delete')}
      >
        <i className="fas fa-trash mr-2"></i>
        Delete
      </button>
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ files, fileTree, currentFile, onFileSelect }) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const { getFileTree } = useFileStore();
  
  // Use hierarchical structure if provided, otherwise convert flat list
  const treeData = fileTree || getFileTree();

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: node
    });
  }, []);

  const handleContextMenuAction = useCallback((action: string, target?: FileNode) => {
    // Placeholder implementations for context menu actions
    console.log(`Action: ${action}`, target);
    
    switch (action) {
      case 'newFile':
        console.log('Creating new file...');
        break;
      case 'newFolder':
        console.log('Creating new folder...');
        break;
      case 'rename':
        console.log('Renaming item...');
        break;
      case 'delete':
        console.log('Deleting item...');
        break;
    }
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

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
        <div className="space-y-0.5">
          {treeData.map((node, index) => (
            <FileTreeItem
              key={`${node.path || node.name}-${index}`}
              node={node}
              currentFile={currentFile}
              onFileSelect={onFileSelect}
              onContextMenu={handleContextMenu}
              level={0}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          onClose={handleCloseContextMenu}
          onAction={handleContextMenuAction}
        />
      )}
    </>
  );
};

export default FileTree;