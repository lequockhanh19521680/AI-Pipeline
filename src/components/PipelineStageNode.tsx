import React from 'react';
import { Handle, Position } from 'reactflow';
import { MLPipelineStage } from '../types';

interface PipelineStageNodeProps {
  data: {
    stage: MLPipelineStage;
    isActive: boolean;
    onClick: () => void;
    onHover?: (stageId: string | null) => void;
  };
}

const PipelineStageNode: React.FC<PipelineStageNodeProps> = ({ data }) => {
  const { stage, isActive, onClick, onHover } = data;

  const getStatusIcon = () => {
    switch (stage.status) {
      case 'running':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        );
      case 'completed':
        return (
          <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-4 w-4 rounded-full bg-gray-400 dark:bg-gray-600"></div>
        );
    }
  };

  const getStatusColor = () => {
    switch (stage.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
    }
  };

  const getProgressBar = () => {
    if (stage.status === 'running' && stage.progress !== undefined) {
      return (
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${stage.progress}%` }}
          ></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg
        min-w-[180px] max-w-[220px]
        ${getStatusColor()}
        ${isActive ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => onHover?.(stage.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Input handle */}
      {stage.id !== 'data_ingestion' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* Output handle */}
      {stage.id !== 'deployment' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* Stage content */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {stage.name}
          </h3>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stage.status === 'idle' && 'Ready to run'}
            {stage.status === 'running' && 'Processing...'}
            {stage.status === 'completed' && 'Completed'}
            {stage.status === 'error' && 'Failed'}
          </p>

          {/* Progress bar for running stages */}
          {getProgressBar()}

          {/* Execution time */}
          {(stage.startTime || stage.endTime) && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {stage.startTime && stage.endTime && (
                `${Math.round((new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / 1000)}s`
              )}
              {stage.startTime && !stage.endTime && stage.status === 'running' && (
                `${Math.round((Date.now() - new Date(stage.startTime).getTime()) / 1000)}s`
              )}
            </p>
          )}

          {/* Log count indicator */}
          {stage.logs.length > 0 && (
            <div className="flex items-center mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stage.logs.length} log{stage.logs.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Artifacts indicator */}
          {stage.artifacts.length > 0 && (
            <div className="flex items-center mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stage.artifacts.length} artifact{stage.artifacts.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active stage indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
      )}
    </div>
  );
};

export default PipelineStageNode;