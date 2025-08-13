import React, { useState } from 'react';

function Terminal({ output, onCommand }) {
  const [currentCommand, setCurrentCommand] = useState('');

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        onCommand(currentCommand.trim());
        setCurrentCommand('');
      }
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 flex flex-col">
      {/* Panel Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-600">
        <button className="flex-1 px-4 py-2 text-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white border-r border-gray-200 dark:border-dark-600">
          <i className="fas fa-terminal mr-2"></i>
          Output
        </button>
        <button className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700">
          Pipeline
        </button>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Terminal Output */}
          <div className="card p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Terminal</h4>
            <div className="bg-gray-900 dark:bg-black rounded p-3 font-mono text-sm text-green-400 h-40 overflow-y-auto scrollbar-thin">
              {output.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">{line}</div>
              ))}
              <div className="flex items-center">
                <span className="mr-2">$</span>
                <input
                  type="text"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleCommand}
                  className="bg-transparent outline-none flex-1 text-green-400"
                  placeholder="Type command..."
                />
              </div>
            </div>
          </div>

          {/* Pipeline Flow */}
          <div className="card p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Pipeline Flow</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <i className="fas fa-check-circle text-green-600"></i>
                <span className="text-sm text-green-800 dark:text-green-200">Data loaded successfully</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800 dark:text-blue-200">Processing data...</span>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <i className="fas fa-clock text-gray-400"></i>
                <span className="text-sm text-gray-600 dark:text-gray-400">Waiting for processing</span>
              </div>
            </div>
          </div>

          {/* Output Log */}
          <div className="card p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Output Log</h4>
            <div className="bg-gray-900 dark:bg-black rounded p-3 font-mono text-sm text-green-400 h-32 overflow-y-auto scrollbar-thin">
              <div>$ python pipeline.py</div>
              <div>Loading configuration...</div>
              <div>Initializing data processors...</div>
              <div className="text-blue-400">INFO: Pipeline started</div>
              <div className="text-yellow-400">WARN: Using default parameters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terminal;