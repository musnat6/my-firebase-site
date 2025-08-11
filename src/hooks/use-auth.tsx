
'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Auth,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  getFirestore,
  Firestore,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

import { app } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, username: string, efootballUsername: string, profilePic: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth: Auth = getAuth(app);
  const db: Firestore = getFirestore(app);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const userUnsubscribe = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          }
          // The creation of the user document is now handled exclusively in the signUpWithEmail function
          // This prevents issues where an auth record might exist without a username during sign-up.
          setLoading(false);
        });

        return () => userUnsubscribe();

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, [auth, db]);

  const signUpWithEmail = async (email: string, password: string, username: string, efootballUsername: string, profilePic: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      username: username,
      efootballUsername: efootballUsername,
      profilePic: profilePic,
      balance: 0,
      role: 'player',
      stats: { wins: 0, losses: 0, earnings: 0 },
    };
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);
    // The onSnapshot listener will automatically pick up the new user document and set the state.
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
