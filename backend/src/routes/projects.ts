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
    body('techStack').optional().isObject().withMessage('Tech stack must be an object')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const projectData = {
        name: req.body.name,
        description: req.body.description,
        projectType: req.body.projectType,
        ownerId: (user._id as any).toString(), // Use authenticated user ID
        files: req.body.files || {},
        techStack: req.body.techStack || {}
      };

      const project = new Project(projectData);
      await project.save();

      res.status(201).json({
        success: true,
        data: project
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
    query('projectType').optional().isIn(['frontend', 'backend', 'fullstack']).withMessage('Invalid project type')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build filter - only show user's own projects
      const filter: any = { ownerId: (user._id as any).toString() };
      if (req.query.status) filter.status = req.query.status;
      if (req.query.projectType) filter.projectType = req.query.projectType;

      const [projects, total] = await Promise.all([
        Project.find(filter)
          .sort({ updatedAt: -1 })
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
  async (req: Request, res: Response) => {
    try {
      const project = await Project.findOne({ 
        _id: req.params.id, 
        ownerId: (((req as AuthenticatedRequest).user!)._id as any).toString() 
      });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
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
    body('status').optional().isIn(['draft', 'active', 'completed', 'archived']).withMessage('Invalid status')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const updateData = { ...req.body };
      delete updateData.ownerId; // Prevent changing owner
      delete updateData._id; // Prevent changing ID

      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, ownerId: (((req as AuthenticatedRequest).user!)._id as any).toString() },
        updateData,
        { new: true, runValidators: true }
      );

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      res.json({
        success: true,
        data: project
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
  async (req: Request, res: Response) => {
    try {
      const project = await Project.findOneAndDelete({ 
        _id: req.params.id, 
        ownerId: (((req as AuthenticatedRequest).user!)._id as any).toString() 
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

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

export default router;