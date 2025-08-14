import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Theme management
  isDarkMode: boolean;
  
  // Terminal output
  terminalOutput: string[];
  
  // Tab management
  openTabs: string[];
  currentFile: string;
  
  // Panel visibility
  showProjectInput: boolean;
  showPreview: boolean;
  showBackendStatus: boolean;
  showStageDetail: boolean;
  showProjectManagement: boolean;
  showGitHubIntegration: boolean;
  showAuthModal: boolean;
  
  // View management
  currentView: 'code' | 'pipeline' | 'projects' | 'github' | 'review';
  pipelineView: 'builder' | 'flow' | 'dashboard';
  authMode: 'login' | 'register' | 'profile';
  
  // Backend connection
  backendConnected: boolean;
  
  // Actions
  setTheme: (isDarkMode: boolean) => void;
  addTerminalMessage: (message: string) => void;
  clearTerminal: () => void;
  openTab: (filename: string) => void;
  closeTab: (filename: string) => void;
  setCurrentFile: (filename: string) => void;
  togglePanel: (panel: keyof Pick<UIState, 'showProjectInput' | 'showPreview' | 'showBackendStatus' | 'showStageDetail' | 'showProjectManagement' | 'showGitHubIntegration' | 'showAuthModal'>) => void;
  setPanel: (panel: keyof Pick<UIState, 'showProjectInput' | 'showPreview' | 'showBackendStatus' | 'showStageDetail' | 'showProjectManagement' | 'showGitHubIntegration' | 'showAuthModal'>, value: boolean) => void;
  setCurrentView: (view: 'code' | 'pipeline' | 'projects' | 'github' | 'review') => void;
  setPipelineView: (view: 'builder' | 'flow' | 'dashboard') => void;
  setAuthMode: (mode: 'login' | 'register' | 'profile') => void;
  setBackendConnected: (connected: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isDarkMode: true,
      terminalOutput: [
        '🤖 AI Pipeline IDE v3.0.0 - Professional Edition',
        '✨ Enhanced with real ML pipelines and GitHub integration',
        '🚀 Ready to build production-ready applications!'
      ],
      openTabs: ['project-requirements.md'],
      currentFile: 'project-requirements.md',
      showProjectInput: false,
      showPreview: false,
      showBackendStatus: false,
      showStageDetail: false,
      showProjectManagement: false,
      showGitHubIntegration: false,
      showAuthModal: false,
      currentView: 'code',
      pipelineView: 'builder',
      authMode: 'login',
      backendConnected: false,

      // Actions
      setTheme: (isDarkMode: boolean) => {
        set({ isDarkMode });
        // Apply theme to document
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      addTerminalMessage: (message: string) => {
        set(state => ({
          terminalOutput: [...state.terminalOutput, message]
        }));
      },

      clearTerminal: () => {
        set({
          terminalOutput: [
            '🤖 AI Pipeline IDE v3.0.0 - Professional Edition',
            '✨ Enhanced with real ML pipelines and GitHub integration',
            '🚀 Ready to build production-ready applications!'
          ]
        });
      },

      openTab: (filename: string) => {
        const { openTabs } = get();
        if (!openTabs.includes(filename)) {
          set({ openTabs: [...openTabs, filename] });
        }
        set({ currentFile: filename });
      },

      closeTab: (filename: string) => {
        const { openTabs, currentFile } = get();
        const newTabs = openTabs.filter(tab => tab !== filename);
        set({ openTabs: newTabs });
        
        if (currentFile === filename && newTabs.length > 0) {
          set({ currentFile: newTabs[newTabs.length - 1] });
        }
      },

      setCurrentFile: (filename: string) => {
        set({ currentFile: filename });
      },

      togglePanel: (panel) => {
        set(state => ({
          [panel]: !state[panel]
        }));
      },

      setPanel: (panel, value) => {
        set({ [panel]: value });
      },

      setCurrentView: (view) => {
        set({ currentView: view });
      },

      setPipelineView: (view) => {
        set({ pipelineView: view });
      },

      setAuthMode: (mode) => {
        set({ authMode: mode });
      },

      setBackendConnected: (connected) => {
        set({ backendConnected: connected });
      }
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        openTabs: state.openTabs,
        currentFile: state.currentFile,
        currentView: state.currentView,
        pipelineView: state.pipelineView
      })
    }
  )
);