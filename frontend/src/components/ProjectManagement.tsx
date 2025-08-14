import React, { useState } from 'react';
import { ProjectManagementProps, ProjectMetadata, PipelineConfig } from '../types';

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects,
  currentProject,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<ProjectMetadata>>({
    name: '',
    description: '',
    type: 'fullstack',
  });

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.description) return;

    const project: ProjectMetadata = {
      id: `project_${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      type: newProject.type as 'frontend' | 'backend' | 'fullstack',
      createdAt: new Date(),
      lastModified: new Date(),
      status: 'draft',
    };

    onProjectCreate(project);
    setShowCreateModal(false);
    setNewProject({ name: '', description: '', type: 'fullstack' });
  };

  const getProjectStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      frontend: '🎨',
      backend: '⚙️',
      fullstack: '🚀',
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your AI-generated projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Current Project */}
      {currentProject && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Current Project</h3>
            {getProjectStatusBadge(currentProject.status)}
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-2xl">{getTypeIcon(currentProject.type)}</div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{currentProject.name}</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{currentProject.description}</p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span>Type: {currentProject.type}</span>
                <span>•</span>
                <span>Created: {new Date(currentProject.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Modified: {new Date(currentProject.lastModified).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`
              bg-white dark:bg-gray-800 rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg
              ${currentProject?.id === project.id 
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => onProjectSelect(project)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-2xl">{getTypeIcon(project.type)}</div>
              <div className="flex items-center space-x-2">
                {getProjectStatusBadge(project.status)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectDelete(project.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{project.type}</span>
              <span>{new Date(project.lastModified).toLocaleDateString()}</span>
            </div>

            {project.mlPipelineId && (
              <div className="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                ML Pipeline Active
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first AI project</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowCreateModal(false)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Create New Project
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newProject.name || ''}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Enter project name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Type
                    </label>
                    <select
                      value={newProject.type || 'fullstack'}
                      onChange={(e) => setNewProject({ ...newProject, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="frontend">Frontend Only</option>
                      <option value="backend">Backend Only</option>
                      <option value="fullstack">Full Stack</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newProject.description || ''}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Describe your project..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.description}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;