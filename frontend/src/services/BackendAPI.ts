import { 
  MLPipelineConfig, 
  PipelineExecution, 
  GitHubConfig, 
  RepoStructure, 
  GeneratedCode, 
  PRDetails,
  BackendAPI,
  BackendError
} from '../types';

class BackendAPIService implements BackendAPI {
  private baseURL: string;

  constructor(baseURL?: string) {
    // Use environment variable with fallback to localhost
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new BackendError(
        error.error || `Request failed with status ${response.status}`,
        response.status,
        endpoint
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new BackendError(data.error || 'Unknown backend error', response.status, endpoint);
    }

    return data;
  }

  // Pipeline operations
  async createPipeline(config: Partial<MLPipelineConfig>): Promise<MLPipelineConfig> {
    const response = await this.request<{ pipeline: MLPipelineConfig }>('/pipeline/create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return response.pipeline;
  }

  async executePipeline(id: string, config: MLPipelineConfig): Promise<string> {
    const response = await this.request<{ executionId: string }>(`/pipeline/execute/${id}`, {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
    return response.executionId;
  }

  async getPipelineStatus(id: string): Promise<PipelineExecution | null> {
    const response = await this.request<{ status: PipelineExecution | null }>(`/pipeline/status/${id}`);
    return response.status;
  }

  async stopPipeline(id: string): Promise<void> {
    await this.request(`/pipeline/stop/${id}`, {
      method: 'POST',
    });
  }

  // GitHub operations
  async validateToken(token: string): Promise<{ valid: boolean; user?: string }> {
    const response = await this.request<{ valid: boolean; user?: string }>('/github/validate-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return { valid: response.valid, user: response.user };
  }

  async analyzeRepo(token: string, owner: string, repo: string): Promise<RepoStructure> {
    const response = await this.request<{ structure: RepoStructure }>('/github/analyze-repo', {
      method: 'POST',
      body: JSON.stringify({ token, owner, repo }),
    });
    return response.structure;
  }

  async pushCode(
    token: string, 
    owner: string, 
    repo: string, 
    branch: string, 
    files: GeneratedCode[], 
    commitMessage: string
  ): Promise<PRDetails> {
    const response = await this.request<PRDetails>('/github/push-code', {
      method: 'POST',
      body: JSON.stringify({ token, owner, repo, branch, files, commitMessage }),
    });
    return response;
  }

  async createPR(
    token: string,
    config: GitHubConfig,
    branchName: string,
    title: string,
    description: string,
    generatedCode: GeneratedCode
  ): Promise<PRDetails> {
    const response = await this.request<{ prDetails: PRDetails }>('/github/create-pr', {
      method: 'POST',
      body: JSON.stringify({ token, config, branchName, title, description, generatedCode }),
    });
    return response.prDetails;
  }

  async autoMerge(
    token: string,
    config: GitHubConfig,
    prNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'
  ): Promise<boolean> {
    const response = await this.request<{ merged: boolean }>('/github/auto-merge', {
      method: 'POST',
      body: JSON.stringify({ token, config, prNumber, mergeMethod }),
    });
    return response.merged;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<{ user: any; token: string }> {
    const response = await this.request<{ data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ user: any; token: string }> {
    const response = await this.request<{ data: { user: any; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updateProfile(token: string, profileData: {
    firstName?: string;
    lastName?: string;
    preferences?: {
      theme?: 'light' | 'dark';
      notifications?: boolean;
    };
  }): Promise<any> {
    const response = await this.request<{ data: any }>('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });
    return response.data;
  }

  async getCurrentUser(token: string): Promise<any> {
    const response = await this.request<{ data: any }>('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });
    return response.data;
  }
}

// Create singleton instance
export const backendAPI = new BackendAPIService();
export default backendAPI;