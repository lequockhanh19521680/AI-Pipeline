import React from 'react';
import { useUIStore } from '../store/uiStore';

const WelcomeScreen: React.FC = () => {
  const { setPanel, setCurrentView } = useUIStore();

  const handleCreateProject = () => {
    setPanel('showProjectInput', true);
  };

  const handleOpenProject = () => {
    setCurrentView('projects');
  };

  const handleExploreTemplates = () => {
    // This would navigate to templates in the future
    // For now, we'll just show a message
    console.log('Explore templates feature coming soon!');
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl w-full mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <i className="fas fa-robot text-6xl text-primary-500 mb-4"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to AI Pipeline IDE
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Build powerful AI and ML pipelines with our intelligent development environment. 
            Get started by creating a new project or exploring our pre-built templates.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Create New Project */}
          <button
            onClick={handleCreateProject}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
              <i className="fas fa-plus text-primary-600 dark:text-primary-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Create New Project
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start a new AI/ML project from scratch with our intelligent assistant
            </p>
          </button>

          {/* Open Existing Project */}
          <button
            onClick={handleOpenProject}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <i className="fas fa-folder-open text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Open Existing Project
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse and open your existing projects
            </p>
          </button>

          {/* Explore Templates */}
          <button
            onClick={handleExploreTemplates}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <i className="fas fa-templates text-green-600 dark:text-green-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Explore Pipeline Templates
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover pre-built pipeline templates for common use cases
            </p>
          </button>

          {/* Recent Projects */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              <i className="fas fa-clock text-gray-600 dark:text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Recent Projects
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No recent projects yet
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Define Requirements
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe your project requirements and let our AI understand your goals
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">2</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Build Pipeline
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use our visual pipeline builder to create your AI/ML workflow
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Deploy & Monitor
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deploy your pipeline and monitor its performance in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;