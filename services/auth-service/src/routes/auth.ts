import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import passport from '../config/passport.js';
import { User } from '../models/User.js';
import { 
  generateToken, 
  requireAuth, 
  AuthenticatedRequest 
} from '../middleware/auth.js';
import '../types/express.js';

const router = express.Router();

// POST /api/auth/register - User registration
router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, email, password, profile } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        profile: {
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || ''
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
        },
        message: 'User registered successfully'
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

// POST /api/auth/login - User login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
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
    const user = (req as AuthenticatedRequest).user;
    res.json({
      success: true,
      data: user?.toJSON()
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
router.put('/profile', requireAuth,
  [
    body('profile.firstName').optional().trim().isLength({ max: 50 }),
    body('profile.lastName').optional().trim().isLength({ max: 50 }),
    body('profile.avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
    body('preferences.theme').optional().isIn(['light', 'dark']),
    body('preferences.notifications').optional().isBoolean()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = (req as AuthenticatedRequest).user!;
      const { profile, preferences } = req.body;

      if (profile) {
        user.profile = { ...user.profile, ...profile };
      }

      if (preferences) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      await user.save();

      res.json({
        success: true,
        data: user.toJSON(),
        message: 'Profile updated successfully'
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
router.post('/change-password', requireAuth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = (req as AuthenticatedRequest).user!;
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

// OAuth Routes

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', 
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=github_auth_failed' }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const token = generateToken(user._id.toString());
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}?token=${token}&login=success`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect('/login?error=github_callback_failed');
    }
  }
);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const token = generateToken(user._id.toString());
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}?token=${token}&login=success`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login?error=google_callback_failed');
    }
  }
);

// POST /api/auth/logout - Logout (mainly for session cleanup)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/verify - Verify token (for other microservices)
router.get('/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = (req as AuthenticatedRequest).user!;
  res.json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    }
  });
});

export default router;