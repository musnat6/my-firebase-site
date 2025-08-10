
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "arena-clash-gluq9",
  appId: "1:910717335553:web:662665457291397e146800",
  storageBucket: "arena-clash-gluq9.firebasestorage.app",
  apiKey: "AIzaSyDIq4ZPP6rEQuY-4g_2cpMC1iRLIR7KjPo",
  authDomain: "arena-clash-gluq9.firebaseapp.com",
  messagingSenderId: "910717335553"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
