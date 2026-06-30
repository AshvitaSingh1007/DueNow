import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

// Lazy initialization pattern to prevent crashes if config is not yet generated
export function getFirebaseConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.warn('⚠️ firebase-applet-config.json is missing! Please run set_up_firebase first.');
    return null;
  }
  try {
    const rawData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Failed to parse firebase-applet-config.json:', error);
    return null;
  }
}

export function initFirebase() {
  if (firebaseApp) return { app: firebaseApp, db: firestoreDb!, auth: firebaseAuth! };

  const config = getFirebaseConfig();
  if (!config) {
    throw new Error('Firebase is not configured yet. Please run the set_up_firebase workflow in the AI Studio.');
  }

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config);
    }
    // Note: Standard Firestore initialization using config.firestoreDatabaseId if present
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);

    console.log('✅ Firebase initialized successfully.');
    return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
}

export function getDb(): Firestore {
  const { db } = initFirebase();
  if (!db) throw new Error('Firestore database is not initialized.');
  return db;
}

export function getAuthService(): Auth {
  const { auth } = initFirebase();
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  return auth;
}
