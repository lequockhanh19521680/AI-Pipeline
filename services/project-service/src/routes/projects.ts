import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Project, IProject } from '../models/Project.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

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

// POST /api/projects - Create a new project
router.post('/',
  requireAuth,
  [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required and must be less than 255 characters'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
    body('projectType').isIn(['frontend', 'backend', 'fullstack']).withMessage('Project type must be frontend, backend, or fullstack'),
    body('files').optional().isObject().withMessage('Files must be an object'),
    body('techStack').optional().isObject().withMessage('Tech stack must be an object'),
    body('repositoryUrl').optional().isURL().withMessage('Repository URL must be a valid URL'),
    body('githubRepo').optional().isObject().withMessage('GitHub repo must be an object')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const projectData = {
        name: req.body.name,
        description: req.body.description,
        projectType: req.body.projectType,
        ownerId: user._id,
        files: req.body.files || {},
        techStack: req.body.techStack || {},
        repositoryUrl: req.body.repositoryUrl,
        githubRepo: req.body.githubRepo
      };

      const project = new Project(projectData);
      await project.save();

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project'
      });
    }
  }
);

// GET /api/projects - Get all projects (with pagination and filtering)
router.get('/',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['draft', 'active', 'completed', 'archived']).withMessage('Invalid status'),
    query('projectType').optional().isIn(['frontend', 'backend', 'fullstack']).withMessage('Invalid project type'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('includeCollaborations').optional().isBoolean().withMessage('includeCollaborations must be boolean')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const includeCollaborations = req.query.includeCollaborations === 'true';

      // Build filter
      const filter: any = includeCollaborations 
        ? { $or: [{ ownerId: user._id }, { 'collaborators.userId': user._id }] }
        : { ownerId: user._id };

      if (req.query.status) filter.status = req.query.status;
      if (req.query.projectType) filter.projectType = req.query.projectType;
      if (req.query.search) {
        filter.$text = { $search: req.query.search };
      }

      const [projects, total] = await Promise.all([
        Project.find(filter)
          .sort(req.query.search ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-files'), // Exclude large files field from list view
        Project.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects'
      });
    }
  }
);

// GET /api/projects/:id - Get a specific project
router.get('/:id',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid project ID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Check access permissions
      if (!(project as any).hasAccess(user._id, 'viewer')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch project'
      });
    }
  }
);

// PUT /api/projects/:id - Update a project
router.put('/:id',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be less than 255 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('projectType').optional().isIn(['frontend', 'backend', 'fullstack']).withMessage('Invalid project type'),
    body('files').optional().isObject().withMessage('Files must be an object'),
    body('techStack').optional().isObject().withMessage('Tech stack must be an object'),
    body('status').optional().isIn(['draft', 'active', 'completed', 'archived']).withMessage('Invalid status'),
    body('repositoryUrl').optional().isURL().withMessage('Repository URL must be a valid URL'),
    body('githubRepo').optional().isObject().withMessage('GitHub repo must be an object')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Check edit permissions
      if (!(project as any).hasAccess(user._id, 'editor')) {
        return res.status(403).json({
          success: false,
          error: 'Edit access denied'
        });
      }

      const updateData = { ...req.body };
      delete updateData.ownerId; // Prevent changing owner
      delete updateData._id; // Prevent changing ID
      delete updateData.collaborators; // Use separate endpoint for collaborators

      Object.assign(project, updateData);
      await project.save();

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project'
      });
    }
  }
);

// DELETE /api/projects/:id - Delete a project
router.delete('/:id',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid project ID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Only owner can delete
      if (project.ownerId !== user._id) {
        return res.status(403).json({
          success: false,
          error: 'Only project owner can delete the project'
        });
      }

      await Project.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project'
      });
    }
  }
);

// POST /api/projects/:id/collaborators - Add collaborator
router.post('/:id/collaborators',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('userId').isString().withMessage('User ID is required'),
    body('role').isIn(['editor', 'viewer']).withMessage('Role must be editor or viewer')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Only owner can add collaborators
      if (project.ownerId !== user._id) {
        return res.status(403).json({
          success: false,
          error: 'Only project owner can add collaborators'
        });
      }

      (project as any).addCollaborator(req.body.userId, req.body.role);
      await project.save();

      res.json({
        success: true,
        data: project,
        message: 'Collaborator added successfully'
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add collaborator'
      });
    }
  }
);

// DELETE /api/projects/:id/collaborators/:userId - Remove collaborator
router.delete('/:id/collaborators/:userId',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    param('userId').isString().withMessage('Invalid user ID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Only owner can remove collaborators
      if (project.ownerId !== user._id) {
        return res.status(403).json({
          success: false,
          error: 'Only project owner can remove collaborators'
        });
      }

      (project as any).removeCollaborator(req.params.userId);
      await project.save();

      res.json({
        success: true,
        data: project,
        message: 'Collaborator removed successfully'
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove collaborator'
      });
    }
  }
);

export default router;