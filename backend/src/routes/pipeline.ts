import express from 'express';
import { body, validationResult } from 'express-validator';
import { PipelineService } from '../services/PipelineService';

const router = express.Router();

// Validation middleware for handling validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Validation rules for pipeline creation
const createPipelineValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('dataPath')
    .optional()
    .isString()
    .withMessage('DataPath must be a string')
    .matches(/^[a-zA-Z0-9\/\-_\.]+$/)
    .withMessage('DataPath must be a valid path-like string')
];

// Create a new pipeline
router.post('/create', createPipelineValidation, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const pipelineService: PipelineService = req.app.locals.pipelineService;
    const pipeline = await pipelineService.createPipeline(req.body);
    res.json({ success: true, pipeline });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Execute a pipeline
router.post('/execute/:id', async (req, res) => {
  try {
    const pipelineService: PipelineService = req.app.locals.pipelineService;
    const { id } = req.params;
    const { config } = req.body;
    
    const executionId = await pipelineService.executePipeline(id, config);
    res.json({ success: true, executionId });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get pipeline status
router.get('/status/:id', async (req, res) => {
  try {
    const pipelineService: PipelineService = req.app.locals.pipelineService;
    const { id } = req.params;
    
    const status = await pipelineService.getPipelineStatus(id);
    if (!status) {
      return res.status(404).json({ success: false, error: 'Pipeline not found' });
    }
    
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Stop a pipeline
router.post('/stop/:id', async (req, res) => {
  try {
    const pipelineService: PipelineService = req.app.locals.pipelineService;
    const { id } = req.params;
    
    await pipelineService.stopPipeline(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get pipeline executions with pagination and filtering
router.get('/executions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      projectId, 
      ownerId 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {};
    
    // Add filters
    if (status) {
      query.status = status;
    }
    if (projectId) {
      query.projectId = projectId;
    }
    if (ownerId) {
      query.ownerId = ownerId;
    }

    // Import the model
    const { PipelineExecution } = await import('../models/PipelineExecution');

    // Get executions with pagination
    const [executions, total] = await Promise.all([
      PipelineExecution.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PipelineExecution.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        executions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNextPage: Number(page) < totalPages,
          hasPreviousPage: Number(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline executions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pipeline executions'
    });
  }
});

export default router;