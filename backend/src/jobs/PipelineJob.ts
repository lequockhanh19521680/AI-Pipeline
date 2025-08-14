import { Job, Queue, Worker } from 'bullmq';
import { spawn } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import { MLPipelineStage } from '../../../shared/types/pipeline.js';

export interface PipelineJobData {
  pipelineId: string;
  stageId: string;
  stageName: string;
  scriptPath: string;
  configFile: string;
  args: string[];
}

export interface PipelineJobResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  artifacts?: string[];
  outputs?: any;
  error?: string;
}

export class PipelineJobProcessor {
  private queue: Queue;
  private worker: Worker;

  constructor(redisOptions: any = {}) {
    this.queue = new Queue('pipeline-jobs', {
      connection: redisOptions
    });

    this.worker = new Worker('pipeline-jobs', this.processJob.bind(this), {
      connection: redisOptions,
      concurrency: 1 // Process one job at a time for now
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job: Job, result: PipelineJobResult) => {
      console.log(`✅ Job ${job.id} completed successfully for pipeline ${job.data.pipelineId} stage ${job.data.stageId}`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`❌ Job ${job?.id} failed for pipeline ${job?.data.pipelineId} stage ${job?.data.stageId}:`, err.message);
    });

    this.worker.on('progress', (job: Job, progress: number) => {
      console.log(`🔄 Job ${job.id} progress: ${progress}%`);
    });
  }

  async addPipelineJob(jobData: PipelineJobData, priority: number = 0): Promise<Job> {
    return await this.queue.add('execute-stage', jobData, {
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });
  }

  private async processJob(job: Job<PipelineJobData>): Promise<PipelineJobResult> {
    const { pipelineId, stageId, stageName, scriptPath, configFile, args } = job.data;
    
    console.log(`🚀 Starting pipeline job: ${pipelineId} - ${stageName}`);
    
    return new Promise((resolve) => {
      const workingDir = path.join(process.cwd(), 'backend/src/ml-pipeline');
      const fullScriptPath = path.join(workingDir, 'stages', scriptPath);
      
      // Update job progress
      job.updateProgress(10);

      const childProcess = spawn('python3', [fullScriptPath, configFile, stageId], {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        console.log(`[${stageId}] ${output.trim()}`);
        
        // Update progress based on output patterns
        if (output.includes('Processing...')) {
          job.updateProgress(30);
        } else if (output.includes('Training...')) {
          job.updateProgress(60);
        } else if (output.includes('Completed')) {
          job.updateProgress(90);
        }
      });

      childProcess.stderr.on('data', (data: Buffer) => {
        const errorOutput = data.toString();
        stderr += errorOutput;
        console.error(`[${stageId}] ERROR: ${errorOutput.trim()}`);
      });

      childProcess.on('close', async (code: number | null) => {
        job.updateProgress(100);
        
        const result: PipelineJobResult = {
          success: code === 0,
          exitCode: code || -1,
          stdout,
          stderr
        };

        if (code === 0) {
          // Try to parse outputs and artifacts from stdout
          try {
            result.outputs = this.parseOutputs(stdout);
            result.artifacts = await this.collectArtifacts(pipelineId, stageId);
          } catch (error) {
            console.warn(`Warning: Could not parse outputs for ${stageId}:`, error);
          }
        } else {
          result.error = `Stage failed with exit code ${code}`;
        }

        resolve(result);
      });

      childProcess.on('error', (error: Error) => {
        resolve({
          success: false,
          exitCode: -1,
          stdout,
          stderr,
          error: error.message
        });
      });
    });
  }

  private parseOutputs(stdout: string): any {
    // Try to find JSON output in stdout
    const jsonMatches = stdout.match(/\{[^}]*"status"[^}]*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      try {
        return JSON.parse(jsonMatches[jsonMatches.length - 1]);
      } catch (error) {
        console.warn('Could not parse JSON output:', error);
      }
    }
    return {};
  }

  private async collectArtifacts(pipelineId: string, stageId: string): Promise<string[]> {
    const artifactsDir = path.join(process.cwd(), 'backend/src/ml-pipeline/outputs', pipelineId, stageId);
    
    try {
      const files = await fs.readdir(artifactsDir);
      return files.map(file => path.join(artifactsDir, file));
    } catch (error) {
      // Directory doesn't exist or is empty
      return [];
    }
  }

  async getQueueInfo() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}