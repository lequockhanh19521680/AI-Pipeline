import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MLPipelineStage, PipelineFlowProps } from '../types';
import PipelineStageNode from './PipelineStageNode';

const nodeTypes: NodeTypes = {
  pipelineStage: PipelineStageNode,
};

const PipelineFlow: React.FC<PipelineFlowProps> = ({
  stages,
  currentStage,
  onStageClick,
  onStageHover,
}) => {
  // Convert stages to nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = stages.map((stage, index) => ({
      id: stage.id,
      type: 'pipelineStage',
      position: { x: 250 * index, y: 100 },
      data: {
        stage,
        isActive: currentStage === stage.id,
        onClick: () => onStageClick(stage.id),
        onHover: onStageHover,
      },
    }));

    const edges: Edge[] = stages.slice(0, -1).map((stage, index) => ({
      id: `${stage.id}-${stages[index + 1].id}`,
      source: stage.id,
      target: stages[index + 1].id,
      type: 'smoothstep',
      animated: currentStage === stage.id || currentStage === stages[index + 1].id,
      style: {
        stroke: getEdgeColor(stage, stages[index + 1], currentStage),
        strokeWidth: 2,
      },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [stages, currentStage, onStageClick, onStageHover]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when stages change
  React.useEffect(() => {
    setNodes(prevNodes =>
      prevNodes.map(node => {
        const stage = stages.find(s => s.id === node.id);
        if (stage) {
          return {
            ...node,
            data: {
              ...node.data,
              stage,
              isActive: currentStage === stage.id,
            },
          };
        }
        return node;
      })
    );
  }, [stages, currentStage, setNodes]);

  // Update edges when current stage changes
  React.useEffect(() => {
    setEdges(prevEdges =>
      prevEdges.map(edge => {
        const sourceStage = stages.find(s => s.id === edge.source);
        const targetStage = stages.find(s => s.id === edge.target);
        return {
          ...edge,
          animated: currentStage === edge.source || currentStage === edge.target,
          style: {
            ...edge.style,
            stroke: getEdgeColor(sourceStage, targetStage, currentStage),
          },
        };
      })
    );
  }, [currentStage, stages, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          style={{
            height: 120,
          }}
          zoomable
          pannable
          nodeColor={getNodeColor}
          nodeStrokeWidth={2}
          nodeBorderRadius={8}
        />
      </ReactFlow>
    </div>
  );
};

function getEdgeColor(
  sourceStage: MLPipelineStage | undefined,
  targetStage: MLPipelineStage | undefined,
  currentStage?: string
): string {
  if (!sourceStage || !targetStage) return '#e5e7eb';

  // If current stage is the source, highlight the edge
  if (currentStage === sourceStage.id) {
    return '#3b82f6'; // Blue for active
  }

  // If source is completed and target is active, show progress
  if (sourceStage.status === 'completed' && currentStage === targetStage.id) {
    return '#10b981'; // Green for completed flow
  }

  // If source is completed, show completed color
  if (sourceStage.status === 'completed') {
    return '#10b981'; // Green
  }

  // If source has error, show error color
  if (sourceStage.status === 'error') {
    return '#ef4444'; // Red
  }

  // Default color
  return '#e5e7eb'; // Gray
}

function getNodeColor(node: Node): string {
  const stage = node.data.stage as MLPipelineStage;
  
  switch (stage.status) {
    case 'running':
      return '#3b82f6'; // Blue
    case 'completed':
      return '#10b981'; // Green
    case 'error':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

export default PipelineFlow;