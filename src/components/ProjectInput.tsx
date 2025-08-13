import React, { useState } from 'react';
import { ProjectInputProps, PipelineConfig } from '../types';
import { getDefaultProjectConfig } from '../data';

const ProjectInput: React.FC<ProjectInputProps> = ({ onProjectSubmit, isVisible }) => {
  const [projectType, setProjectType] = useState<'frontend' | 'backend' | 'fullstack'>('frontend');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [features, setFeatures] = useState(['']);

  if (!isVisible) return null;

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config = getDefaultProjectConfig(projectType);
    config.projectName = projectName;
    config.description = description;
    config.requirements = requirements;
    config.features = features.filter(f => f.trim() !== '');

    onProjectSubmit(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          <i className="fas fa-robot mr-2 text-primary-600"></i>
          AI Pipeline IDE - Project Setup
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['frontend', 'backend', 'fullstack'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    projectType === type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="projectType"
                    value={type}
                    checked={projectType === type}
                    onChange={(e) => setProjectType(e.target.value as any)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {type === 'fullstack' ? 'Full Stack' : type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="input-field"
              placeholder="Enter your project name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="input-field"
              placeholder="Describe what your project should do"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detailed Requirements
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              required
              rows={4}
              className="input-field"
              placeholder="Provide detailed requirements, constraints, and specifications"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Features
            </label>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Feature ${index + 1}`}
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                <i className="fas fa-plus mr-1"></i>
                Add Feature
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="submit"
              className="btn-primary"
              disabled={!projectName || !description || !requirements}
            >
              <i className="fas fa-play mr-2"></i>
              Start AI Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectInput;