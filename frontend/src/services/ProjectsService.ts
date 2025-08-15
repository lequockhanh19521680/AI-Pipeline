import { ProjectMetadata } from '../types';

export interface ProjectAPI {
  createProject(project: Omit<ProjectMetadata, 'id' | 'createdAt' | 'lastModified'>): Promise<ProjectMetadata>;
  getProjects(ownerId: string): Promise<ProjectMetadata[]>;
  getProject(id: string): Promise<ProjectMetadata>;
  updateProject(id: string, updates: Partial<ProjectMetadata>): Promise<ProjectMetadata>;
  deleteProject(id: string): Promise<void>;
}

class ProjectsService implements ProjectAPI {
  private baseURL: string;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  }

  async createProject(project: Omit<ProjectMetadata, 'id' | 'createdAt' | 'lastModified'>): Promise<ProjectMetadata> {
    return this.request<ProjectMetadata>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getProjects(ownerId: string): Promise<ProjectMetadata[]> {
    return this.request<ProjectMetadata[]>(`/projects?ownerId=${encodeURIComponent(ownerId)}`);
  }

  async getProject(id: string): Promise<ProjectMetadata> {
    return this.request<ProjectMetadata>(`/projects/${id}`);
  }

  async updateProject(id: string, updates: Partial<ProjectMetadata>): Promise<ProjectMetadata> {
    return this.request<ProjectMetadata>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const projectsService = new ProjectsService();
export default projectsService;