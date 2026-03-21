import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebase-config';

// Validar que todas las credenciales estén presentes
if (!firebaseConfig.apiKey) {
  throw new Error('Firebase configuration is missing.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional: Initialize Realtime Database if needed
let database;
try {
  database = getDatabase(app);
} catch (error) {
  console.log('Realtime Database not configured');
}

export { app, database };
