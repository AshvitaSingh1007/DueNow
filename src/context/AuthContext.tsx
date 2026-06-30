import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserPreferences } from '../types';

interface AuthContextType {
  userId: string | null;
  currentUser: User | null;
  userProfile: UserProfile | null;
  preferences: UserPreferences | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  googleAccessToken: string | null;
  connectGoogle: () => Promise<string>;
  disconnectGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setUserId(user.uid);
        localStorage.setItem('duenow_user_id', user.uid);
        
        // Restore Google token from sessionStorage if present
        const cachedToken = sessionStorage.getItem('google_access_token');
        if (cachedToken) {
          setGoogleAccessToken(cachedToken);
        }
        
        await fetchUserData(user.uid, user.email || '');
      } else {
        setUserId(null);
        setUserProfile(null);
        setPreferences(null);
        setGoogleAccessToken(null);
        sessionStorage.removeItem('google_access_token');
        localStorage.removeItem('duenow_user_id');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid: string, fallbackEmail: string) => {
    try {
      // Fetch profile
      const profRes = await fetch(`/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${uid}` }
      });
      if (profRes.ok) {
        const profile = await profRes.json();
        // If the profile is empty or auto-bootstrapped placeholder, detect if onboarded
        if (profile && profile.name && profile.name !== 'Alex' && profile.email !== 'user@example.com') {
          setUserProfile(profile);
        } else {
          // If it is the default placeholder, treat as un-onboarded to force voice-first onboarding
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      // Fetch preferences
      const prefRes = await fetch(`/api/user/preferences`, {
        headers: { 'Authorization': `Bearer ${uid}` }
      });
      if (prefRes.ok) {
        const prefs = await prefRes.json();
        setPreferences(prefs);
      }
    } catch (err) {
      console.error('Error retrieving user metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = credential.user.uid;

      // Create a skeleton profile on signup - actual voice-onboarding will populate details
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${uid}`
        },
        body: JSON.stringify({
          email,
          name,
          personality: 'mentor',
          workingHours: { start: '09:00', end: '17:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York' }
        })
      });

      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${uid}`
        },
        body: JSON.stringify({
          voicePreference: 'Zephyr',
          theme: 'light',
          reminderStyle: 'professional'
        })
      });
    } catch (error) {
      console.error('Email sign up failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Adjust provider custom parameters if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserId(null);
      setCurrentUser(null);
      setUserProfile(null);
      setPreferences(null);
      localStorage.removeItem('duenow_user_id');
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileUpdates: Partial<UserProfile>) => {
    if (!userId) return;
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(profileUpdates)
      });
      const updated = await response.json();
      setUserProfile(updated);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const updatePreferences = async (prefUpdates: Partial<UserPreferences>) => {
    if (!userId) return;
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify(prefUpdates)
      });
      const updated = await response.json();
      setPreferences(updated);
    } catch (error) {
      console.error('Preferences update failed:', error);
      throw error;
    }
  };

  const connectGoogle = async (): Promise<string> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.setCustomParameters({ prompt: 'consent' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        sessionStorage.setItem('google_access_token', credential.accessToken);
        await updateProfile({
          googleConnected: true,
          googleConnectedAt: Date.now(),
          googleScopes: ['calendar', 'drive.readonly', 'gmail.readonly']
        });
        return credential.accessToken;
      }
      throw new Error('No access token returned');
    } catch (error) {
      console.error('Google connection failed:', error);
      throw error;
    }
  };

  const disconnectGoogle = async () => {
    setGoogleAccessToken(null);
    sessionStorage.removeItem('google_access_token');
    await updateProfile({
      googleConnected: false,
      googleConnectedAt: undefined,
      googleScopes: []
    });
  };

  return (
    <AuthContext.Provider value={{
      userId,
      currentUser,
      userProfile,
      preferences,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      resetPassword,
      logout,
      updateProfile,
      updatePreferences,
      googleAccessToken,
      connectGoogle,
      disconnectGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
