import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Local testing: VITE_USE_EMULATORS=true points the app at the Firebase emulators (see
// firebase.json and e2e/). It only works with a demo-* project id, so it can never touch real data.
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// True when real keys are present (see .env.example). getAuth() throws
// "auth/invalid-api-key" for an empty key, so without keys Firebase is not initialised at all:
// the app still loads and shows the sign-in page, and sign-in explains that keys are missing.
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && firebaseConfig.apiKey !== 'YOUR_API_KEY';

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// Firebase services (null when not configured; only used after a successful sign-in)
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (app && useEmulators) {
  if (!String(firebaseConfig.projectId).startsWith('demo-')) {
    throw new Error('VITE_USE_EMULATORS needs a demo-* VITE_FIREBASE_PROJECT_ID, to protect real data.');
  }
  connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8189);
}

// Setup Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// We request calendar scopes so we can sync calendar events when they login with Google
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
