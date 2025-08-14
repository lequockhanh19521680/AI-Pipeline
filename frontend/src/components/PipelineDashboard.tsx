import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

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
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    fetchPipelineData();
  }, [selectedTimeframe]);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/pipeline/executions?timeframe=${selectedTimeframe}`);
      const data = await response.json();
      
      if (data.success) {
        setExecutions(data.executions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
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

  const executionTrendData = executions.slice(-7).map((execution, index) => ({
    day: new Date(execution.startTime).toLocaleDateString('en-US', { weekday: 'short' }),
    success: execution.status === 'completed' ? 1 : 0,
    failed: execution.status === 'failed' ? 1 : 0,
    duration: execution.duration ? execution.duration / 1000 / 60 : 0 // Convert to minutes
  }));

  const stagePerformanceData = executions
    .filter(exec => exec.status === 'completed')
    .flatMap(exec => exec.stages.map(stage => ({
      name: stage.name,
      duration: stage.duration ? stage.duration / 1000 : 0,
      success: stage.status === 'completed' ? 1 : 0
    })))
    .reduce((acc: any[], stage) => {
      const existing = acc.find(item => item.name === stage.name);
      if (existing) {
        existing.totalDuration += stage.duration;
        existing.count += 1;
        existing.successCount += stage.success;
      } else {
        acc.push({
          name: stage.name,
          totalDuration: stage.duration,
          count: 1,
          successCount: stage.success
        });
      }
      return acc;
    }, [])
    .map(item => ({
      name: item.name,
      avgDuration: item.totalDuration / item.count,
      successRate: (item.successCount / item.count) * 100
    }));

  const statusDistribution = [
    { name: 'Completed', value: executions.filter(e => e.status === 'completed').length, color: '#10B981' },
    { name: 'Failed', value: executions.filter(e => e.status === 'failed').length, color: '#EF4444' },
    { name: 'Running', value: executions.filter(e => e.status === 'running').length, color: '#3B82F6' },
    { name: 'Cancelled', value: executions.filter(e => e.status === 'cancelled').length, color: '#6B7280' }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading pipeline data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pipeline Monitoring Dashboard
        </h2>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatDuration(stats.averageDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Executions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeExecutions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execution Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={executionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="success" stackId="1" stroke="#10B981" fill="#10B981" />
              <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#EF4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Performance Chart */}
      {stagePerformanceData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stage Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stagePerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'avgDuration' ? `${value.toFixed(1)}s` : `${value.toFixed(1)}%`,
                  name === 'avgDuration' ? 'Avg Duration' : 'Success Rate'
                ]}
              />
              <Bar dataKey="avgDuration" fill="#3B82F6" />
              <Bar dataKey="successRate" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Executions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Executions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Pipeline</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Duration</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Stages</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {executions.slice(0, 10).map((execution) => (
                <tr key={execution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">{execution.name}</td>
                  <td className="px-4 py-2 text-sm">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(execution.status) }}
                    >
                      {execution.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {execution.duration ? formatDuration(execution.duration) : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {execution.completedStages}/{execution.totalStages}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(execution.startTime).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PipelineDashboard;