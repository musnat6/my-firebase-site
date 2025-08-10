
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // This case might happen if user signed up but doc creation failed
          // Or for Google sign-in on first login
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            username: firebaseUser.displayName || 'New User',
            profilePic: firebaseUser.photoURL || `https://placehold.co/100x100`,
            balance: 0,
            role: 'player',
            stats: { wins: 0, losses: 0, earnings: 0 },
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username, photoURL: `https://placehold.co/100x100` });

    const newUser: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      username: username,
      profilePic: userCredential.user.photoURL!,
      balance: 0,
      role: 'player',
      stats: { wins: 0, losses: 0, earnings: 0 },
    };
    await setDoc(doc(db, 'users', newUser.uid), newUser);
    setUser(newUser);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
