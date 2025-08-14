import { Server as SocketIOServer } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as yaml from 'js-yaml';
import { 
  Pipeline, 
  PipelineNode, 
  Connection, 
  MLPipelineConfig, 
  PipelineExecution, 
  MLPipelineStage 
} from '../../../shared/types/pipeline.js';
import { PipelineEvent } from '../../../shared/interfaces/api.js';
import { PipelineJobProcessor, PipelineJobData, PipelineJobResult } from '../jobs/PipelineJob.js';

interface NodeExecutionContext {
  nodeId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  dependencies: string[];
}

export class DynamicPipelineService {
  private executions: Map<string, PipelineExecution> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private nodeExecutions: Map<string, NodeExecutionContext> = new Map();
  private jobProcessor: PipelineJobProcessor;

  constructor(private io: SocketIOServer) {
    // Initialize job processor with Redis connection
    this.jobProcessor = new PipelineJobProcessor({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0')
    });
  }

  /**
   * Execute a ReactFlow pipeline with dynamic graph-based processing
   */
  async executeDynamicPipeline(pipeline: Pipeline): Promise<string> {
    const executionId = `execution_${Date.now()}`;
    
    if (this.executions.has(executionId)) {
      throw new Error('Pipeline execution already running');
    }

    // Perform topological sort to determine execution order
    const executionOrder = this.topologicalSort(pipeline.nodes, pipeline.edges);
    
    // Initialize execution context
    const execution: PipelineExecution = {
      id: executionId,
      config: this.convertToMLConfig(pipeline),
      status: 'running',
      progress: 0,
      startTime: new Date(),
      results: {}
    };

    this.executions.set(executionId, execution);
    this.emitEvent(executionId, {
      type: 'pipeline-start',
      data: { executionId, nodeCount: pipeline.nodes.length }
    });

    // Execute nodes in topological order
    this.executePipelineNodes(executionId, pipeline, executionOrder);

    return executionId;
  }

  /**
   * Perform topological sorting to determine correct execution order
   */
  private topologicalSort(nodes: PipelineNode[], edges: Connection[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph and in-degree count
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach(edge => {
      const sourceId = edge.source;
      const targetId = edge.target;
      
      graph.get(sourceId)?.push(targetId);
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    });

    // Kahn's algorithm for topological sorting
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no incoming edges
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      result.push(currentNode);

      // Process all neighbors
      const neighbors = graph.get(currentNode) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Pipeline contains circular dependencies');
    }

    return result;
  }

