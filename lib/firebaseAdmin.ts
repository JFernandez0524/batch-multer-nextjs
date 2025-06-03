// lib/firebaseAdmin.ts
// Core app initialization functions
import {
  initializeApp,
  getApps,
  getApp,
  applicationDefault,
} from 'firebase-admin/app'; // <-- 'applicationDefault' is imported here
// Specific service functions and their types
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Check if a Firebase app is already initialized
let adminApp;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: applicationDefault(), // <-- CORRECTED LINE! No 'admin.credential.' needed.
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} else {
  adminApp = getApp();
}

// Get specific service instances
const adminDb: Firestore = getFirestore(adminApp);
const adminAuth: Auth = getAuth(adminApp);
const adminStorage: Storage = getStorage(adminApp);

export { adminDb, adminAuth, adminStorage };
