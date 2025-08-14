import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import backendAPI from '../services/BackendAPI';
import webSocketService from '../services/WebSocketService';

interface PipelineExecution {
  id: string;
  pipelineId: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  stages: any[];
  totalStages: number;
  completedStages: number;
  metrics: {
    successRate: number;
    averageDuration: number;
    performanceScore: number;
  };
}

interface DashboardStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  activeExecutions: number;
}

interface PipelineDashboardProps {
  className?: string;
}

const PipelineDashboard: React.FC<PipelineDashboardProps> = ({ className = '' }) => {
  const [executions, setExecutions] = useState<PipelineExecution[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalExecutions: 0,
    successRate: 0,
    averageDuration: 0,
    activeExecutions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineData();
    
    // Set up WebSocket connection for real-time updates
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        
        // Listen for pipeline events
        webSocketService.onPipelineEvent('stage_completed', () => {
          fetchPipelineData();
        });
        
        webSocketService.onPipelineEvent('stage_failed', () => {
          fetchPipelineData();
        });
        
        webSocketService.onPipelineEvent('pipeline_completed', () => {
          fetchPipelineData();
        });
        
        webSocketService.onPipelineEvent('pipeline_failed', () => {
          fetchPipelineData();
        });
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real pipeline executions from backend
      const data = await backendAPI.getPipelineExecutions({
        page: 1,
        limit: 50
      });
      
      setExecutions(data.executions);
      
      // Calculate stats from real data
      const totalExecutions = data.executions.length;
      const completedExecutions = data.executions.filter(exec => exec.status === 'completed').length;
      const activeExecutions = data.executions.filter(exec => exec.status === 'running').length;
      const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
      
      const totalDuration = data.executions
        .filter(exec => exec.duration)
        .reduce((sum, exec) => sum + (exec.duration || 0), 0);
      const averageDuration = completedExecutions > 0 ? totalDuration / completedExecutions : 0;
      
      setStats({
        totalExecutions,
        successRate,
        averageDuration,
        activeExecutions
      });
      
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch pipeline data');
      
      // Fall back to empty data
      setExecutions([]);
      setStats({
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        activeExecutions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      case 'running': return '#3B82F6';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const statusCounts = executions.reduce((acc, exec) => {
    acc[exec.status] = (acc[exec.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: getStatusColor(status)
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pipeline Monitoring Dashboard
        </h2>
        <button
          onClick={fetchPipelineData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Refreshing...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 mr-3"></i>
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Failed to load pipeline data</h3>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 dark:text-blue-400 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading pipeline data...</p>
          </div>
        </div>
      )}

      {/* Content - only show if not loading and no error */}
      {!loading && !error && executions.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <i className="fas fa-database text-blue-600 dark:text-blue-400"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Executions</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalExecutions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <i className="fas fa-clock text-yellow-600 dark:text-yellow-400"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.averageDuration > 0 ? formatDuration(stats.averageDuration) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <i className="fas fa-play text-purple-600 dark:text-purple-400"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Executions</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeExecutions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Executions Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Execution Timeline</h3>
              <div className="space-y-3">
                {executions.slice(0, 5).map((execution) => (
                  <div key={execution.id} className="flex items-center space-x-3">
                    <div 
                      className={`w-3 h-3 rounded-full`}
                      style={{ backgroundColor: getStatusColor(execution.status) }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{execution.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(execution.startTime).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      execution.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      execution.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      execution.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {execution.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Executions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Pipeline Executions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {executions.slice(0, 10).map((execution) => (
                    <tr key={execution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {execution.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          execution.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          execution.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          execution.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {execution.duration ? formatDuration(execution.duration) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {execution.completedStages}/{execution.totalStages}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(execution.startTime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && executions.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-database text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Pipeline Executions</h3>
          <p className="text-gray-600 dark:text-gray-400">Start running pipelines to see monitoring data here.</p>
        </div>
      )}
    </div>
  );
};

export default PipelineDashboard;