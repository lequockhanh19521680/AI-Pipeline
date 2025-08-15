export interface PipelineNode {
    id: string;
    type: 'input' | 'processing' | 'ai' | 'output' | 'condition';
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        config: Record<string, any>;
        aiSuggestions?: string[];
    };
}
export interface Connection {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}
export interface Pipeline {
    id: string;
    name: string;
    description: string;
    nodes: PipelineNode[];
    edges: Connection[];
    category: 'code-gen' | 'data-processing' | 'deployment' | 'testing';
    template?: boolean;
    isPublic?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MLPipelineStage {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    startTime?: Date;
    endTime?: Date;
    logs: string[];
    outputs: any;
    artifacts: string[];
}
export interface MLPipelineConfig {
    id: string;
    name: string;
    description: string;
    stages: MLPipelineStage[];
    dataPath?: string;
    modelConfig?: any;
    outputPath?: string;
}
export interface PipelineExecution {
    id: string;
    config: MLPipelineConfig;
    status: 'idle' | 'running' | 'completed' | 'error';
    currentStage?: string;
    progress: number;
    startTime: Date;
    endTime?: Date;
    results: any;
}
export interface PipelineTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    nodes: PipelineNode[];
    edges: Connection[];
    isPublic: boolean;
    author: string;
    tags: string[];
    downloads: number;
    rating: number;
}
//# sourceMappingURL=pipeline.d.ts.map