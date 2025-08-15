import { Server as SocketIOServer } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as yaml from 'yaml';
import { MLPipelineConfig, PipelineExecution, MLPipelineStage, PipelineEvent, PipelineJob, JobResult } from '../types/index.js';

export class PipelineService {
  private executions: Map<string, PipelineExecution> = new Map();
  private processes: Map<string, ChildProcess> = new Map();

  constructor(private io: SocketIOServer) {}

  async createPipeline(config: Partial<MLPipelineConfig>): Promise<MLPipelineConfig> {
    const pipelineId = `pipeline_${Date.now()}`;
    
    const defaultStages: MLPipelineStage[] = [
      {
        id: 'data_ingestion',
        name: 'Data Ingestion',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'preprocessing',
        name: 'Data Preprocessing',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'model_training',
        name: 'Model Training',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'evaluation',
        name: 'Model Evaluation',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'deployment',
        name: 'Model Deployment',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      }
    ];

    const pipeline: MLPipelineConfig = {
      id: pipelineId,
      name: config.name || 'AI Pipeline',
      description: config.description || 'AI/ML Pipeline execution',
      stages: defaultStages,
      dataPath: config.dataPath,
      modelConfig: config.modelConfig,
      outputPath: config.outputPath || `./outputs/${pipelineId}`
    };

    return pipeline;
  }

  async executePipeline(pipelineId: string, config: MLPipelineConfig): Promise<string> {
    if (this.executions.has(pipelineId)) {
      throw new Error('Pipeline already running');
    }

    const execution: PipelineExecution = {
      id: pipelineId,
      config,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      results: {}
    };

    this.executions.set(pipelineId, execution);

    // Create pipeline configuration file
    await this.createPipelineConfig(pipelineId, config);

    // Start pipeline execution
    this.runPipelineStages(pipelineId, config);

    return pipelineId;
  }

  private async createPipelineConfig(pipelineId: string, config: MLPipelineConfig): Promise<void> {
    const configDir = path.join(process.cwd(), 'configs');
    await fs.mkdir(configDir, { recursive: true });

    const yamlConfig = {
      pipeline: {
        id: pipelineId,
        name: config.name,
        description: config.description,
        stages: config.stages.map((stage: MLPipelineStage) => ({
          id: stage.id,
          name: stage.name,
          script: `${stage.id}.py`,
          config: stage.outputs
        }))
      },
      data: {
        input_path: config.dataPath || './data/sample_data.csv',
        output_path: config.outputPath
      },
      model: config.modelConfig || {
        type: 'classification',
        algorithm: 'random_forest',
        parameters: {
          n_estimators: 100,
          max_depth: 10
        }
      }
    };

    const yamlStr = yaml.stringify(yamlConfig);
    await fs.writeFile(path.join(configDir, `${pipelineId}.yaml`), yamlStr);
  }

  private async runPipelineStages(pipelineId: string, config: MLPipelineConfig): Promise<void> {
    const execution = this.executions.get(pipelineId);
    if (!execution) return;

    for (let i = 0; i < config.stages.length; i++) {
      const stage = config.stages[i];
      execution.currentStage = stage.id;
      
      this.emitEvent(pipelineId, {
        type: 'stage_start',
        pipelineId,
        stageId: stage.id,
        data: { stage: stage.name },
        timestamp: new Date()
      });

      try {
        await this.executeStage(pipelineId, stage);
        
        stage.status = 'completed';
        stage.endTime = new Date();
        execution.progress = ((i + 1) / config.stages.length) * 100;

        this.emitEvent(pipelineId, {
          type: 'stage_complete',
          pipelineId,
          stageId: stage.id,
          data: { stage: stage.name, outputs: stage.outputs },
          timestamp: new Date()
        });

      } catch (error) {
        stage.status = 'error';
        execution.status = 'error';
        
        this.emitEvent(pipelineId, {
          type: 'stage_failed',
          pipelineId,
          stageId: stage.id,
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date()
        });
        
        return;
      }
    }

    execution.status = 'completed';
    execution.endTime = new Date();
    
    this.emitEvent(pipelineId, {
      type: 'pipeline_completed',
      pipelineId,
      data: { results: execution.results },
      timestamp: new Date()
    });
  }

  private async executeStage(pipelineId: string, stage: MLPipelineStage): Promise<void> {
    stage.status = 'running';
    stage.startTime = new Date();
    stage.logs = [];

    this.emitEvent(pipelineId, {
      type: 'log',
      pipelineId,
      stageId: stage.id,
      data: { level: 'info', message: `Starting stage ${stage.name}` },
      timestamp: new Date()
    });

    try {
      // Simulate stage execution for now
      await this.simulateStageExecution(pipelineId, stage);
      
      // Stage completed successfully
      stage.outputs = { status: 'completed', timestamp: new Date() };
      
      this.emitEvent(pipelineId, {
        type: 'log',
        pipelineId,
        stageId: stage.id,
        data: { level: 'info', message: `Stage ${stage.name} completed successfully` },
        timestamp: new Date()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      
      stage.logs.push(`ERROR: ${errorMessage}`);
      
      this.emitEvent(pipelineId, {
        type: 'log',
        pipelineId,
        stageId: stage.id,
        data: { level: 'error', message: errorMessage },
        timestamp: new Date()
      });

      throw error;
    }
  }

  private async simulateStageExecution(pipelineId: string, stage: MLPipelineStage): Promise<void> {
    // Simulate processing time
    const duration = 2000 + Math.random() * 3000;
    
    return new Promise((resolve, reject) => {
      const steps = ['Initializing...', 'Processing...', 'Finalizing...'];
      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          const logMessage = `${stage.name}: ${steps[currentStep]}`;
          stage.logs.push(logMessage);
          
          this.emitEvent(pipelineId, {
            type: 'log',
            pipelineId,
            stageId: stage.id,
            data: { level: 'info', message: logMessage },
            timestamp: new Date()
          });
          
          currentStep++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, duration / steps.length);
    });
  }

  private emitEvent(pipelineId: string, event: PipelineEvent): void {
    this.io.to(`pipeline-${pipelineId}`).emit('pipeline-event', event);
  }

  async getPipelineStatus(pipelineId: string): Promise<PipelineExecution | null> {
    return this.executions.get(pipelineId) || null;
  }

  async getAllPipelines(): Promise<PipelineExecution[]> {
    return Array.from(this.executions.values());
  }

  async cancelPipeline(pipelineId: string): Promise<boolean> {
    const execution = this.executions.get(pipelineId);
    if (!execution) return false;

    const process = this.processes.get(pipelineId);
    if (process) {
      process.kill();
      this.processes.delete(pipelineId);
    }

    execution.status = 'error';
    execution.endTime = new Date();
    
    this.emitEvent(pipelineId, {
      type: 'log',
      pipelineId,
      data: { level: 'info', message: 'Pipeline cancelled by user' },
      timestamp: new Date()
    });

    return true;
  }
}