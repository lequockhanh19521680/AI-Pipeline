import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from '../models/User.js';

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback'
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user already exists with this GitHub ID
    let user = await User.findOne({ 'oauth.providers.github.id': profile.id });
    
    if (user) {
      // Update user info and login time
      user.lastLogin = new Date();
      if (profile.photos && profile.photos[0]) {
        user.oauth.providers.github!.avatar = profile.photos[0].value;
      }
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Link GitHub account to existing user
        if (!user.oauth) {
          user.oauth = { providers: {} };
        }
        user.oauth.providers.github = {
          id: profile.id,
          username: profile.username,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
        };
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    const newUser = new User({
      username: profile.username || `github_${profile.id}`,
      email: email || `${profile.username}@github.local`,
      profile: {
        firstName: profile.displayName ? profile.displayName.split(' ')[0] : '',
        lastName: profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : '',
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
      },
      oauth: {
        providers: {
          github: {
            id: profile.id,
            username: profile.username,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
          }
        }
      },
      lastLogin: new Date()
    });

    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback'
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ 'oauth.providers.google.id': profile.id });
    
    if (user) {
      // Update user info and login time
      user.lastLogin = new Date();
      if (profile.photos && profile.photos[0]) {
        user.oauth.providers.google!.avatar = profile.photos[0].value;
      }
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Link Google account to existing user
        if (!user.oauth) {
          user.oauth = { providers: {} };
        }
        user.oauth.providers.google = {
          id: profile.id,
          email: email,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
        };
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    const newUser = new User({
      username: email ? email.split('@')[0] : `google_${profile.id}`,
      email: email || `${profile.id}@google.local`,
      profile: {
        firstName: profile.name ? profile.name.givenName : '',
        lastName: profile.name ? profile.name.familyName : '',
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
      },
      oauth: {
        providers: {
          google: {
            id: profile.id,
            email: email,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
          }
        }
      },
      lastLogin: new Date()
    });

    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}));

export default passport;