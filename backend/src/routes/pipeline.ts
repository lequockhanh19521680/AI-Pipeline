import express from 'express';
import { body, validationResult } from 'express-validator';
import { PipelineService } from '../services/PipelineService';
import { DynamicPipelineService } from '../services/DynamicPipelineService';
import { Pipeline } from '../../../shared/types/pipeline.js';

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

// Dynamic Pipeline Routes for ReactFlow-based pipelines

// Validation rules for dynamic pipeline execution
const dynamicPipelineValidation = [
  body('pipeline.id').isString().notEmpty().withMessage('Pipeline ID is required'),
  body('pipeline.name').isString().notEmpty().withMessage('Pipeline name is required'),
  body('pipeline.nodes').isArray().withMessage('Pipeline nodes must be an array'),
  body('pipeline.edges').isArray().withMessage('Pipeline edges must be an array'),
  body('pipeline.nodes.*.id').isString().notEmpty().withMessage('Each node must have an ID'),
  body('pipeline.nodes.*.type').isIn(['input', 'processing', 'ai', 'output', 'condition']).withMessage('Invalid node type'),
  body('pipeline.nodes.*.data.label').isString().notEmpty().withMessage('Each node must have a label'),
  body('pipeline.edges.*.source').isString().notEmpty().withMessage('Each edge must have a source'),
  body('pipeline.edges.*.target').isString().notEmpty().withMessage('Each edge must have a target')
];

// POST /api/pipeline/execute/dynamic - Execute ReactFlow pipeline
router.post('/execute/dynamic', 
  dynamicPipelineValidation,
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { pipeline }: { pipeline: Pipeline } = req.body;
      const pipelineService: DynamicPipelineService = req.app.locals.dynamicPipelineService;

      if (!pipelineService) {
        return res.status(500).json({
          success: false,
          error: 'Dynamic pipeline service not available'
        });
      }

      // Validate pipeline structure
      if (!pipeline.nodes || pipeline.nodes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Pipeline must contain at least one node'
        });
      }

      // Execute the dynamic pipeline
      const executionId = await pipelineService.executeDynamicPipeline(pipeline);

      res.json({
        success: true,
        data: {
          executionId,
          pipeline: {
            id: pipeline.id,
            name: pipeline.name,
            nodeCount: pipeline.nodes.length,
            edgeCount: pipeline.edges.length
          }
        }
      });
    } catch (error) {
      console.error('Error executing dynamic pipeline:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute dynamic pipeline'
      });
    }
  }
);

// POST /api/pipeline/validate - Validate pipeline structure
router.post('/validate',
  dynamicPipelineValidation,
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { pipeline }: { pipeline: Pipeline } = req.body;
      
      // Validate pipeline structure
      const validation = validatePipelineStructure(pipeline);
      
      res.json({
        success: true,
        data: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          nodeCount: pipeline.nodes.length,
          edgeCount: pipeline.edges.length,
          executionOrder: validation.executionOrder
        }
      });
    } catch (error) {
      console.error('Error validating pipeline:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate pipeline'
      });
    }
  }
);

// GET /api/pipeline/templates - Get pipeline templates
router.get('/templates', async (req, res) => {
  try {
    const templates = getPipelineTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching pipeline templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pipeline templates'
    });
  }
});

