// components/AuthContext.tsx
'use client'; // This component uses client-side hooks and Firebase client SDKs

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig'; // Adjust path if needed. This imports the client-side Firebase Auth instance.

// 1. Define the shape of your AuthContext values
interface AuthContextType {
  user: User | null; // The Firebase User object, or null if not logged in
  loading: boolean; // True while authentication state is being determined
  signup: (email: string, password: string) => Promise<any>; // Returns a Promise from Firebase auth operation
  signin: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>; // Returns a Promise that resolves when logged out
}

// 2. Create the context. Initialize with undefined to indicate it's not yet provided.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Define props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode; // Children are what the provider wraps (your entire app)
}

// 4. Create the AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start loading as true

  // Effect to listen for Firebase Auth state changes
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update user state
      setLoading(false); // Set loading to false once auth state is known
    });

    // Cleanup function: unsubscribe from the listener when component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  // Authentication functions that interact with Firebase Auth
  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signin = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    return signOut(auth);
  };

  // 5. Bundle the context values
  const value: AuthContextType = {
    user,
    loading,
    signup,
    signin,
    signInWithGoogle,
    logout,
  };

  // 6. Provide the context value to children
  // Only render children when loading is false to prevent flickering/redirect issues
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 7. Custom hook to easily consume the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error will be thrown if useAuth is called outside of AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
