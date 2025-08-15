import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from '../models/User.js';

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackURL: "/api/auth/github/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user already exists with GitHub ID
    let user = await User.findOne({ 'oauth.providers.github.id': profile.id });
    
    if (user) {
      // Update GitHub info if user exists
      user.oauth = user.oauth || { providers: {} };
      user.oauth.providers = user.oauth.providers || {};
      user.oauth.providers.github = {
        id: profile.id,
        username: profile.username,
        avatar: profile.photos?.[0]?.value
      };
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Link GitHub account to existing user
        user.oauth = user.oauth || { providers: {} };
        user.oauth.providers = user.oauth.providers || {};
        user.oauth.providers.github = {
          id: profile.id,
          username: profile.username,
          avatar: profile.photos?.[0]?.value
        };
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    user = new User({
      username: profile.username || `github_${profile.id}`,
      email: email || `${profile.username}@github.local`,
      profile: {
        firstName: profile.displayName?.split(' ')[0] || profile.username,
        lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
        avatar: profile.photos?.[0]?.value
      },
      oauth: {
        providers: {
          github: {
            id: profile.id,
            username: profile.username,
            avatar: profile.photos?.[0]?.value
          }
        }
      },
      lastLogin: new Date()
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: "/api/auth/google/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user already exists with Google ID
    let user = await User.findOne({ 'oauth.providers.google.id': profile.id });
    
    if (user) {
      // Update Google info if user exists
      user.oauth = user.oauth || { providers: {} };
      user.oauth.providers = user.oauth.providers || {};
      user.oauth.providers.google = {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value
      };
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Link Google account to existing user
        user.oauth = user.oauth || { providers: {} };
        user.oauth.providers = user.oauth.providers || {};
        user.oauth.providers.google = {
          id: profile.id,
          email: email,
          avatar: profile.photos?.[0]?.value
        };
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    user = new User({
      username: email?.split('@')[0] || `google_${profile.id}`,
      email: email || `${profile.id}@google.local`,
      profile: {
        firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
        lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
        avatar: profile.photos?.[0]?.value
      },
      oauth: {
        providers: {
          google: {
            id: profile.id,
            email: email,
            avatar: profile.photos?.[0]?.value
          }
        }
      },
      lastLogin: new Date()
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize/Deserialize user for sessions (optional, mainly for OAuth)
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;