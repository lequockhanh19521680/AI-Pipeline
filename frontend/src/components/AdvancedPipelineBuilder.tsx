import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PipelineNode, Pipeline } from '@shared/types/pipeline.js';

// Custom node types
const InputNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 border-blue-500">
    <div className="flex items-center">
      <div className="ml-2">
        <div className="text-lg font-bold text-blue-900">{data.label}</div>
        <div className="text-sm text-blue-700">{data.type}</div>
      </div>
    </div>
  </div>
);

const ProcessingNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-500">
    <div className="flex items-center">
      <div className="ml-2">
        <div className="text-lg font-bold text-green-900">{data.label}</div>
        <div className="text-sm text-green-700">{data.type}</div>
        {data.aiSuggestions && (
          <div className="text-xs text-green-600 mt-1">
            💡 {data.aiSuggestions.length} AI suggestions
          </div>
        )}
      </div>
    </div>
  </div>
);

const AINode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 border-purple-500">
    <div className="flex items-center">
      <div className="ml-2">
        <div className="text-lg font-bold text-purple-900">{data.label}</div>
        <div className="text-sm text-purple-700">🤖 AI Processing</div>
        {data.config?.model && (
          <div className="text-xs text-purple-600">
            Model: {data.config.model}
          </div>
        )}
      </div>
    </div>
  </div>
);

const OutputNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 border-orange-500">
    <div className="flex items-center">
      <div className="ml-2">
        <div className="text-lg font-bold text-orange-900">{data.label}</div>
        <div className="text-sm text-orange-700">{data.type}</div>
      </div>
    </div>
  </div>
);

const ConditionNode: React.FC<{ data: any }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 border-yellow-500">
    <div className="flex items-center">
      <div className="ml-2">
        <div className="text-lg font-bold text-yellow-900">{data.label}</div>
        <div className="text-sm text-yellow-700">🔀 Condition</div>
      </div>
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  input: InputNode,
  processing: ProcessingNode,
  ai: AINode,
  output: OutputNode,
  condition: ConditionNode,
};

interface AdvancedPipelineBuilderProps {
  pipeline?: Pipeline;
  onPipelineChange?: (pipeline: Pipeline) => void;
  className?: string;
}

export const AdvancedPipelineBuilder: React.FC<AdvancedPipelineBuilderProps> = ({
  pipeline,
  onPipelineChange,
  className = '',
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('processing');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${nodes.length + 1}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        type: type,
        config: {},
        aiSuggestions: type === 'ai' ? ['Optimize parameters', 'Add validation'] : undefined,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, setNodes]);

  const savePipeline = useCallback(() => {
    if (!onPipelineChange) return;

    const pipelineData: Pipeline = {
      id: pipeline?.id || `pipeline-${Date.now()}`,
      name: pipeline?.name || 'New Pipeline',
      description: pipeline?.description || 'Created with Advanced Pipeline Builder',
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type as any,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id!,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      category: 'code-gen',
      template: false,
      isPublic: false,
      createdAt: pipeline?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onPipelineChange(pipelineData);
  }, [nodes, edges, pipeline, onPipelineChange]);

  const loadTemplate = useCallback((templateType: 'web-app' | 'ml-pipeline' | 'api') => {
    let templateNodes: Node[] = [];
    let templateEdges: Edge[] = [];

    switch (templateType) {
      case 'web-app':
        templateNodes = [
          {
            id: '1',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { label: 'Requirements', type: 'input' },
          },
          {
            id: '2',
            type: 'processing',
            position: { x: 300, y: 100 },
            data: { label: 'Frontend Setup', type: 'processing' },
          },
          {
            id: '3',
            type: 'processing',
            position: { x: 300, y: 200 },
            data: { label: 'Backend Setup', type: 'processing' },
          },
          {
            id: '4',
            type: 'ai',
            position: { x: 500, y: 150 },
            data: { label: 'Code Generation', type: 'ai', config: { model: 'gpt-4' } },
          },
          {
            id: '5',
            type: 'output',
            position: { x: 700, y: 150 },
            data: { label: 'Deploy', type: 'output' },
          },
        ];
        templateEdges = [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e1-3', source: '1', target: '3' },
          { id: 'e2-4', source: '2', target: '4' },
          { id: 'e3-4', source: '3', target: '4' },
          { id: 'e4-5', source: '4', target: '5' },
        ];
        break;
      
      case 'ml-pipeline':
        templateNodes = [
          {
            id: '1',
            type: 'input',
            position: { x: 100, y: 100 },
            data: { label: 'Data Input', type: 'input' },
          },
          {
            id: '2',
            type: 'processing',
            position: { x: 300, y: 100 },
            data: { label: 'Data Preprocessing', type: 'processing' },
          },
          {
            id: '3',
            type: 'ai',
            position: { x: 500, y: 100 },
            data: { label: 'Model Training', type: 'ai', config: { model: 'tensorflow' } },
          },
          {
            id: '4',
            type: 'condition',
            position: { x: 700, y: 100 },
            data: { label: 'Validation Check', type: 'condition' },
          },
          {
            id: '5',
            type: 'output',
            position: { x: 900, y: 100 },
            data: { label: 'Model Deploy', type: 'output' },
          },
        ];
        templateEdges = [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' },
          { id: 'e4-5', source: '4', target: '5' },
        ];
        break;

      default:
        return;
    }

    setNodes(templateNodes);
    setEdges(templateEdges);
  }, [setNodes, setEdges]);

  return (
    <div className={`h-full ${className}`}>
      <div style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          
          <Panel position="top-left" className="bg-white p-4 rounded shadow-lg">
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Pipeline Builder</h3>
              
              {/* Node Type Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">Add Node:</label>
                <select
                  value={selectedNodeType}
                  onChange={(e) => setSelectedNodeType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="input">Input</option>
                  <option value="processing">Processing</option>
                  <option value="ai">AI Processing</option>
                  <option value="condition">Condition</option>
                  <option value="output">Output</option>
                </select>
                <button
                  onClick={() => addNode(selectedNodeType)}
                  className="w-full mt-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Node
                </button>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-sm font-medium mb-1">Templates:</label>
                <div className="space-y-1">
                  <button
                    onClick={() => loadTemplate('web-app')}
                    className="w-full px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Web App
                  </button>
                  <button
                    onClick={() => loadTemplate('ml-pipeline')}
                    className="w-full px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                  >
                    ML Pipeline
                  </button>
                </div>
              </div>

              {/* Save Pipeline */}
              <button
                onClick={savePipeline}
                className="w-full px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Save Pipeline
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default AdvancedPipelineBuilder;