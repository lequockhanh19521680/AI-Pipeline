import { Octokit } from '@octokit/rest';
import { GitHubConfig, PRDetails, RepoStructure, GeneratedCode, FileNode } from '../../../shared/interfaces/api.js';

export class GitHubService {
  private octokit: Octokit | null = null;

  setToken(token: string): void {
    this.octokit = new Octokit({
      auth: token
    });
  }

  async analyzeRepository(owner: string, repo: string): Promise<RepoStructure> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const { data: repoData } = await this.octokit.repos.get({
        owner,
        repo
      });

      const { data: contents } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ''
      });

      const structure = await this.buildFileTree(owner, repo, contents);

      return {
        files: structure,
        languages: { [repoData.language || 'Unknown']: 100 },
        topics: repoData.topics || [],
        description: repoData.description || '',
        framework: repoData.language || undefined
      };
    } catch (error) {
      throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async buildFileTree(owner: string, repo: string, contents: any): Promise<FileNode[]> {
    const nodes: FileNode[] = [];

    for (const item of contents) {
      if (Array.isArray(item)) continue;

      const node: FileNode = {
        name: item.name,
        type: item.type === 'dir' ? 'directory' : 'file',
        path: item.path
      };

      if (item.type === 'dir') {
        try {
          const { data: subContents } = await this.octokit!.repos.getContent({
            owner,
            repo,
            path: item.path
          });
          node.children = await this.buildFileTree(owner, repo, subContents);
        } catch (error) {
          // Skip if unable to read directory
          node.children = [];
        }
      }

      nodes.push(node);
    }

    return nodes;
  }

  async pushToRepository(
    config: GitHubConfig,
    generatedCode: GeneratedCode,
    commitMessage: string
  ): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
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

      // Create or update the single file
      const filePath = generatedCode.filename;
      const content = generatedCode.content;
      
      try {
        // Check if file exists
        const { data: existingFile } = await this.octokit.repos.getContent({
          owner: config.owner,
          repo: config.repo,
          path: filePath,
          ref: branchName
        });

        // Update existing file
        await this.octokit.repos.createOrUpdateFileContents({
            owner: config.owner,
            repo: config.repo,
            path: filePath,
            message: `Update ${filePath}`,
            content: Buffer.from(content as string).toString('base64'),
            branch: branchName,
            sha: Array.isArray(existingFile) ? existingFile[0].sha : existingFile.sha
          });
        } catch (error) {
          // File doesn't exist, create it
          await this.octokit.repos.createOrUpdateFileContents({
            owner: config.owner,
            repo: config.repo,
            path: filePath,
            message: `Add ${filePath}`,
            content: Buffer.from(content as string).toString('base64'),
            branch: branchName
          });
        }
      } catch (fileError) {
        // File doesn't exist, create it
        await this.octokit.repos.createOrUpdateFileContents({
          owner: config.owner,
          repo: config.repo,
          path: filePath,
          message: `Add ${filePath}`,
          content: Buffer.from(content as string).toString('base64'),
          branch: branchName
        });
      }

      return branchName;
    } catch (error) {
      throw new Error(`Failed to push to repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPullRequest(
    config: GitHubConfig,
    branchName: string,
    title: string,
    description: string,
    generatedCode: GeneratedCode
  ): Promise<PRDetails> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const filesList = `- \`${generatedCode.filename}\``;
      
      const enhancedDescription = `
# 🚀 AI-Generated Application

${description}

## 📁 Generated Files
${filesList}

## 🏗️ Project Structure
- **File**: ${generatedCode.filename}
- **Path**: ${generatedCode.path}

## 🧪 Testing Instructions
1. Clone this branch
2. Install dependencies: \`npm install\`
3. Start the development server: \`npm run dev\`
4. Test the application functionality

## 🔄 Auto-generated by AI Pipeline IDE
This PR was automatically created by the AI Pipeline IDE platform.
      `;

      const { data: pr } = await this.octokit.pulls.create({
        owner: config.owner,
        repo: config.repo,
        title,
        head: branchName,
        base: config.branch || 'main',
        body: enhancedDescription
      });

      return {
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
        description: enhancedDescription,
        branch: branchName
      };
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async autoMergePullRequest(
    config: GitHubConfig,
    prNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'
  ): Promise<boolean> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      // Check if user has merge permissions
      const { data: repo } = await this.octokit.repos.get({
        owner: config.owner,
        repo: config.repo
      });

      if (!repo.permissions?.push) {
        throw new Error('Insufficient permissions to merge pull request');
      }

      // Merge the pull request
      await this.octokit.pulls.merge({
        owner: config.owner,
        repo: config.repo,
        pull_number: prNumber,
        merge_method: mergeMethod,
        commit_title: 'AI-generated application merge',
        commit_message: 'Automatically merged AI-generated code via AI Pipeline IDE'
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to merge pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
}