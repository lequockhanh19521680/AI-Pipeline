import { z } from 'zod';

// Code Review Response Schema
export const CodeReviewIssueSchema = z.object({
  line: z.number(),
  type: z.enum(['error', 'warning', 'suggestion', 'security']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  rule: z.string(),
  fixSuggestion: z.string()
});

export const CodeReviewMetricsSchema = z.object({
  complexity: z.number().min(1).max(10),
  maintainability: z.number().min(1).max(10),
  technicalDebt: z.number().min(1).max(10),
  codeSmells: z.number().min(0),
  duplications: z.number().min(0)
});

export const CodeReviewSuggestionSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  before: z.string(),
  after: z.string(),
  impact: z.string()
});

export const CodeReviewResponseSchema = z.object({
  issues: z.array(CodeReviewIssueSchema),
  metrics: CodeReviewMetricsSchema,
  suggestions: z.array(CodeReviewSuggestionSchema)
});

// Debug Response Schema
export const DebugDiagnosisSchema = z.object({
  rootCause: z.string(),
  problemArea: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical'])
});

export const DebugSolutionSchema = z.object({
  fixedCode: z.string(),
  explanation: z.string(),
  steps: z.array(z.string())
});

export const DebugPreventionSchema = z.object({
  bestPractices: z.array(z.string()),
  testCases: z.array(z.string()),
  monitoring: z.array(z.string())
});

export const DebugResponseSchema = z.object({
  diagnosis: DebugDiagnosisSchema,
  solution: DebugSolutionSchema,
  prevention: DebugPreventionSchema,
  additionalIssues: z.array(z.string())
});

// QA Analysis Response Schema
export const QACodeQualitySchema = z.object({
  overallScore: z.number().min(0).max(10),
  maintainability: z.number().min(0).max(10),
  readability: z.number().min(0).max(10),
  testability: z.number().min(0).max(10)
});

export const QAIssueSchema = z.object({
  file: z.string(),
  line: z.number(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  suggestion: z.string()
});

export const QASecurityAnalysisSchema = z.object({
  vulnerabilities: z.array(z.string()),
  recommendations: z.array(z.string()),
  score: z.number().min(0).max(10)
});

export const QAPerformanceSchema = z.object({
  issues: z.array(z.string()),
  optimizations: z.array(z.string()),
  score: z.number().min(0).max(10)
});

export const QATestRecommendationsSchema = z.object({
  unitTests: z.array(z.string()),
  integrationTests: z.array(z.string()),
  coverage: z.array(z.string())
});

export const QAResponseSchema = z.object({
  codeQuality: QACodeQualitySchema,
  issues: z.array(QAIssueSchema),
  securityAnalysis: QASecurityAnalysisSchema,
  performance: QAPerformanceSchema,
  testRecommendations: QATestRecommendationsSchema,
  overallAssessment: z.string()
});

// Data Analysis Response Schema
export const DataQualitySchema = z.object({
  assessment: z.string(),
  score: z.number().min(0).max(10),
  issues: z.array(z.string())
});

export const PreprocessingSchema = z.object({
  recommendations: z.array(z.string()),
  requiredSteps: z.array(z.string()),
  potentialChallenges: z.array(z.string())
});

export const DataAnalysisResponseSchema = z.object({
  dataQuality: DataQualitySchema,
  preprocessing: PreprocessingSchema,
  concerns: z.array(z.string()),
  improvements: z.array(z.string()),
  nextSteps: z.array(z.string())
});

// Schema type exports
export type CodeReviewResponse = z.infer<typeof CodeReviewResponseSchema>;
export type DebugResponse = z.infer<typeof DebugResponseSchema>;
export type QAResponse = z.infer<typeof QAResponseSchema>;
export type DataAnalysisResponse = z.infer<typeof DataAnalysisResponseSchema>;

// Schema registry for dynamic validation
export const SchemaRegistry = {
  codeReview: CodeReviewResponseSchema,
  debug: DebugResponseSchema,
  qa: QAResponseSchema,
  dataAnalysis: DataAnalysisResponseSchema
} as const;

export type SchemaType = keyof typeof SchemaRegistry;