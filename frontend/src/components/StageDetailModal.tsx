import React, { useState } from 'react';
import { StageDetailProps } from '../types';

const StageDetailModal: React.FC<StageDetailProps> = ({ stage, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'outputs' | 'artifacts'>('overview');

  if (!isOpen) return null;

  const formatTime = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getDuration = () => {
    if (!stage.startTime) return 'N/A';
    const end = stage.endTime || new Date();
    const duration = (end.getTime() - new Date(stage.startTime).getTime()) / 1000;
    return `${duration.toFixed(1)}s`;
  };

  const getStatusBadge = () => {
    const statusClasses = {
      idle: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[stage.status]}`}>
        {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  {stage.name}
                </h3>
                {getStatusBadge()}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'logs', name: 'Logs', icon: '📄', count: stage.logs.length },
                  { id: 'outputs', name: 'Outputs', icon: '🔄' },
                  { id: 'artifacts', name: 'Artifacts', icon: '📁', count: stage.artifacts.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                    {tab.count !== undefined && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stage ID</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">{stage.id}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{stage.status}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatTime(stage.startTime)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{getDuration()}</p>
                  </div>
                </div>

                {stage.progress !== undefined && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Progress</h4>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stage.progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stage.progress}% complete</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-2">
                {stage.logs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No logs available</p>
                ) : (
                  <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-80 overflow-y-auto">
                    {stage.logs.map((log, index) => (
                      <div key={index} className="text-green-400 whitespace-pre-wrap break-words">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'outputs' && (
              <div className="space-y-4">
                {Object.keys(stage.outputs).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No outputs available</p>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(stage.outputs, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'artifacts' && (
              <div className="space-y-2">
                {stage.artifacts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No artifacts available</p>
                ) : (
                  <div className="space-y-2">
                    {stage.artifacts.map((artifact, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {artifact}
                          </p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageDetailModal;