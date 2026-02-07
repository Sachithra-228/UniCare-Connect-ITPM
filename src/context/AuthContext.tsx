"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { demoUsers } from "@/lib/demo-data";

type AuthContextValue = {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(demoUsers[0] ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      // Demo mode when Firebase is not configured.
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser?.email) {
        const matched = demoUsers.find((demoUser) => demoUser.email === currentUser.email);
        setUser(matched ?? demoUsers[0] ?? null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(demoUsers[0] ?? null);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(demoUsers[0] ?? null);
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const registerWithEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(demoUsers[0] ?? null);
      return;
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
  };

  const requestPasswordReset = async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const signOutUser = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      signInWithEmail,
      signInWithGoogle,
      registerWithEmail,
      requestPasswordReset,
      signOutUser
    }),
    [user, firebaseUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
