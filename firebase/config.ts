import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, serverTimestamp, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFmTgWMUyfIQ6Q2sdtv7KBgrdhyKmy4T0",
  authDomain: "arcaureus-stream.firebaseapp.com",
  projectId: "arcaureus-stream",
  storageBucket: "arcaureus-stream.firebasestorage.app",
  messagingSenderId: "677771098796",
  appId: "1:677771098796:web:f62a31081671ce4df9bd09",
  measurementId: "G-EW90SGN893"
};

// Initialize Firebase - only initialize if an app hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firebase services
const projectFirestore = getFirestore(app);
enableIndexedDbPersistence(projectFirestore).catch((err) => {
  console.error('Persistence error:', err);
});
const projectAuth = getAuth(app);
const projectStorage = getStorage(app);

// Timestamp
const timestamp = serverTimestamp;

export { 
  projectFirestore, 
  projectAuth, 
  projectStorage, 
  timestamp,
  serverTimestamp 
}; 