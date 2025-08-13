export interface FileMap {
    [filename: string]: string;
}
export interface PipelineConfig {
    projectType: 'frontend' | 'backend' | 'fullstack';
    projectName: string;
    description: string;
    requirements: string;
    techStack: {
        frontend?: string[];
        backend?: string[];
        database?: string;
    };
    features: string[];
    designSystem?: {
        colorScheme: string;
        components: string[];
    };
    architecture?: {
        type: string;
        patterns: string[];
    };
}
export interface StageResults {
    [stageName: string]: string;
}
export interface PipelineContext {
    files: FileMap;
    currentFile: string;
    config: PipelineConfig;
    previousResults?: StageResults;
    stageIndex?: number;
    totalStages?: number;
    projectStructure?: string[];
    qaFeedback?: string;
}
export interface AICodeSuggestion {
    id: string;
    type: 'improvement' | 'bug-fix' | 'optimization' | 'feature';
    title: string;
    description: string;
    code: string;
    confidence: number;
    file: string;
    line?: number;
}
export interface CodeAnalysisResult {
    file: string;
    issues: CodeIssue[];
    suggestions: AICodeSuggestion[];
    metrics: {
        complexity: number;
        maintainability: number;
        testCoverage?: number;
    };
}
export interface CodeIssue {
    id: string;
    type: 'error' | 'warning' | 'info';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    file: string;
    line: number;
    column: number;
    rule?: string;
}
export interface AppState {
    theme: 'light' | 'dark';
    layout: {
        sidebarCollapsed: boolean;
        panelSizes: number[];
    };
    editor: {
        currentFile: string | null;
        openFiles: string[];
        wordWrap: boolean;
        fontSize: number;
    };
    pipeline: {
        currentPipeline: string | null;
        isRunning: boolean;
        logs: string[];
    };
}
export declare enum PipelineStage {
    REQUIREMENTS = "Business Analyst",
    ARCHITECTURE = "AI Architect",
    DESIGN = "AI UX/UI Designer",
    DEVELOPMENT = "AI Developer",
    QA = "AI QA Engineer",
    REFINEMENT = "AI Developer (Refinement)",
    DEPLOYMENT = "AI DevOps Engineer"
}
export declare enum PipelineStatus {
    IDLE = "idle",
    RUNNING = "running",
    COMPLETED = "completed",
    ERROR = "error"
}
//# sourceMappingURL=common.d.ts.map