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
    config: GitHubConfig, 
    generatedCode: GeneratedCode, 
    commitMessage: string
  ): Promise<string> {
    const response = await this.request<{ branchName: string }>('/github/push-code', {
      method: 'POST',
      body: JSON.stringify({ token, config, generatedCode, commitMessage }),
    });
    return response.branchName;
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
}

// Create singleton instance
export const backendAPI = new BackendAPIService();
export default backendAPI;