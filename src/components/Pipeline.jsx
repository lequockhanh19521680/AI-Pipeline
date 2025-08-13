import React, { useState } from 'react';
import { PIPELINE_STAGES, PIPELINE_STATUS } from '../data';

function Pipeline({ status, apiKey, onApiKeyChange, currentStage, stageResults }) {
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);

  const getStageStatus = (stage) => {
    if (status === PIPELINE_STATUS.IDLE) return 'idle';
    if (status === PIPELINE_STATUS.RUNNING) {
      if (currentStage === stage) return 'active';
      if (stageResults[stage]) return 'completed';
      return 'idle';
    }
    if (status === PIPELINE_STATUS.COMPLETED) return 'completed';
    if (status === PIPELINE_STATUS.ERROR) {
      if (stageResults[stage]) return 'completed';
      if (currentStage === stage) return 'error';
      return 'idle';
    }
    return 'idle';
  };

  const getStageIcon = (stageStatus) => {
    switch (stageStatus) {
      case 'completed':
        return 'w-2 h-2 bg-green-400 rounded-full';
      case 'active':
        return 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse';
      case 'error':
        return 'w-2 h-2 bg-red-400 rounded-full';
      default:
        return 'w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full';
    }
  };

  const getStageTextColor = (stageStatus) => {
    switch (stageStatus) {
      case 'completed':
        return 'text-gray-700 dark:text-gray-300';
      case 'active':
        return 'text-gray-700 dark:text-gray-300';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-dark-600">
      {/* Gemini API Configuration */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Gemini API
          </h3>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            {apiKey ? 'Change' : 'Configure'}
          </button>
        </div>
        
        {showApiKeyInput ? (
          <div className="space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Enter Gemini API key..."
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="text-xs text-green-600 hover:text-green-700"
            >
              Save
            </button>
          </div>
        ) : (
          <div className={`text-xs ${apiKey ? 'text-green-600' : 'text-red-600'}`}>
            {apiKey ? '✓ API key configured' : '⚠ No API key set'}
          </div>
        )}
      </div>

      {/* Pipeline Status */}
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        Pipeline Status
      </h3>
      <div className="space-y-2">
        {Object.values(PIPELINE_STAGES).map(stage => {
          const stageStatus = getStageStatus(stage);
          return (
            <div key={stage} className="flex items-center space-x-2">
              <div className={getStageIcon(stageStatus)}></div>
              <span className={`text-sm ${getStageTextColor(stageStatus)}`}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pipeline Controls */}
      {status === PIPELINE_STATUS.RUNNING && (
        <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Pipeline running...
            </span>
          </div>
        </div>
      )}

      {status === PIPELINE_STATUS.ERROR && (
        <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
            <span className="text-sm text-red-800 dark:text-red-200">
              Pipeline failed
            </span>
          </div>
        </div>
      )}

      {status === PIPELINE_STATUS.COMPLETED && (
        <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <i className="fas fa-check-circle text-green-600"></i>
            <span className="text-sm text-green-800 dark:text-green-200">
              Pipeline completed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pipeline;