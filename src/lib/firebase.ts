// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development (disabled for now)
// Uncomment the following block if you want to use Firebase emulators
/*
if (process.env.NODE_ENV === 'development') {
  try {
    // Only connect if not already connected
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}
*/

export default app;
