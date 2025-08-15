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
  repositoryUrl?: string;
  githubRepo?: {
    owner: string;
    name: string;
    branch?: string;
  };
  collaborators?: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
    addedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  projectType: {
    type: String,
    required: true,
    enum: ['frontend', 'backend', 'fullstack'],
    index: true
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
    default: 'draft',
    index: true
  },
  pipelineConfig: {
    type: Schema.Types.Mixed
  },
  mlPipelineId: {
    type: String,
    sparse: true
  },
  repositoryUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Repository URL must be a valid HTTP(S) URL'
    }
  },
  githubRepo: {
    owner: { type: String, trim: true },
    name: { type: String, trim: true },
    branch: { type: String, trim: true, default: 'main' }
  },
  collaborators: [{
    userId: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['owner', 'editor', 'viewer'], 
      required: true 
    },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.files = ret.files || {};
      // Convert Map to plain object for JSON serialization
      if (ret.files instanceof Map) {
        const filesObj: { [key: string]: string } = {};
        ret.files.forEach((value: string, key: string) => {
          filesObj[key] = value;
        });
        ret.files = filesObj;
      }
      return ret;
    }
  }
});

// Indexes for better query performance
ProjectSchema.index({ ownerId: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, updatedAt: -1 });
ProjectSchema.index({ 'collaborators.userId': 1 });
ProjectSchema.index({ name: 'text', description: 'text' });

// Methods
ProjectSchema.methods.hasAccess = function(userId: string, requiredRole: 'viewer' | 'editor' | 'owner' = 'viewer') {
  // Owner always has access
  if (this.ownerId === userId) {
    return true;
  }
  
  // Check collaborators
  const collaborator = this.collaborators?.find((c: any) => c.userId === userId);
  if (!collaborator) {
    return false;
  }
  
  const roleHierarchy: Record<string, number> = { viewer: 1, editor: 2, owner: 3 };
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

ProjectSchema.methods.addCollaborator = function(userId: string, role: 'editor' | 'viewer') {
  this.collaborators = this.collaborators || [];
  
  // Remove existing collaborator if exists
  this.collaborators = this.collaborators.filter((c: any) => c.userId !== userId);
  
  // Add new collaborator
  this.collaborators.push({ userId, role, addedAt: new Date() });
};

ProjectSchema.methods.removeCollaborator = function(userId: string) {
  this.collaborators = this.collaborators?.filter((c: any) => c.userId !== userId) || [];
};

export const Project = mongoose.model<IProject>('Project', ProjectSchema);