import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faSpinner, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuthStore } from '../store/authStore';
import backendAPI from '../services/BackendAPI';

interface LoginProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  className?: string;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToRegister, className = '' }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'github' | 'google' | null>(null);
  
  const { login, setLoading } = useAuthStore();

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setIsOAuthLoading(provider);
    setErrors([]);
    
    try {
      // Redirect to OAuth provider
      const redirectUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/${provider}`;
      window.location.href = redirectUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth login failed';
      setErrors([errorMessage]);
      setIsOAuthLoading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    setLoading(true);

    try {
      const data = await backendAPI.login(formData.username, formData.password);
      
      // Store user and token in auth store
      login(data.token, data.user);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-md mx-auto bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your AI Pipeline account</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 dark:text-red-400 text-sm">
              <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleOAuthLogin('github')}
          disabled={isLoading || isOAuthLoading !== null}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 
                   text-white font-medium py-3 px-4 rounded-lg
                   transition-colors duration-200 
                   focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                   disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isOAuthLoading === 'github' ? (
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          ) : (
            <FontAwesomeIcon icon={faGithub} className="mr-2" />
          )}
          Continue with GitHub
        </button>

        <button
          onClick={() => handleOAuthLogin('google')}
          disabled={isLoading || isOAuthLoading !== null}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 
                   text-white font-medium py-3 px-4 rounded-lg
                   transition-colors duration-200 
                   focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                   disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isOAuthLoading === 'google' ? (
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          ) : (
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
          )}
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username or Email
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-dark-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your username or email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-dark-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isOAuthLoading !== null}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                   text-white font-medium py-2 px-4 rounded-lg
                   transition-colors duration-200 
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Signing In...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
              Sign In
            </>
          )}
        </button>
      </form>

      {onSwitchToRegister && (
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-500 font-medium hover:underline"
            >
              Sign up here
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;