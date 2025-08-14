import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { generateToken, AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/auth/register - Register a new user
router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email or username already exists'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        profile: {
          firstName,
          lastName
        }
      });

      await user.save();

      // Generate token
      const token = generateToken((user._id as any).toString());

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }
);

// POST /api/auth/login - Login user
router.post('/login',
  [
    body('login').trim().isLength({ min: 1 }).withMessage('Username or email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { login, password } = req.body;

      // Find user by username or email
      const user = await User.findOne({
        $or: [
          { email: login },
          { username: login }
        ]
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken((user._id as any).toString());

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }
);

// GET /api/auth/me - Get current user profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: req.user?.toJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', 
  requireAuth,
  [
    body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters'),
    body('preferences.theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
    body('preferences.notifications').optional().isBoolean().withMessage('Notifications must be a boolean')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { firstName, lastName, preferences } = req.body;

      if (firstName !== undefined) user.profile.firstName = firstName;
      if (lastName !== undefined) user.profile.lastName = lastName;
      if (preferences) {
        if (preferences.theme) user.preferences.theme = preferences.theme;
        if (preferences.notifications !== undefined) user.preferences.notifications = preferences.notifications;
      }

      await user.save();

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

// POST /api/auth/change-password - Change password
router.post('/change-password',
  requireAuth,
  [
    body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
);

export default router;