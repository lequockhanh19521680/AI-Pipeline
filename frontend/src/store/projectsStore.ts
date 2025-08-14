import { create } from 'zustand';
import { ProjectMetadata } from '../types';
import { projectsService } from '../services/ProjectsService';

interface ProjectsState {
  projects: ProjectMetadata[];
  currentProject: ProjectMetadata | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: (userId: string) => Promise<void>;
  createProject: (project: Omit<ProjectMetadata, 'id' | 'createdAt' | 'lastModified'>) => Promise<ProjectMetadata>;
  updateProject: (id: string, updates: Partial<ProjectMetadata>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: ProjectMetadata | null) => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  loadProjects: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await projectsService.getProjects(userId);
      set({ projects, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createProject: async (project) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await projectsService.createProject(project);
      set(state => ({ 
        projects: [...state.projects, newProject],
        isLoading: false 
      }));
      return newProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: string, updates: Partial<ProjectMetadata>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectsService.updateProject(id, updates);
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectsService.deleteProject(id);
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      set({ error: errorMessage, isLoading: false });
    }
  },

  setCurrentProject: (project: ProjectMetadata | null) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  }
}));