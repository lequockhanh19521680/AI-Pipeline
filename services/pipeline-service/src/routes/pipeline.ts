import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PipelineService } from '../services/PipelineService.js';
import { MLPipelineConfig } from '../types/index.js';

const router = express.Router();

export default function createPipelineRoutes(pipelineService: PipelineService) {
  // POST /api/pipeline/create - Create a new pipeline
  router.post('/create', [
    body('name').notEmpty().withMessage('Pipeline name is required'),
    body('description').optional().isString()
  ], async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { name, description, dataPath, modelConfig, outputPath } = req.body;
      
      const config = {
        name,
        description,
        dataPath,
        modelConfig,
        outputPath
      };

      const pipeline = await pipelineService.createPipeline(config);
      
      res.json({
        success: true,
        data: pipeline
      });
    } catch (error) {
      console.error('Pipeline creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create pipeline'
      });
    }
  });

  // POST /api/pipeline/:id/execute - Execute a pipeline
  router.post('/:id/execute', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const config: MLPipelineConfig = req.body;

      if (!config || !config.stages) {
        return res.status(400).json({
          success: false,
          error: 'Pipeline configuration is required'
        });
      }

      const executionId = await pipelineService.executePipeline(id, config);
      
      res.json({
        success: true,
        data: { executionId }
      });
    } catch (error) {
      console.error('Pipeline execution error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute pipeline'
      });
    }
  });

  // GET /api/pipeline/:id/status - Get pipeline execution status
  router.get('/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const execution = await pipelineService.getPipelineStatus(id);
      
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Pipeline execution not found'
        });
      }

      res.json({
        success: true,
        data: execution
      });
    } catch (error) {
      console.error('Pipeline status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pipeline status'
      });
    }
  });

  // GET /api/pipeline/list - Get all pipeline executions
  router.get('/list', async (req: Request, res: Response) => {
    try {
      const executions = await pipelineService.getAllPipelines();
      
      res.json({
        success: true,
        data: executions
      });
    } catch (error) {
      console.error('Pipeline list error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list pipelines'
      });
    }
  });

  // POST /api/pipeline/:id/cancel - Cancel pipeline execution
  router.post('/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cancelled = await pipelineService.cancelPipeline(id);
      
      if (!cancelled) {
        return res.status(404).json({
          success: false,
          error: 'Pipeline execution not found'
        });
      }

      res.json({
        success: true,
        data: { cancelled: true }
      });
    } catch (error) {
      console.error('Pipeline cancellation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel pipeline'
      });
    }
  });

  return router;
}