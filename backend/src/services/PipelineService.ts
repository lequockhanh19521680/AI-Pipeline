import { Server as SocketIOServer } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as yaml from 'js-yaml';
import { MLPipelineConfig, PipelineExecution, MLPipelineStage } from '../../../shared/types/pipeline.js';
import { PipelineEvent } from '../../../shared/interfaces/api.js';
import { PipelineJobProcessor, PipelineJobData, PipelineJobResult } from '../jobs/PipelineJob.js';

export class PipelineService {
  private executions: Map<string, PipelineExecution> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private jobProcessor: PipelineJobProcessor;

  constructor(private io: SocketIOServer) {
    // Initialize job processor with Redis connection
    this.jobProcessor = new PipelineJobProcessor({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0')
    });
  }

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
        type: 'stage_started',
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
          type: 'stage_completed',
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
    const configFile = path.join(process.cwd(), 'backend/src/ml-pipeline/configs', `${pipelineId}.yaml`);
    const scriptPath = `${stage.id}.py`;

    // Create job data for the queue
    const jobData: PipelineJobData = {
      pipelineId,
      stageId: stage.id,
      stageName: stage.name,
      scriptPath,
      configFile,
      args: [configFile, stage.id]
    };

    stage.status = 'running';
    stage.startTime = new Date();
    stage.logs = [];

    this.emitEvent(pipelineId, {
      type: 'log',
      pipelineId,
      stageId: stage.id,
      data: { level: 'info', message: `Starting stage ${stage.name} via job queue` },
      timestamp: new Date()
    });

    try {
      // Add job to queue and wait for completion
      const job = await this.jobProcessor.addPipelineJob(jobData);
      
      // Wait for job completion (simplified approach)
      const result = await new Promise<PipelineJobResult>((resolve, reject) => {
        const checkJobStatus = async () => {
          try {
            const jobState = await job.getState();
            if (jobState === 'completed') {
              const jobResult = job.returnvalue as PipelineJobResult;
              resolve(jobResult);
            } else if (jobState === 'failed') {
              reject(new Error(job.failedReason || 'Job failed'));
            } else {
              // Job still processing, check again in 1 second
              setTimeout(checkJobStatus, 1000);
            }
          } catch (error) {
            reject(error);
          }
        };
        checkJobStatus();
      });
      
      if (result && typeof result === 'object' && 'success' in result) {
        
        // Add all logs from stdout and stderr
        if (result.stdout) {
          const stdoutLines = result.stdout.split('\n').filter(line => line.trim());
          stage.logs.push(...stdoutLines);
          
          stdoutLines.forEach(line => {
            this.emitEvent(pipelineId, {
              type: 'log',
              pipelineId,
              stageId: stage.id,
              data: { level: 'info', message: line.trim() },
              timestamp: new Date()
            });
          });
        }

        if (result.stderr) {
          const stderrLines = result.stderr.split('\n').filter(line => line.trim());
          stage.logs.push(...stderrLines);
          
          stderrLines.forEach(line => {
            this.emitEvent(pipelineId, {
              type: 'log',
              pipelineId,
              stageId: stage.id,
              data: { level: 'error', message: line.trim() },
              timestamp: new Date()
            });
          });
        }

        // Update stage with results
        stage.outputs = result.outputs || {};
        stage.artifacts = result.artifacts || [];

        if (!result.success) {
          throw new Error(result.error || `Stage failed with exit code ${result.exitCode}`);
        }

        this.emitEvent(pipelineId, {
          type: 'log',
          pipelineId,
          stageId: stage.id,
          data: { level: 'info', message: `Stage ${stage.name} completed successfully` },
          timestamp: new Date()
        });

      } else {
        throw new Error('Job failed to return valid result');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown job execution error';
      
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

  private emitEvent(pipelineId: string, event: PipelineEvent): void {
    this.io.to(`pipeline-${pipelineId}`).emit('pipeline-event', event);
  }

  async getPipelineStatus(pipelineId: string): Promise<PipelineExecution | null> {
    return this.executions.get(pipelineId) || null;
  }

  async getQueueStatus(): Promise<any> {
    return await this.jobProcessor.getQueueInfo();
  }

  async stopPipeline(pipelineId: string): Promise<void> {
    const execution = this.executions.get(pipelineId);
    if (execution) {
      execution.status = 'error';
      execution.endTime = new Date();
    }

    // Kill all processes for this pipeline
    const processEntries = Array.from(this.processes.entries());
    for (const [processId, childProcess] of processEntries) {
      if (processId.startsWith(pipelineId)) {
        childProcess.kill();
        this.processes.delete(processId);
      }
    }

    this.executions.delete(pipelineId);
  }
}