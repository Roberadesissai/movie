/* eslint-disable @typescript-eslint/no-explicit-any */
// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { projectAuth, projectFirestore } from "@/firebase/config";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, username: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(projectAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerUser = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await createUserWithEmailAndPassword(projectAuth, email, password);
      
      await updateProfile(res.user, { displayName: username });
      
      await setDoc(doc(projectFirestore, 'users', res.user.uid), {
        username,
        email,
        createdAt: serverTimestamp(),
        watchlist: [],
        settings: {
          emailNotifications: true,
          darkMode: true
        }
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInUser = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await signInWithEmailAndPassword(projectAuth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(projectAuth, provider);
      
      // Create user document if it doesn't exist
      await setDoc(doc(projectFirestore, 'users', result.user.uid), {
        username: result.user.displayName,
        email: result.user.email,
        createdAt: serverTimestamp(),
        watchlist: [],
        settings: {
          emailNotifications: true,
          darkMode: true
        }
      }, { merge: true });

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Similar implementation for GitHub
  const signInWithGithub = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(projectAuth, provider);
      
      await setDoc(doc(projectFirestore, 'users', result.user.uid), {
        username: result.user.displayName,
        email: result.user.email,
        createdAt: serverTimestamp(),
        watchlist: [],
        settings: {
          emailNotifications: true,
          darkMode: true
        }
      }, { merge: true });

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      if (user) {
        await updateDoc(doc(projectFirestore, 'users', user.uid), {
          lastActive: serverTimestamp()
        });
      }
      await signOut(projectAuth);
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(projectAuth, email);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const value = {
    user,
    loading,
    error,
    signInUser,
    registerUser,
    logoutUser,
    forgotPassword,
    signInWithGoogle,
    signInWithGithub
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};