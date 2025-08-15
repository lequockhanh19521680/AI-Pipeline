import React from 'react'
import { useAppStore } from '../store/appStore'

const Dashboard: React.FC = () => {
  const { user } = useAppStore()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.profile?.firstName || user?.username}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ready to build something amazing with AI Pipeline?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors">
              <div className="font-medium text-primary-700 dark:text-primary-300">
                Create New Project
              </div>
              <div className="text-sm text-primary-600 dark:text-primary-400">
                Start a new AI/ML project
              </div>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="font-medium text-gray-700 dark:text-gray-300">
                Browse Templates
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Explore pre-built pipelines
              </div>
            </button>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Projects
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              No recent projects yet
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                All services operational
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                API Gateway: Online
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Microservices: Healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Microservices Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-medium text-blue-700 dark:text-blue-300">API Gateway</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Port 3000</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="text-2xl mb-2">🔐</div>
            <div className="font-medium text-green-700 dark:text-green-300">Auth Service</div>
            <div className="text-sm text-green-600 dark:text-green-400">Port 3001</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div className="text-2xl mb-2">📁</div>
            <div className="font-medium text-purple-700 dark:text-purple-300">Project Service</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Port 3002</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900 rounded-lg">
            <div className="text-2xl mb-2">🐙</div>
            <div className="font-medium text-orange-700 dark:text-orange-300">GitHub Service</div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Port 3003</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard