import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  projectType: 'frontend' | 'backend' | 'fullstack';
  files: { [filename: string]: string };
  ownerId: string;
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string;
  };
  status: 'draft' | 'active' | 'completed' | 'archived';
  pipelineConfig?: any;
  mlPipelineId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  projectType: {
    type: String,
    required: true,
    enum: ['frontend', 'backend', 'fullstack']
  },
  files: {
    type: Map,
    of: String,
    default: new Map()
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  techStack: {
    frontend: [String],
    backend: [String],
    database: String
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  pipelineConfig: {
    type: Schema.Types.Mixed
  },
  mlPipelineId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.files = ret.files || {};
      return ret;
    }
  }
});

// Indexes for better query performance
ProjectSchema.index({ ownerId: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, updatedAt: -1 });
ProjectSchema.index({ projectType: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);