import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to clone Firebase User object to trigger React state updates while preserving all prototype methods and internal private fields
const cloneUser = (user: User | null): User | null => {
  if (!user) return null;
  return new Proxy(user, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  }) as User;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user with Email + Password, then set their display name
  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // Clone using proxy to force react re-render while keeping prototype and private fields working
      setCurrentUser(cloneUser(auth.currentUser));
    } finally {
      setLoading(false);
    }
  };

  // Sign in existing user with Email + Password
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  // Sign in using Google popup
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  };

  // Sign out user
  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      setLoading(false);
    }
  };

  // Send forgot password reset email
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update profile details
  const updateUserProfile = async (displayName: string, photoURL?: string | null) => {
    if (!auth.currentUser) throw new Error('No authenticated user found');
    await updateProfile(auth.currentUser, { 
      displayName, 
      photoURL: photoURL !== undefined ? photoURL : auth.currentUser.photoURL 
    });
    // Clone using proxy to force react re-render while keeping prototype and private fields working
    setCurrentUser(cloneUser(auth.currentUser));
  };

  // Bind auth state observer on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
