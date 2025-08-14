import React, { useState, useEffect } from 'react';
import { useAuthStore, User } from '../store/authStore';
import backendAPI from '../services/BackendAPI';

interface ProfileProps {
  onClose?: () => void;
  className?: string;
}

const Profile: React.FC<ProfileProps> = ({ onClose, className = '' }) => {
  const { user, token, logout, updateUser, setLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoadingLocal] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    theme: user?.preferences?.theme || 'dark',
    notifications: user?.preferences?.notifications ?? true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        theme: user.preferences?.theme || 'dark',
        notifications: user.preferences?.notifications ?? true
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear messages when user starts editing
    if (errors.length > 0) setErrors([]);
    if (successMessage) setSuccessMessage('');
  };

  const handleSave = async () => {
    setErrors([]);
    setSuccessMessage('');
    setIsLoadingLocal(true);
    setLoading(true);

    try {
      const updatedUser = await backendAPI.updateProfile(token!, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferences: {
          theme: formData.theme as 'light' | 'dark',
          notifications: formData.notifications
        }
      });

      // Update user in auth store
      updateUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors([errorMessage]);
    } finally {
      setIsLoadingLocal(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  if (!user) {
    return (
      <div className={`max-w-md mx-auto bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 text-center">No user logged in</p>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Profile Avatar */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full text-white text-2xl font-bold">
          {user.profile?.firstName?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          {user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.username}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
      </div>

      {/* Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 dark:text-red-400 text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          ))}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
          <p className="text-green-600 dark:text-green-400 text-sm">
            <i className="fas fa-check-circle mr-2"></i>
            {successMessage}
          </p>
        </div>
      )}

      {/* Profile Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            value={user.username}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white opacity-50 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white opacity-50 cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-dark-700 text-gray-900 dark:text-white
                       ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'opacity-50 cursor-not-allowed'}
                       placeholder-gray-500 dark:placeholder-gray-400`}
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-dark-700 text-gray-900 dark:text-white
                       ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'opacity-50 cursor-not-allowed'}
                       placeholder-gray-500 dark:placeholder-gray-400`}
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Theme
          </label>
          <select
            name="theme"
            value={formData.theme}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-dark-700 text-gray-900 dark:text-white
                     ${isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'opacity-50 cursor-not-allowed'}`}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="notifications"
            name="notifications"
            checked={formData.notifications}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`h-4 w-4 text-blue-600 border-gray-300 rounded
                     ${isEditing ? 'focus:ring-blue-500' : 'opacity-50 cursor-not-allowed'}`}
          />
          <label htmlFor="notifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Enable notifications
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {isEditing ? (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                       text-white font-medium py-2 px-4 rounded-lg
                       transition-colors duration-200 
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setErrors([]);
                setSuccessMessage('');
                // Reset form data
                setFormData({
                  firstName: user.profile?.firstName || '',
                  lastName: user.profile?.lastName || '',
                  theme: user.preferences?.theme || 'dark',
                  notifications: user.preferences?.notifications ?? true
                });
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg
                       transition-colors duration-200"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg
                     transition-colors duration-200"
          >
            <i className="fas fa-edit mr-2"></i>
            Edit Profile
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg
                   transition-colors duration-200"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;