import { Server as SocketIOServer } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import { MLPipelineConfig, PipelineExecution, MLPipelineStage, PipelineEvent } from '../types';

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
    const configDir = path.join(process.cwd(), 'backend/src/ml-pipeline/configs');
    await fs.mkdir(configDir, { recursive: true });

    const yamlConfig = {
      pipeline: {
        id: pipelineId,
        name: config.name,
        description: config.description,
        stages: config.stages.map(stage => ({
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

    const yamlStr = yaml.dump(yamlConfig);
    await fs.writeFile(path.join(configDir, `${pipelineId}.yaml`), yamlStr);
  }

  private async runPipelineStages(pipelineId: string, config: MLPipelineConfig): Promise<void> {
    const execution = this.executions.get(pipelineId);
    if (!execution) return;

    for (let i = 0; i < config.stages.length; i++) {
      const stage = config.stages[i];
      execution.currentStage = stage.id;
      
      this.emitEvent(pipelineId, {
        type: 'stage-start',
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
          type: 'stage-complete',
          pipelineId,
          stageId: stage.id,
          data: { stage: stage.name, outputs: stage.outputs },
          timestamp: new Date()
        });

      } catch (error) {
        stage.status = 'error';
        execution.status = 'error';
        
        this.emitEvent(pipelineId, {
          type: 'stage-error',
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
      type: 'pipeline-complete',
      pipelineId,
      data: { results: execution.results },
      timestamp: new Date()
    });
  }

  private async executeStage(pipelineId: string, stage: MLPipelineStage): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'backend/src/ml-pipeline/stages', `${stage.id}.py`);
      const configFile = path.join(process.cwd(), 'backend/src/ml-pipeline/configs', `${pipelineId}.yaml`);

      const childProcess = spawn('python3', [pythonScript, configFile, stage.id], {
        cwd: path.join(process.cwd(), 'backend/src/ml-pipeline')
      });

      this.processes.set(`${pipelineId}-${stage.id}`, childProcess);

      stage.status = 'running';
      stage.startTime = new Date();
      stage.logs = [];

      childProcess.stdout.on('data', (data: Buffer) => {
        const log = data.toString();
        stage.logs.push(log);
        
        this.emitEvent(pipelineId, {
          type: 'log',
          pipelineId,
          stageId: stage.id,
          data: { level: 'info', message: log.trim() },
          timestamp: new Date()
        });
      });

      childProcess.stderr.on('data', (data: Buffer) => {
        const log = data.toString();
        stage.logs.push(log);
        
        this.emitEvent(pipelineId, {
          type: 'log',
          pipelineId,
          stageId: stage.id,
          data: { level: 'error', message: log.trim() },
          timestamp: new Date()
        });
      });

      childProcess.on('close', (code: number | null) => {
        this.processes.delete(`${pipelineId}-${stage.id}`);
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Stage ${stage.name} failed with exit code ${code}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        this.processes.delete(`${pipelineId}-${stage.id}`);
        reject(error);
      });
    });
  }

  private emitEvent(pipelineId: string, event: PipelineEvent): void {
    this.io.to(`pipeline-${pipelineId}`).emit('pipeline-event', event);
  }

  async getPipelineStatus(pipelineId: string): Promise<PipelineExecution | null> {
    return this.executions.get(pipelineId) || null;
  }

  async stopPipeline(pipelineId: string): Promise<void> {
    const execution = this.executions.get(pipelineId);
    if (execution) {
      execution.status = 'error';
      execution.endTime = new Date();
    }

    // Kill all processes for this pipeline
    for (const [processId, childProcess] of this.processes.entries()) {
      if (processId.startsWith(pipelineId)) {
        childProcess.kill();
        this.processes.delete(processId);
      }
    }

    this.executions.delete(pipelineId);
  }
}