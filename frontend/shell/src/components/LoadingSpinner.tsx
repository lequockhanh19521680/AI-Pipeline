import React from 'react'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="mf-loading">
      <div className="flex flex-col items-center">
        <div className="spinner"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner