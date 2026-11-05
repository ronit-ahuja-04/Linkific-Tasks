import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Setup Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// We request calendar scopes so we can sync calendar events when they login with Google
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// True when real keys are present. Without them the app shows the sign-in screen but every
// Firebase call is skipped, instead of failing with a network error.
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && firebaseConfig.apiKey !== 'YOUR_API_KEY';
