
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component to wrap the app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUser(userDoc.data() as User);
            } else {
              // This case handles Google sign-in for the first time or if user doc is missing
              const newUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };
  
  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      const newUser: User = {
        uid: firebaseUser.uid,
        email: email,
        username: username,
        profilePic: `https://placehold.co/100x100`,
        balance: 0,
        role: 'player',
        stats: { wins: 0, losses: 0, earnings: 0 },
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      // No need to set user state here, onAuthStateChanged will handle it
      router.push('/');
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