  /**
   * Execute pipeline nodes in the determined order
   */
  private async executePipelineNodes(
    executionId: string, 
    pipeline: Pipeline, 
    executionOrder: string[]
  ): Promise<void> {
    try {
      const execution = this.executions.get(executionId)!;
      const totalNodes = executionOrder.length;

      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        const node = pipeline.nodes.find(n => n.id === nodeId);
        
        if (!node) {
          throw new Error(`Node ${nodeId} not found in pipeline`);
        }

        // Update progress
        execution.progress = Math.round((i / totalNodes) * 100);
        this.emitEvent(executionId, {
          type: 'node-start',
          data: { nodeId, nodeName: node.data.label, progress: execution.progress }
        });

        // Execute the node based on its type
        await this.executeNode(executionId, node, pipeline.edges);

        this.emitEvent(executionId, {
          type: 'node-complete',
          data: { nodeId, nodeName: node.data.label, progress: execution.progress }
        });
      }

      // Pipeline completed successfully
      execution.status = 'completed';
      execution.progress = 100;
      execution.endTime = new Date();
      
      this.emitEvent(executionId, {
        type: 'pipeline-complete',
        data: { executionId, duration: execution.endTime.getTime() - execution.startTime.getTime() }
      });

    } catch (error) {
      const execution = this.executions.get(executionId)!;
      execution.status = 'error';
      execution.endTime = new Date();
      
      this.emitEvent(executionId, {
        type: 'pipeline-error',
        data: { executionId, error: (error as Error).message }
      });
    }
  }

  /**
   * Execute a single node based on its type
   */
  private async executeNode(
    executionId: string, 
    node: PipelineNode, 
    edges: Connection[]
  ): Promise<void> {
    // Get input data from connected nodes
    const inputs = this.getNodeInputs(node.id, edges);
    
    switch (node.type) {
      case 'input':
        await this.executeInputNode(executionId, node, inputs);
        break;
      case 'processing':
        await this.executeProcessingNode(executionId, node, inputs);
        break;
      case 'ai':
        await this.executeAINode(executionId, node, inputs);
        break;
      case 'output':
        await this.executeOutputNode(executionId, node, inputs);
        break;
      case 'condition':
        await this.executeConditionNode(executionId, node, inputs);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute input node - load data from various sources
   */
  private async executeInputNode(
    executionId: string, 
    node: PipelineNode, 
    inputs: Record<string, any>
  ): Promise<void> {
    const config = node.data.config;
    const outputs: Record<string, any> = {};

    switch (config.sourceType) {
      case 'file':
        // Load data from file
        outputs.data = await this.loadFileData(config.filePath);
        break;
      case 'api':
        // Fetch data from API
        outputs.data = await this.fetchAPIData(config.apiEndpoint, config.headers);
        break;
      case 'database':
        // Query database
        outputs.data = await this.queryDatabase(config.connectionString, config.query);
        break;
      default:
        outputs.data = config.staticData || {};
    }

    this.setNodeOutputs(node.id, outputs);
  }

  /**
   * Execute processing node - transform data
   */
  private async executeProcessingNode(
    executionId: string, 
    node: PipelineNode, 
    inputs: Record<string, any>
  ): Promise<void> {
    const config = node.data.config;
    const outputs: Record<string, any> = {};

    switch (config.processingType) {
      case 'transform':
        outputs.data = await this.transformData(inputs.data, config.transformations);
        break;
      case 'filter':
        outputs.data = await this.filterData(inputs.data, config.filters);
        break;
      case 'aggregate':
        outputs.data = await this.aggregateData(inputs.data, config.aggregations);
        break;
      case 'script':
        outputs.data = await this.executeScript(config.script, inputs);
        break;
      default:
        outputs.data = inputs.data;
    }

    this.setNodeOutputs(node.id, outputs);
  }

  /**
   * Execute AI node - run AI/ML operations
   */
  private async executeAINode(
    executionId: string, 
    node: PipelineNode, 
    inputs: Record<string, any>
  ): Promise<void> {
    const config = node.data.config;
    const outputs: Record<string, any> = {};

    switch (config.aiType) {
      case 'llm':
        outputs.result = await this.callLLM(config.model, config.prompt, inputs.data);
        break;
      case 'classification':
        outputs.predictions = await this.runClassification(config.modelPath, inputs.data);
        break;
      case 'generation':
        outputs.generated = await this.runGeneration(config.generatorConfig, inputs.data);
        break;
      case 'analysis':
        outputs.analysis = await this.runAnalysis(config.analysisType, inputs.data);
        break;
      default:
        throw new Error(`Unknown AI type: ${config.aiType}`);
    }

    this.setNodeOutputs(node.id, outputs);
  }

  /**
   * Execute output node - save results
   */
  private async executeOutputNode(
    executionId: string, 
    node: PipelineNode, 
    inputs: Record<string, any>
  ): Promise<void> {
    const config = node.data.config;

    switch (config.outputType) {
      case 'file':
        await this.saveToFile(inputs.data, config.filePath, config.format);
        break;
      case 'api':
        await this.sendToAPI(inputs.data, config.apiEndpoint, config.method);
        break;
      case 'database':
        await this.saveToDB(inputs.data, config.connectionString, config.table);
        break;
      case 'display':
        this.emitEvent(executionId, {
          type: 'output-display',
          data: { nodeId: node.id, output: inputs.data }
        });
        break;
    }

    this.setNodeOutputs(node.id, { status: 'saved', data: inputs.data });
  }

  /**
   * Execute condition node - conditional logic
   */
  private async executeConditionNode(
    executionId: string, 
    node: PipelineNode, 
    inputs: Record<string, any>
  ): Promise<void> {
    const config = node.data.config;
    const condition = config.condition;
    
    // Evaluate condition based on inputs
    const result = this.evaluateCondition(condition, inputs);
    
    this.setNodeOutputs(node.id, { 
      condition: result,
      data: inputs.data,
      metadata: { evaluatedAt: new Date().toISOString() }
    });
  }

  // Helper methods for node execution contexts
  private getNodeInputs(nodeId: string, edges: Connection[]): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    edges.forEach(edge => {
      if (edge.target === nodeId) {
        const sourceOutputs = this.nodeExecutions.get(edge.source)?.outputs || {};
        inputs[edge.sourceHandle || 'default'] = sourceOutputs;
      }
    });
    
    return inputs;
  }

  private setNodeOutputs(nodeId: string, outputs: Record<string, any>): void {
    const existing = this.nodeExecutions.get(nodeId) || {
      nodeId,
      inputs: {},
      outputs: {},
      dependencies: []
    };
    
    existing.outputs = { ...existing.outputs, ...outputs };
    this.nodeExecutions.set(nodeId, existing);
  }

  // Data processing helper methods
  private async loadFileData(filePath: string): Promise<any> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      
      switch (ext) {
        case '.json':
          return JSON.parse(data);
        case '.csv':
          return this.parseCSV(data);
        case '.yaml':
        case '.yml':
          return yaml.load(data);
        default:
          return data;
      }
    } catch (error) {
      throw new Error(`Failed to load file ${filePath}: ${(error as Error).message}`);
    }
  }

  private async fetchAPIData(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    try {
      const response = await fetch(endpoint, { headers });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from API ${endpoint}: ${(error as Error).message}`);
    }
  }

  private async queryDatabase(connectionString: string, query: string): Promise<any> {
    // Placeholder for database integration
    throw new Error('Database integration not yet implemented');
  }

  private async transformData(data: any, transformations: any[]): Promise<any> {
    // Apply data transformations
    let result = data;
    
    for (const transform of transformations) {
      switch (transform.type) {
        case 'map':
          result = result.map(transform.function);
          break;
        case 'sort':
          result = result.sort(transform.compareFn);
          break;
        case 'group':
          result = this.groupBy(result, transform.key);
          break;
      }
    }
    
    return result;
  }

  private async filterData(data: any, filters: any[]): Promise<any> {
    // Apply filters to data
    let result = data;
    
    for (const filter of filters) {
      result = result.filter((item: any) => this.evaluateFilter(item, filter));
    }
    
    return result;
  }

  private async aggregateData(data: any, aggregations: any[]): Promise<any> {
    // Perform aggregations on data
    const result: Record<string, any> = {};
    
    for (const agg of aggregations) {
      switch (agg.type) {
        case 'count':
          result[agg.field] = data.length;
          break;
        case 'sum':
          result[agg.field] = data.reduce((sum: number, item: any) => sum + (item[agg.field] || 0), 0);
          break;
        case 'avg':
          result[agg.field] = data.reduce((sum: number, item: any) => sum + (item[agg.field] || 0), 0) / data.length;
          break;
      }
    }
    
    return result;
  }

  private async executeScript(script: string, inputs: Record<string, any>): Promise<any> {
    // Execute custom script with inputs
    // This is a simplified implementation - in production, you'd want proper sandboxing
    try {
      const func = new Function('inputs', script);
      return func(inputs);
    } catch (error) {
      throw new Error(`Script execution failed: ${(error as Error).message}`);
    }
  }

  private async callLLM(model: string, prompt: string, data: any): Promise<any> {
    // Placeholder for LLM integration
    return {
      model,
      prompt: prompt.replace('{{data}}', JSON.stringify(data)),
      response: `Processed by ${model}`,
      timestamp: new Date().toISOString()
    };
  }

  private async runClassification(modelPath: string, data: any): Promise<any> {
    // Placeholder for ML classification
    return {
      predictions: [{ class: 'positive', confidence: 0.85 }],
      modelPath,
      processedAt: new Date().toISOString()
    };
  }

  private async runGeneration(config: any, data: any): Promise<any> {
    // Placeholder for content generation
    return {
      generated: 'Generated content based on input data',
      config,
      processedAt: new Date().toISOString()
    };
  }

  private async runAnalysis(analysisType: string, data: any): Promise<any> {
    // Placeholder for data analysis
    return {
      analysisType,
      results: { insights: 'Data analysis complete', summary: 'Key findings...' },
      processedAt: new Date().toISOString()
    };
  }

  private async saveToFile(data: any, filePath: string, format: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    let content: string;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(data);
        break;
      case 'yaml':
        content = yaml.dump(data);
        break;
      default:
        content = String(data);
    }
    
    await fs.writeFile(filePath, content);
  }

  private async sendToAPI(data: any, endpoint: string, method: string = 'POST'): Promise<any> {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }

  private async saveToDB(data: any, connectionString: string, table: string): Promise<void> {
    // Placeholder for database save operation
    throw new Error('Database save operation not yet implemented');
  }

  // Utility methods
  private parseCSV(csvText: string): any[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const obj: Record<string, string> = {};
      const currentLine = lines[i].split(',');
      
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j];
      }
      result.push(obj);
    }
    
    return result;
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(field => row[field]).join(','))
    ].join('\n');
    
    return csvContent;
  }

  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  private evaluateFilter(item: any, filter: any): boolean {
    const { field, operator, value } = filter;
    const itemValue = item[field];
    
    switch (operator) {
      case 'eq': return itemValue === value;
      case 'ne': return itemValue !== value;
      case 'gt': return itemValue > value;
      case 'lt': return itemValue < value;
      case 'gte': return itemValue >= value;
      case 'lte': return itemValue <= value;
      case 'contains': return String(itemValue).includes(value);
      default: return true;
    }
  }

  private evaluateCondition(condition: any, inputs: Record<string, any>): boolean {
    // Simple condition evaluation - can be extended for complex logic
    const { field, operator, value } = condition;
    const inputValue = inputs[field];
    
    return this.evaluateFilter({ [field]: inputValue }, { field, operator, value });
  }

  private convertToMLConfig(pipeline: Pipeline): MLPipelineConfig {
    // Convert ReactFlow pipeline to legacy ML config format for backward compatibility
    const stages: MLPipelineStage[] = pipeline.nodes.map(node => ({
      id: node.id,
      name: node.data.label,
      status: 'idle',
      logs: [],
      outputs: {},
      artifacts: []
    }));

    return {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description,
      stages,
      outputPath: `./outputs/${pipeline.id}`
    };
  }

  private emitEvent(pipelineId: string, event: PipelineEvent): void {
    this.io.to(`pipeline-${pipelineId}`).emit('pipeline-event', event);
  }

  // Public API methods
  async getPipelineStatus(pipelineId: string): Promise<PipelineExecution | null> {
    return this.executions.get(pipelineId) || null;
  }

  async stopPipeline(pipelineId: string): Promise<void> {
    const execution = this.executions.get(pipelineId);
    if (execution) {
      execution.status = 'error';
      execution.endTime = new Date();
      
      // Clean up any running processes
      for (const [processId, process] of this.processes.entries()) {
        if (processId.startsWith(pipelineId)) {
          process.kill();
          this.processes.delete(processId);
        }
      }
      
      this.executions.delete(pipelineId);
      this.nodeExecutions.clear();
    }
  }
}

export default DynamicPipelineService;