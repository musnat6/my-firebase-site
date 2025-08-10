
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "arena-clash-gluq9",
  appId: "1:910717335553:web:662665457291397e146800",
  storageBucket: "arena-clash-gluq9.firebasestorage.app",
  apiKey: "AIzaSyDIq4ZPP6rEQuY-4g_2cpMC1iRLIR7KjPo",
  authDomain: "arena-clash-gluq9.firebaseapp.com",
  messagingSenderId: "910717335553"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
