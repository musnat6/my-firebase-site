
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "arena-clash-gluq9",
  appId: "1:910717335553:web:662665457291397e146800",
  storageBucket: "arena-clash-gluq9.appspot.com",
  apiKey: "AIzaSyDIq4ZPP6rEQuY-4g_2cpMC1iRLIR7KjPo",
  authDomain: "arena-clash-gluq9.firebaseapp.com",
  messagingSenderId: "910717335553"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
