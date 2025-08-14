import mongoose, { Schema, Document } from 'mongoose';

export interface IPipelineExecution extends Document {
  pipelineId: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  stages: {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    logs: string[];
    outputs: any;
    artifacts: string[];
  }[];
  totalStages: number;
  completedStages: number;
  projectId?: string;
  ownerId: string;
  error?: string;
  metrics: {
    successRate: number;
    averageDuration: number;
    performanceScore: number;
  };
}

const StageSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['idle', 'running', 'completed', 'error'],
    default: 'idle'
  },
  startTime: Date,
  endTime: Date,
  duration: Number,
  logs: [String],
  outputs: Schema.Types.Mixed,
  artifacts: [String]
});

const PipelineExecutionSchema: Schema = new Schema({
  pipelineId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled'],
    default: 'running',
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: Date,
  duration: Number,
  stages: [StageSchema],
  totalStages: {
    type: Number,
    default: 0
  },
  completedStages: {
    type: Number,
    default: 0
  },
  projectId: {
    type: String,
    index: true
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  error: String,
  metrics: {
    successRate: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate duration
PipelineExecutionSchema.pre('save', function(this: IPipelineExecution, next) {
  if (this.endTime && this.startTime) {
    this.duration = (this.endTime as Date).getTime() - (this.startTime as Date).getTime();
  }
  
  // Calculate completed stages
  this.completedStages = (this.stages as any[]).filter((stage: any) => 
    stage.status === 'completed'
  ).length;
  
  // Calculate metrics
  if ((this.totalStages as number) > 0) {
    (this.metrics as any).successRate = ((this.completedStages as number) / (this.totalStages as number)) * 100;
  }
  
  next();
});

// Indexes for performance
PipelineExecutionSchema.index({ ownerId: 1, startTime: -1 });
PipelineExecutionSchema.index({ status: 1, startTime: -1 });
PipelineExecutionSchema.index({ projectId: 1, startTime: -1 });

export const PipelineExecution = mongoose.model<IPipelineExecution>('PipelineExecution', PipelineExecutionSchema);