import { create } from 'zustand';
import { FileMap, FileNode } from '../types';
import { initialFiles } from '../data';

interface FileState {
  files: FileMap;
  unsavedFiles: Set<string>; // Track files with unsaved changes
  
  // Actions
  updateFile: (filename: string, content: string) => void;
  setFiles: (files: FileMap) => void;
  addFile: (filename: string, content?: string) => void;
  deleteFile: (filename: string) => void;
  getFile: (filename: string) => string | undefined;
  getFileList: () => string[];
  hasFile: (filename: string) => boolean;
  markFileAsUnsaved: (filename: string) => void;
  markFileAsSaved: (filename: string) => void;
  isFileUnsaved: (filename: string) => boolean;
  getFileTree: () => FileNode[];
}

export const useFileStore = create<FileState>((set, get) => ({
  // Initial state
  files: initialFiles,
  unsavedFiles: new Set<string>(),

  // Actions
  updateFile: (filename: string, content: string) => {
    set(state => ({
      files: {
        ...state.files,
        [filename]: content
      },
      unsavedFiles: new Set([...state.unsavedFiles, filename])
    }));
  },

  setFiles: (files: FileMap) => {
    set({ files });
  },

  addFile: (filename: string, content = '') => {
    set(state => ({
      files: {
        ...state.files,
        [filename]: content
      }
    }));
  },

  deleteFile: (filename: string) => {
    set(state => {
      const newFiles = { ...state.files };
      delete newFiles[filename];
      const newUnsavedFiles = new Set(state.unsavedFiles);
      newUnsavedFiles.delete(filename);
      return { files: newFiles, unsavedFiles: newUnsavedFiles };
    });
  },

  getFile: (filename: string) => {
    return get().files[filename];
  },

  getFileList: () => {
    return Object.keys(get().files);
  },

  hasFile: (filename: string) => {
    return filename in get().files;
  },

  markFileAsUnsaved: (filename: string) => {
    set(state => ({
      unsavedFiles: new Set([...state.unsavedFiles, filename])
    }));
  },

  markFileAsSaved: (filename: string) => {
    set(state => {
      const newUnsavedFiles = new Set(state.unsavedFiles);
      newUnsavedFiles.delete(filename);
      return { unsavedFiles: newUnsavedFiles };
    });
  },

  isFileUnsaved: (filename: string) => {
    return get().unsavedFiles.has(filename);
  },

  getFileTree: () => {
    const files = get().files;
    const fileList = Object.keys(files);
    
    // Convert flat file list to hierarchical structure
    const tree: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();
    
    fileList.forEach(filePath => {
      const parts = filePath.split('/');
      let currentLevel = tree;
      let currentPath = '';
      
      parts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        const isFile = index === parts.length - 1;
        
        if (isFile) {
          // Add file
          currentLevel.push({
            name: part,
            type: 'file',
            path: currentPath
          });
        } else {
          // Add or find folder
          let folder = currentLevel.find(node => node.name === part && node.type === 'folder');
          if (!folder) {
            folder = {
              name: part,
              type: 'folder',
              children: [],
              path: currentPath
            };
            currentLevel.push(folder);
            folderMap.set(currentPath, folder);
          }
          currentLevel = folder.children!;
        }
      });
    });
    
    return tree;
  }
}));