// Helper function to validate pipeline structure
function validatePipelineStructure(pipeline: Pipeline) {
  const errors: string[] = [];
  const warnings: string[] = [];
  let executionOrder: string[] = [];

  try {
    // Check for circular dependencies
    const nodeIds = pipeline.nodes.map(n => n.id);
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodeIds.forEach(id => {
      graph.set(id, []);
      inDegree.set(id, 0);
    });

    // Build graph
    pipeline.edges.forEach(edge => {
      const sourceExists = nodeIds.includes(edge.source);
      const targetExists = nodeIds.includes(edge.target);
      
      if (!sourceExists) {
        errors.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!targetExists) {
        errors.push(`Edge references non-existent target node: ${edge.target}`);
      }
      
      if (sourceExists && targetExists) {
        graph.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });

    // Topological sort to check for cycles
    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      result.push(currentNode);

      const neighbors = graph.get(currentNode) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (result.length !== pipeline.nodes.length) {
      errors.push('Pipeline contains circular dependencies');
    } else {
      executionOrder = result;
    }

    // Check for isolated nodes
    pipeline.nodes.forEach(node => {
      const hasIncomingEdges = pipeline.edges.some(edge => edge.target === node.id);
      const hasOutgoingEdges = pipeline.edges.some(edge => edge.source === node.id);
      
      if (!hasIncomingEdges && !hasOutgoingEdges && pipeline.nodes.length > 1) {
        warnings.push(`Node "${node.data.label}" (${node.id}) is isolated`);
      }
    });

    // Check for missing required node configurations
    pipeline.nodes.forEach(node => {
      if (!node.data.config) {
        warnings.push(`Node "${node.data.label}" (${node.id}) has no configuration`);
      }
    });

  } catch (error) {
    errors.push(`Validation error: ${(error as Error).message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    executionOrder
  };
}

// Helper function to get pipeline templates
function getPipelineTemplates() {
  return [
    {
      id: 'data-processing',
      name: 'Data Processing Pipeline',
      description: 'Basic data ingestion, transformation, and output pipeline',
      category: 'data-processing',
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Data Input',
            config: { sourceType: 'file', filePath: 'data/input.csv' }
          }
        },
        {
          id: 'process-1',
          type: 'processing',
          position: { x: 300, y: 100 },
          data: {
            label: 'Data Transformation',
            config: { processingType: 'transform', transformations: [] }
          }
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 500, y: 100 },
          data: {
            label: 'Save Results',
            config: { outputType: 'file', filePath: 'output/processed.json', format: 'json' }
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'input-1', target: 'process-1' },
        { id: 'e2-3', source: 'process-1', target: 'output-1' }
      ]
    },
    {
      id: 'ai-analysis',
      name: 'AI Analysis Pipeline',
      description: 'AI-powered data analysis and insights generation',
      category: 'ai',
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Data Input',
            config: { sourceType: 'api', apiEndpoint: 'https://api.example.com/data' }
          }
        },
        {
          id: 'ai-1',
          type: 'ai',
          position: { x: 300, y: 100 },
          data: {
            label: 'AI Analysis',
            config: { aiType: 'analysis', analysisType: 'sentiment' }
          }
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 500, y: 100 },
          data: {
            label: 'Display Results',
            config: { outputType: 'display' }
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'input-1', target: 'ai-1' },
        { id: 'e2-3', source: 'ai-1', target: 'output-1' }
      ]
    },
    {
      id: 'conditional-workflow',
      name: 'Conditional Workflow',
      description: 'Pipeline with conditional branching based on data conditions',
      category: 'workflow',
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Data Input',
            config: { sourceType: 'file', filePath: 'data/input.json' }
          }
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 300, y: 100 },
          data: {
            label: 'Check Data Quality',
            config: { condition: { field: 'quality_score', operator: 'gt', value: 0.8 } }
          }
        },
        {
          id: 'process-1',
          type: 'processing',
          position: { x: 500, y: 50 },
          data: {
            label: 'High Quality Processing',
            config: { processingType: 'transform' }
          }
        },
        {
          id: 'process-2',
          type: 'processing',
          position: { x: 500, y: 150 },
          data: {
            label: 'Data Cleaning',
            config: { processingType: 'filter' }
          }
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 700, y: 100 },
          data: {
            label: 'Save Results',
            config: { outputType: 'file', filePath: 'output/results.json', format: 'json' }
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'input-1', target: 'condition-1' },
        { id: 'e2-3a', source: 'condition-1', target: 'process-1', sourceHandle: 'true' },
        { id: 'e2-3b', source: 'condition-1', target: 'process-2', sourceHandle: 'false' },
        { id: 'e3a-4', source: 'process-1', target: 'output-1' },
        { id: 'e3b-4', source: 'process-2', target: 'output-1' }
      ]
    }
  ];
}

export default router;