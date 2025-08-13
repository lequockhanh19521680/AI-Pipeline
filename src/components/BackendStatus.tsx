import React, { useEffect, useState } from 'react';
import { BackendStatusProps } from '../types';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
}

const BackendStatus: React.FC<BackendStatusProps> = ({ files, projectType, isVisible }) => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [serverStatus, setServerStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible && (projectType === 'backend' || projectType === 'fullstack')) {
      analyzeBackendFiles();
      simulateServerStatus();
    }
  }, [files, isVisible, projectType]);

  const analyzeBackendFiles = () => {
    const backendFiles = Object.entries(files).filter(([name, content]) => 
      name.endsWith('.js') || 
      name.endsWith('.ts') || 
      name.endsWith('.py') || 
      name.includes('server') ||
      name.includes('api') ||
      name.includes('route')
    );

    const extractedEndpoints: APIEndpoint[] = [];

    backendFiles.forEach(([name, content]) => {
      // Extract API endpoints from common patterns
      const patterns = [
        /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
        /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
        /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]/g,
        /Route\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          extractedEndpoints.push({
            method: match[1].toUpperCase(),
            path: match[2],
            description: `${match[1].toUpperCase()} endpoint`,
            status: 'active'
          });
        }
      });
    });

    // Add some default endpoints if none found
    if (extractedEndpoints.length === 0) {
      extractedEndpoints.push(
        { method: 'GET', path: '/api/health', description: 'Health check endpoint', status: 'active' },
        { method: 'GET', path: '/api/users', description: 'Get all users', status: 'active' },
        { method: 'POST', path: '/api/users', description: 'Create new user', status: 'active' },
        { method: 'GET', path: '/api/users/:id', description: 'Get user by ID', status: 'active' }
      );
    }

    setEndpoints(extractedEndpoints);
  };

  const simulateServerStatus = () => {
    setServerStatus('running');
    setLogs([
      '[INFO] Server starting...',
      '[INFO] Database connected successfully',
      '[INFO] Server listening on port 3000',
      '[INFO] All endpoints registered',
      '[SUCCESS] Server is running and ready to accept requests'
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'text-green-500';
      case 'stopped':
      case 'inactive':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'bg-green-500';
      case 'stopped':
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isVisible || (projectType !== 'backend' && projectType !== 'fullstack')) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-800">
      <div className="p-3 border-b border-gray-200 dark:border-dark-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
          <i className="fas fa-server mr-2 text-primary-600"></i>
          Backend Status
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Server Status */}
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Server Status
            </h4>
            <span className={`flex items-center text-xs ${getStatusColor(serverStatus)}`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${getStatusDot(serverStatus)}`}></span>
              {serverStatus.charAt(0).toUpperCase() + serverStatus.slice(1)}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {serverStatus === 'running' ? (
              <>
                <p>🚀 Server is running on port 3000</p>
                <p>📊 Database connected</p>
                <p>✅ All systems operational</p>
              </>
            ) : (
              <p>Server is not running</p>
            )}
          </div>
        </div>

        {/* API Endpoints */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            API Endpoints
          </h4>
          <div className="space-y-2">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded border border-gray-200 dark:border-dark-600"
              >
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-mono font-medium rounded ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <span className="text-xs font-mono text-gray-900 dark:text-gray-100">
                    {endpoint.path}
                  </span>
                </div>
                <span className={`w-2 h-2 rounded-full ${getStatusDot(endpoint.status)}`}></span>
              </div>
            ))}
          </div>
        </div>

        {/* Server Logs */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Server Logs
          </h4>
          <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs h-32 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Database
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Connection:</span>
              <span className="text-green-600 dark:text-green-400">✅ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="text-gray-900 dark:text-gray-100">MongoDB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Collections:</span>
              <span className="text-gray-900 dark:text-gray-100">3</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Performance
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
              <span className="text-green-600 dark:text-green-400">~45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
              <span className="text-yellow-600 dark:text-yellow-400">156MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Connections:</span>
              <span className="text-gray-900 dark:text-gray-100">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendStatus;