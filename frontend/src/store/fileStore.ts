import { create } from 'zustand';
import { FileMap } from '../types';
import { initialFiles } from '../data';

interface FileState {
  files: FileMap;
  
  // Actions
  updateFile: (filename: string, content: string) => void;
  setFiles: (files: FileMap) => void;
  addFile: (filename: string, content?: string) => void;
  deleteFile: (filename: string) => void;
  getFile: (filename: string) => string | undefined;
  getFileList: () => string[];
  hasFile: (filename: string) => boolean;
}

export const useFileStore = create<FileState>((set, get) => ({
  // Initial state
  files: initialFiles,

  // Actions
  updateFile: (filename: string, content: string) => {
    set(state => ({
      files: {
        ...state.files,
        [filename]: content
      }
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
      return { files: newFiles };
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
  }
}));