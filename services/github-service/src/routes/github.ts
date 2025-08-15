import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { GitHubService } from '../services/GitHubService.js';

const router = express.Router();
const githubService = new GitHubService();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/github/validate-token - Validate GitHub token
router.post('/validate-token',
  requireAuth,
  [
    body('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const result = await githubService.validateToken(token);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error validating GitHub token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate GitHub token'
      });
    }
  }
);

// GET /api/github/repos - Get user repositories
router.get('/repos',
  requireAuth,
  [
    query('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('perPage').optional().isInt({ min: 1, max: 100 }).withMessage('Per page must be between 1 and 100')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 30;
      
      const repos = await githubService.getUserRepos(token as string, page, perPage);
      
      res.json({
        success: true,
        data: repos,
        pagination: {
          page,
          perPage,
          hasMore: repos.length === perPage
        }
      });
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch repositories'
      });
    }
  }
);

// POST /api/github/analyze-repo - Analyze repository structure
router.post('/analyze-repo',
  requireAuth,
  [
    body('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required'),
    body('owner').isString().isLength({ min: 1 }).withMessage('Repository owner is required'),
    body('repo').isString().isLength({ min: 1 }).withMessage('Repository name is required'),
    body('branch').optional().isString().withMessage('Branch must be a string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { token, owner, repo, branch } = req.body;
      
      const config = { token, owner, repo, branch };
      const analysis = await githubService.analyzeRepository(config);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing repository:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze repository'
      });
    }
  }
);

// POST /api/github/get-file - Get file content
router.post('/get-file',
  requireAuth,
  [
    body('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required'),
    body('owner').isString().isLength({ min: 1 }).withMessage('Repository owner is required'),
    body('repo').isString().isLength({ min: 1 }).withMessage('Repository name is required'),
    body('path').isString().isLength({ min: 1 }).withMessage('File path is required'),
    body('branch').optional().isString().withMessage('Branch must be a string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { token, owner, repo, path, branch } = req.body;
      
      const config = { token, owner, repo, branch };
      const content = await githubService.getFileContent(config, path);
      
      res.json({
        success: true,
        data: {
          path,
          content,
          encoding: 'utf-8'
        }
      });
    } catch (error) {
      console.error('Error getting file content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get file content'
      });
    }
  }
);

// POST /api/github/push-code - Push generated code to repository
router.post('/push-code',
  requireAuth,
  [
    body('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required'),
    body('owner').isString().isLength({ min: 1 }).withMessage('Repository owner is required'),
    body('repo').isString().isLength({ min: 1 }).withMessage('Repository name is required'),
    body('files').isArray().withMessage('Files must be an array'),
    body('files.*.filename').isString().withMessage('Each file must have a filename'),
    body('files.*.content').isString().withMessage('Each file must have content'),
    body('files.*.path').optional().isString().withMessage('File path must be a string'),
    body('commitMessage').isString().isLength({ min: 1 }).withMessage('Commit message is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { token, owner, repo, files, commitMessage } = req.body;
      
      const config = { token, owner, repo };
      const branchName = await githubService.pushCode(config, files, commitMessage);
      
      res.json({
        success: true,
        data: {
          branchName,
          message: 'Code pushed successfully'
        }
      });
    } catch (error) {
      console.error('Error pushing code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to push code'
      });
    }
  }
);

// POST /api/github/create-pr - Create pull request
router.post('/create-pr',
  requireAuth,
  [
    body('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required'),
    body('owner').isString().isLength({ min: 1 }).withMessage('Repository owner is required'),
    body('repo').isString().isLength({ min: 1 }).withMessage('Repository name is required'),
    body('title').isString().isLength({ min: 1 }).withMessage('Pull request title is required'),
    body('description').isString().withMessage('Pull request description is required'),
    body('head').isString().isLength({ min: 1 }).withMessage('Head branch is required'),
    body('base').optional().isString().withMessage('Base branch must be a string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { token, owner, repo, title, description, head, base = 'main' } = req.body;
      
      githubService.setToken(token);
      const config = { token, owner, repo };
      const pr = await githubService.createPullRequest(config, title, description, head, base);
      
      res.json({
        success: true,
        data: pr
      });
    } catch (error) {
      console.error('Error creating pull request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create pull request'
      });
    }
  }
);

// POST /api/github/push-and-pr - Push code and create pull request in one operation
router.post('/push-and-pr',
  requireAuth,
  [
    body('token').isString().isLength({ min: 1 }).withMessage('GitHub token is required'),
    body('owner').isString().isLength({ min: 1 }).withMessage('Repository owner is required'),
    body('repo').isString().isLength({ min: 1 }).withMessage('Repository name is required'),
    body('files').isArray().withMessage('Files must be an array'),
    body('commitMessage').isString().isLength({ min: 1 }).withMessage('Commit message is required'),
    body('prTitle').isString().isLength({ min: 1 }).withMessage('Pull request title is required'),
    body('prDescription').isString().withMessage('Pull request description is required'),
    body('base').optional().isString().withMessage('Base branch must be a string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { 
        token, owner, repo, files, commitMessage, 
        prTitle, prDescription, base = 'main' 
      } = req.body;
      
      const config = { token, owner, repo };
      
      // Push code first
      const branchName = await githubService.pushCode(config, files, commitMessage);
      
      // Create pull request
      const pr = await githubService.createPullRequest(
        config, 
        prTitle, 
        prDescription, 
        branchName, 
        base
      );
      
      res.json({
        success: true,
        data: {
          branchName,
          pullRequest: pr,
          message: 'Code pushed and pull request created successfully'
        }
      });
    } catch (error) {
      console.error('Error pushing code and creating PR:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to push code and create pull request'
      });
    }
  }
);

export default router;