"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";
import { demoUsers } from "@/lib/demo-data";

type FirebaseAuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified?: boolean;
  reload?: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

type RegisterProfileInput = {
  name?: string;
  role?: UserRole;
  fieldA?: string;
  fieldB?: string;
  fieldC?: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  firebaseUser: FirebaseAuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string, profile?: RegisterProfileInput) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function createFallbackProfile(currentUser: FirebaseAuthUser): UserProfile {
  const nameFromEmail = currentUser.email?.split("@")[0] ?? "User";
  return {
    _id: currentUser.uid,
    email: currentUser.email ?? "",
    name: currentUser.displayName ?? nameFromEmail,
    role: "student"
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(demoUsers[0] ?? null);
  const [loading, setLoading] = useState(true);
  const registeringUidRef = useRef<string | null>(null);

  const setServerSession = async (idToken: string) => {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      throw new Error("SESSION_SET_FAILED");
    }
  };

  const clearServerSession = async () => {
    await fetch("/api/auth/session", {
      method: "DELETE"
    });
  };

  const runSignInPreflight = async (email: string) => {
    const response = await fetch("/api/auth/preflight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      return;
    }

    let errorCode = "SIGNIN_PRECHECK_FAILED";
    try {
      const data = (await response.json()) as { code?: string };
      if (data.code) {
        errorCode = data.code;
      }
    } catch {
      // Keep fallback error code.
    }

    throw new Error(errorCode);
  };

  const syncUserWithDatabase = async (
    currentUser: FirebaseAuthUser,
    profile?: RegisterProfileInput
  ): Promise<UserProfile | null> => {
    if (!currentUser.email) {
      return null;
    }

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firebaseUid: currentUser.uid,
        email: currentUser.email.toLowerCase(),
        name: profile?.name ?? currentUser.displayName ?? currentUser.email.split("@")[0],
        role: profile?.role,
        university: profile?.fieldA,
        contact: profile?.fieldC,
        roleDetails: profile
          ? {
              fieldA: profile.fieldA ?? "",
              fieldB: profile.fieldB ?? "",
              fieldC: profile.fieldC ?? ""
            }
          : undefined
      })
    });

    if (!response.ok) {
      let errorCode = "ACCOUNT_SYNC_FAILED";
      let errorDetail: string | undefined;
      try {
        const errorData = (await response.json()) as { code?: string; error?: string };
        if (errorData.code) errorCode = errorData.code;
        if (errorData.error) errorDetail = errorData.error;
      } catch {
        // Fall through to generic sync error.
      }
      throw new Error(errorDetail ?? errorCode);
    }

    const data = (await response.json()) as { user?: UserProfile };
    return data.user ?? null;
  };

  const enforceUserAccess = async (profile: UserProfile | null) => {
    if (!profile) {
      return;
    }

    if (profile.isDeleted || profile.status === "blocked" || profile.subscription?.status === "blocked") {
      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth);
      }
      await clearServerSession();
      throw new Error("ACCOUNT_BLOCKED");
    }
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      // Demo mode when Firebase is not configured.
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (currentUser: FirebaseAuthUser | null) => {
      setFirebaseUser(currentUser);
      if (currentUser?.email) {
        if (registeringUidRef.current === currentUser.uid) {
          setLoading(false);
          return;
        }
        try {
          const idToken = await currentUser.getIdToken();
          await setServerSession(idToken);
          const syncedUser = await syncUserWithDatabase(currentUser);
          if (syncedUser) {
            setUser(syncedUser);
          } else {
            setUser(createFallbackProfile(currentUser));
          }
        } catch {
          const matched = demoUsers.find((demoUser) => demoUser.email === currentUser.email);
          setUser(matched ?? createFallbackProfile(currentUser));
        }
      } else {
        registeringUidRef.current = null;
        try {
          await clearServerSession();
        } catch {
          // Ignore session clear failures during sign-out transitions.
        }
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
    await runSignInPreflight(email);

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const signedInUser = credential.user as FirebaseAuthUser;
    if (signedInUser.reload) {
      await signedInUser.reload();
    }

    if (!signedInUser.emailVerified) {
      await signOut(auth);
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const idToken = await signedInUser.getIdToken(true);
    await setServerSession(idToken);
    const syncedUser = await syncUserWithDatabase(signedInUser);
    await enforceUserAccess(syncedUser);
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(demoUsers[0] ?? null);
      return;
    }
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const signedInUser = credential.user as FirebaseAuthUser;
    const idToken = await signedInUser.getIdToken(true);
    await setServerSession(idToken);
    const syncedUser = await syncUserWithDatabase(signedInUser);
    await enforceUserAccess(syncedUser);
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    profile?: RegisterProfileInput
  ) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(demoUsers[0] ?? null);
      return;
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    registeringUidRef.current = credential.user.uid;

    try {
      const idToken = await credential.user.getIdToken(true);
      await setServerSession(idToken);
      const syncedUser = await syncUserWithDatabase(credential.user, profile);
      if (!syncedUser) {
        throw new Error("ACCOUNT_SYNC_FAILED");
      }

      const verificationResponse = await fetch("/api/auth/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          continueUrl: `${window.location.origin}/login?mode=signin&verified=1`
        })
      });
      if (!verificationResponse.ok) {
        throw new Error("VERIFICATION_EMAIL_SEND_FAILED");
      }

      setUser(syncedUser);
      await signOut(auth);
      await clearServerSession();
    } catch (error) {
      try {
        await deleteUser(credential.user);
      } catch {
        // Best-effort rollback if post-create steps fail.
      }
      await clearServerSession();
      throw error;
    } finally {
      registeringUidRef.current = null;
    }
  };

  const requestPasswordReset = async (email: string) => {
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        continueUrl: `${window.location.origin}/login?mode=signin`
      })
    });

    if (!response.ok) {
      throw new Error("PASSWORD_RESET_FAILED");
    }
  };

  const signOutUser = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(null);
      await clearServerSession();
      return;
    }
    await signOut(auth);
    await clearServerSession();
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithEmail,
    signInWithGoogle,
    registerWithEmail,
    requestPasswordReset,
    signOutUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
