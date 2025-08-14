import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggleProps } from '../types';

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!isDarkMode)}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <FontAwesomeIcon 
        icon={isDarkMode ? faSun : faMoon} 
        className="text-gray-600 dark:text-gray-400"
      />
    </button>
  );
};

export default ThemeToggle;