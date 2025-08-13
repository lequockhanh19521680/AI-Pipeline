import express from 'express';
import { GitHubService } from '../services/GitHubService';

const router = express.Router();

// Validate GitHub token
router.post('/validate-token', async (req, res) => {
  try {
    const githubService: GitHubService = req.app.locals.githubService;
    const { token } = req.body;
    
    const result = await githubService.validateToken(token);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Analyze repository
router.post('/analyze-repo', async (req, res) => {
  try {
    const githubService: GitHubService = req.app.locals.githubService;
    const { token, owner, repo } = req.body;
    
    githubService.setToken(token);
    const structure = await githubService.analyzeRepository(owner, repo);
    res.json({ success: true, structure });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Push generated code to repository
router.post('/push-code', async (req, res) => {
  try {
    const githubService: GitHubService = req.app.locals.githubService;
    const { token, config, generatedCode, commitMessage } = req.body;
    
    githubService.setToken(token);
    const branchName = await githubService.pushToRepository(config, generatedCode, commitMessage);
    res.json({ success: true, branchName });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Create pull request
router.post('/create-pr', async (req, res) => {
  try {
    const githubService: GitHubService = req.app.locals.githubService;
    const { token, config, branchName, title, description, generatedCode } = req.body;
    
    githubService.setToken(token);
    const prDetails = await githubService.createPullRequest(
      config, 
      branchName, 
      title, 
      description, 
      generatedCode
    );
    res.json({ success: true, prDetails });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Auto-merge pull request
router.post('/auto-merge', async (req, res) => {
  try {
    const githubService: GitHubService = req.app.locals.githubService;
    const { token, config, prNumber, mergeMethod } = req.body;
    
    githubService.setToken(token);
    const merged = await githubService.autoMergePullRequest(config, prNumber, mergeMethod);
    res.json({ success: true, merged });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;