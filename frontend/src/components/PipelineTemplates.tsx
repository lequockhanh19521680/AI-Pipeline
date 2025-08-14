import React, { useState, useEffect } from 'react';
import { Pipeline, PipelineTemplate } from '@shared/types/pipeline.js';

interface PipelineTemplatesProps {
  onSelectTemplate?: (template: PipelineTemplate) => void;
  onCreateFromTemplate?: (template: PipelineTemplate) => void;
  className?: string;
}

// Mock template data
const mockTemplates: PipelineTemplate[] = [
  {
    id: 'web-app-starter',
    name: 'Web Application Starter',
    description: 'Complete web application with React frontend and Node.js backend',
    category: 'Web Development',
    nodes: [
      { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Requirements', config: {} } },
      { id: '2', type: 'processing', position: { x: 300, y: 100 }, data: { label: 'Frontend Setup', config: {} } },
      { id: '3', type: 'processing', position: { x: 300, y: 200 }, data: { label: 'Backend Setup', config: {} } },
      { id: '4', type: 'ai', position: { x: 500, y: 150 }, data: { label: 'Code Generation', config: {} } },
      { id: '5', type: 'output', position: { x: 700, y: 150 }, data: { label: 'Deploy', config: {} } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ],
    isPublic: true,
    author: 'AI Pipeline Team',
    tags: ['web', 'react', 'nodejs', 'fullstack'],
    downloads: 1250,
    rating: 4.8,
  },
  {
    id: 'ml-training-pipeline',
    name: 'ML Training Pipeline',
    description: 'End-to-end machine learning training and deployment pipeline',
    category: 'Machine Learning',
    nodes: [
      { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Data Input', config: {} } },
      { id: '2', type: 'processing', position: { x: 300, y: 100 }, data: { label: 'Data Preprocessing', config: {} } },
      { id: '3', type: 'ai', position: { x: 500, y: 100 }, data: { label: 'Model Training', config: {} } },
      { id: '4', type: 'condition', position: { x: 700, y: 100 }, data: { label: 'Validation', config: {} } },
      { id: '5', type: 'output', position: { x: 900, y: 100 }, data: { label: 'Deploy Model', config: {} } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ],
    isPublic: true,
    author: 'ML Community',
    tags: ['ml', 'tensorflow', 'python', 'data-science'],
    downloads: 890,
    rating: 4.6,
  },
  {
    id: 'api-microservice',
    name: 'API Microservice',
    description: 'RESTful API microservice with authentication and database',
    category: 'Backend',
    nodes: [
      { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'API Specs', config: {} } },
      { id: '2', type: 'processing', position: { x: 300, y: 100 }, data: { label: 'Auth Setup', config: {} } },
      { id: '3', type: 'processing', position: { x: 500, y: 100 }, data: { label: 'Database Schema', config: {} } },
      { id: '4', type: 'ai', position: { x: 700, y: 100 }, data: { label: 'Code Generation', config: {} } },
      { id: '5', type: 'output', position: { x: 900, y: 100 }, data: { label: 'Deploy API', config: {} } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ],
    isPublic: true,
    author: 'Backend Experts',
    tags: ['api', 'rest', 'auth', 'database'],
    downloads: 678,
    rating: 4.4,
  },
  {
    id: 'data-pipeline',
    name: 'Data Processing Pipeline',
    description: 'ETL pipeline for data extraction, transformation, and loading',
    category: 'Data Engineering',
    nodes: [
      { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Data Sources', config: {} } },
      { id: '2', type: 'processing', position: { x: 300, y: 100 }, data: { label: 'Extract', config: {} } },
      { id: '3', type: 'processing', position: { x: 500, y: 100 }, data: { label: 'Transform', config: {} } },
      { id: '4', type: 'processing', position: { x: 700, y: 100 }, data: { label: 'Load', config: {} } },
      { id: '5', type: 'output', position: { x: 900, y: 100 }, data: { label: 'Data Warehouse', config: {} } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ],
    isPublic: true,
    author: 'Data Team',
    tags: ['etl', 'data', 'warehouse', 'processing'],
    downloads: 445,
    rating: 4.2,
  },
];

const categories = ['All', 'Web Development', 'Machine Learning', 'Backend', 'Data Engineering'];

export const PipelineTemplates: React.FC<PipelineTemplatesProps> = ({
  onSelectTemplate,
  onCreateFromTemplate,
  className = '',
}) => {
  const [templates, setTemplates] = useState<PipelineTemplate[]>(mockTemplates);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'name'>('downloads');

  const filteredTemplates = templates
    .filter(template => {
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleUseTemplate = (template: PipelineTemplate) => {
    onCreateFromTemplate?.(template);
  };

  const handlePreviewTemplate = (template: PipelineTemplate) => {
    onSelectTemplate?.(template);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    
    return stars.join('');
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-800 border-b">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Pipeline Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start with proven pipeline templates and customize them for your needs
        </p>
      </div>

      {/* Filters and Search */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b space-y-4">
        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="downloads">Sort by Downloads</option>
            <option value="rating">Sort by Rating</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Template Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {template.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {template.description}
                </p>
              </div>

              {/* Template Stats */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <span>{renderStars(template.rating)}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {template.rating}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {template.downloads} downloads
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    by {template.author}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex space-x-2">
                <button
                  onClick={() => handlePreviewTemplate(template)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or category filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineTemplates;