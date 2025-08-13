import express from 'express';
import { PipelineService } from '../services/PipelineService';

const router = express.Router();

// Create a new pipeline
router.post('/create', async (req, res) => {
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

export default router;