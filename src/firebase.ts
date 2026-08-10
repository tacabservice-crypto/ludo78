import * as admin from 'firebase-admin';

let isFirebaseInitialized = false;

function initializeFirebase() {
  if (isFirebaseInitialized || admin.apps.length > 0) {
    isFirebaseInitialized = true;
    return;
  }

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountEnv) {
      const serviceAccount = JSON.parse(Buffer.from(serviceAccountEnv, 'base64').toString('ascii'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
      isFirebaseInitialized = true;
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Firebase Admin SDK not initialized.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

/**
 * Lazily gets the Firebase Auth service object.
 * Initializes the Firebase Admin SDK on the first call.
 * @returns The Firebase Auth service object, or null if initialization fails.
 */
export function getAuth() {
  initializeFirebase();
  if (!isFirebaseInitialized) {
    return null;
  }
  return admin.auth();
}
