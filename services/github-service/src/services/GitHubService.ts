import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface PRDetails {
  number: number;
  url: string;
  title: string;
  description: string;
  branch: string;
}

export interface RepoStructure {
  files: FileNode[];
  languages: Record<string, number>;
  topics: string[];
  description: string;
  framework?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  content?: string;
  downloadUrl?: string;
}

export interface GeneratedCode {
  filename: string;
  content: string;
  path: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;

  constructor() {}

  setToken(token: string): void {
    this.octokit = new Octokit({
      auth: token
    });
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: string }> {
    try {
      const tempOctokit = new Octokit({ auth: token });
      const { data: user } = await tempOctokit.users.getAuthenticated();
      
      return {
        valid: true,
        user: user.login
      };
    } catch (error) {
      return {
        valid: false
      };
    }
  }

  async getUserRepos(token: string, page: number = 1, perPage: number = 30): Promise<any[]> {
    const tempOctokit = new Octokit({ auth: token });
    
    try {
      const { data } = await tempOctokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        page,
        per_page: perPage
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        updatedAt: repo.updated_at,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch
      }));
    } catch (error) {
      throw new Error(`Failed to fetch repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeRepository(config: GitHubConfig): Promise<RepoStructure> {
    if (!this.octokit) {
      const tempOctokit = new Octokit({ auth: config.token });
      this.octokit = tempOctokit;
    }

    try {
      // Get repository info
      const { data: repo } = await this.octokit.repos.get({
        owner: config.owner,
        repo: config.repo
      });

      // Get languages
      const { data: languages } = await this.octokit.repos.listLanguages({
        owner: config.owner,
        repo: config.repo
      });

      // Get repository contents (files)
      const files = await this.getRepositoryTree(config.owner, config.repo, config.branch || repo.default_branch);

      // Get topics
      const { data: topics } = await this.octokit.repos.getAllTopics({
        owner: config.owner,
        repo: config.repo
      });

      return {
        files,
        languages,
        topics: topics.names,
        description: repo.description || '',
        framework: this.detectFramework(files, languages)
      };
    } catch (error) {
      throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getRepositoryTree(owner: string, repo: string, branch: string, path: string = ''): Promise<FileNode[]> {
    if (!this.octokit) throw new Error('GitHub token not configured');

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      if (!Array.isArray(data)) {
        // Single file
        return [{
          name: data.name,
          path: data.path,
          type: 'file',
          size: data.size,
          downloadUrl: data.download_url || undefined
        }];
      }

      const files: FileNode[] = [];
      
      for (const item of data) {
        if (item.type === 'dir') {
          // Don't recursively fetch all directories to avoid API limits
          files.push({
            name: item.name,
            path: item.path,
            type: 'directory',
            size: 0,
            children: [] // Can be populated on demand
          });
        } else {
          files.push({
            name: item.name,
            path: item.path,
            type: 'file',
            size: item.size,
            downloadUrl: item.download_url || undefined
          });
        }
      }

      return files;
    } catch (error) {
      throw new Error(`Failed to get repository tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileContent(config: GitHubConfig, path: string): Promise<string> {
    if (!this.octokit) {
      this.octokit = new Octokit({ auth: config.token });
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path,
        ref: config.branch
      });

      if (Array.isArray(data)) {
        throw new Error('Path is a directory, not a file');
      }

      if (data.type !== 'file') {
        throw new Error('Requested path is not a file');
      }

      // Decode base64 content
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to get file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPullRequest(
    config: GitHubConfig,
    title: string,
    description: string,
    head: string,
    base: string = 'main'
  ): Promise<PRDetails> {
    if (!this.octokit) {
      this.octokit = new Octokit({ auth: config.token });
    }

    try {
      const { data } = await this.octokit.pulls.create({
        owner: config.owner,
        repo: config.repo,
        title,
        body: description,
        head,
        base
      });

      return {
        number: data.number,
        url: data.html_url,
        title: data.title,
        description: data.body || '',
        branch: data.head.ref
      };
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async pushCode(
    config: GitHubConfig,
    files: GeneratedCode[],
    commitMessage: string
  ): Promise<string> {
    if (!this.octokit) {
      this.octokit = new Octokit({ auth: config.token });
    }

    const branchName = `ai-generated-${Date.now()}`;

    try {
      // Get the default branch
      const { data: repo } = await this.octokit.repos.get({
        owner: config.owner,
        repo: config.repo
      });

      const defaultBranch = repo.default_branch;

      // Get the latest commit SHA from the default branch
      const { data: ref } = await this.octokit.git.getRef({
        owner: config.owner,
        repo: config.repo,
        ref: `heads/${defaultBranch}`
      });

      // Create a new branch
      await this.octokit.git.createRef({
        owner: config.owner,
        repo: config.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha
      });

      // Push files to the new branch
      for (const file of files) {
        const filePath = file.path ? `${file.path}/${file.filename}` : file.filename;
        
        await this.octokit.repos.createOrUpdateFileContents({
          owner: config.owner,
          repo: config.repo,
          path: filePath,
          message: `Add ${filePath}`,
          content: Buffer.from(file.content).toString('base64'),
          branch: branchName
        });
      }

      return branchName;
    } catch (error) {
      throw new Error(`Failed to push code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private detectFramework(files: FileNode[], languages: Record<string, number>): string | undefined {
    const fileNames = files.map(f => f.name.toLowerCase());
    
    // React detection
    if (fileNames.includes('package.json')) {
      return 'React'; // Could be enhanced to check package.json content
    }
    
    // Vue detection
    if (fileNames.some(name => name.endsWith('.vue'))) {
      return 'Vue.js';
    }
    
    // Angular detection
    if (fileNames.includes('angular.json')) {
      return 'Angular';
    }
    
    // Next.js detection
    if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
      return 'Next.js';
    }
    
    // Laravel detection
    if (fileNames.includes('artisan') && languages['PHP']) {
      return 'Laravel';
    }
    
    // Express.js detection
    if (fileNames.includes('server.js') || fileNames.includes('app.js')) {
      return 'Express.js';
    }
    
    return undefined;
  }
}