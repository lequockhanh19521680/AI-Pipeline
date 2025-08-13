import React from 'react';
import { ThemeToggleProps } from '../types';

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!isDarkMode)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-gray-600 dark:text-gray-400`}></i>
    </button>
  );
};

export default ThemeToggle;